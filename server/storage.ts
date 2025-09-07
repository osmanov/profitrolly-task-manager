import {
  users,
  portfolios,
  tasks,
  systemSettings,
  teams,
  type User,
  type InsertUser,
  type Portfolio,
  type InsertPortfolio,
  type Task,
  type InsertTask,
  type SystemSettings,
  type InsertSystemSettings,
  type Team,
  type InsertTeam,
  type PortfolioWithTasks,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Portfolios (all portfolios are now public to all users)
  getAllPortfolios(): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  getPortfolioWithTasks(id: string): Promise<PortfolioWithTasks | undefined>;
  createPortfolio(portfolio: InsertPortfolio & { userId: string }): Promise<Portfolio>;
  updatePortfolio(id: string, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: string): Promise<boolean>;
  
  // Tasks
  getTasks(portfolioId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask & { portfolioId: string }): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // System Settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: InsertSystemSettings & { updatedBy: string }): Promise<SystemSettings>;
  
  // Teams
  getTeams(): Promise<Team[]>;
  getActiveTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      eq(users.username, usernameOrEmail)
    );
    if (user) return user;

    const [emailUser] = await db.select().from(users).where(
      eq(users.email, usernameOrEmail)
    );
    return emailUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { password, ...userWithoutPassword } = insertUser;
    const [user] = await db
      .insert(users)
      .values({
        ...userWithoutPassword,
        passwordHash: password,
      })
      .returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          or(
            ilike(users.username, `%${query}%`),
            ilike(users.fullName, `%${query}%`),
            ilike(users.email, `%${query}%`)
          )
        )
      )
      .limit(10);
  }

  // All portfolios are now public - any authenticated user can see them
  async getAllPortfolios(): Promise<Portfolio[]> {
    return await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.isArchived, false))
      .orderBy(desc(portfolios.createdAt));
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id));
    return portfolio;
  }

  async getPortfolioWithTasks(id: string): Promise<PortfolioWithTasks | undefined> {
    const [portfolio] = await db
      .select({
        id: portfolios.id,
        name: portfolios.name,
        userId: portfolios.userId,
        startDate: portfolios.startDate,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
        isArchived: portfolios.isArchived,
        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
        },
      })
      .from(portfolios)
      .leftJoin(users, eq(portfolios.userId, users.id))
      .where(eq(portfolios.id, id));

    if (!portfolio || !portfolio.user) {
      return undefined;
    }

    const portfolioTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.portfolioId, id))
      .orderBy(asc(tasks.orderIndex));

    return {
      ...portfolio,
      user: portfolio.user,
      tasks: portfolioTasks,
    };
  }

  async createPortfolio(portfolioData: InsertPortfolio & { userId: string }): Promise<Portfolio> {
    const [portfolio] = await db
      .insert(portfolios)
      .values(portfolioData)
      .returning();
    return portfolio;
  }

  async updatePortfolio(id: string, portfolioData: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const [portfolio] = await db
      .update(portfolios)
      .set(portfolioData)
      .where(eq(portfolios.id, id))
      .returning();
    return portfolio;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    const result = await db
      .delete(portfolios)
      .where(eq(portfolios.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTasks(portfolioId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.portfolioId, portfolioId))
      .orderBy(asc(tasks.orderIndex));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task;
  }

  async createTask(taskData: InsertTask & { portfolioId: string }): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [settings] = await db
      .select()
      .from(systemSettings)
      .orderBy(desc(systemSettings.updatedAt))
      .limit(1);
    return settings;
  }

  async updateSystemSettings(settingsData: InsertSystemSettings & { updatedBy: string }): Promise<SystemSettings> {
    const [settings] = await db
      .insert(systemSettings)
      .values(settingsData)
      .returning();
    return settings;
  }

  async getTeams(): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .orderBy(asc(teams.name));
  }

  async getActiveTeams(): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.isActive, true))
      .orderBy(asc(teams.name));
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(teamData)
      .returning();
    return team;
  }

  async updateTeam(id: string, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(teamData)
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await db
      .delete(teams)
      .where(eq(teams.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();