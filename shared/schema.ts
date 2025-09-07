import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['owner', 'editor', 'viewer']);
export const notificationTypeEnum = pgEnum('notification_type', ['collaboration_invite', 'collaboration_accepted', 'collaboration_declined']);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  isActive: boolean("is_active").notNull().default(true),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  isActive: boolean("is_active").notNull().default(true),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  maxDaysPerTask: integer("max_days_per_task").notNull().default(3),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  team: varchar("team", { length: 50 }).notNull(),
  days: integer("days").notNull(),
  parallelGroup: varchar("parallel_group", { length: 50 }), // Tasks with same group run in parallel
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const portfolioCollaborators = pgTable("portfolio_collaborators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: collaboratorRoleEnum("role").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  invitedAt: timestamp("invited_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, declined
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string for additional data (e.g., portfolioId, collaboratorId)
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  systemSettings: many(systemSettings),
  portfolioCollaborations: many(portfolioCollaborators),
  invitedCollaborations: many(portfolioCollaborators, {
    relationName: "invitedBy"
  }),
  notifications: many(notifications),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  collaborators: many(portfolioCollaborators),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [tasks.portfolioId],
    references: [portfolios.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id],
  }),
}));

export const portfolioCollaboratorsRelations = relations(portfolioCollaborators, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [portfolioCollaborators.portfolioId],
    references: [portfolios.id],
  }),
  user: one(users, {
    fields: [portfolioCollaborators.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [portfolioCollaborators.invitedBy],
    references: [users.id],
    relationName: "invitedBy"
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Password must contain letters and numbers"),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  portfolioId: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedBy: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioCollaboratorSchema = createInsertSchema(portfolioCollaborators).omit({
  id: true,
  invitedAt: true,
  acceptedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type PortfolioCollaborator = typeof portfolioCollaborators.$inferSelect;
export type InsertPortfolioCollaborator = z.infer<typeof insertPortfolioCollaboratorSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Login schema
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Portfolio with tasks and collaborators
export type PortfolioWithTasks = Portfolio & {
  tasks: Task[];
  user: Pick<User, 'id' | 'username' | 'fullName'>;
  collaborators?: Array<PortfolioCollaborator & {
    user: Pick<User, 'id' | 'username' | 'fullName'>;
    inviter: Pick<User, 'id' | 'username' | 'fullName'>;
  }>;
};

// Collaboration role constants
export const COLLABORATION_ROLES = {
  OWNER: 'owner' as const,
  EDITOR: 'editor' as const,
  VIEWER: 'viewer' as const,
} as const;

export type CollaborationRole = typeof COLLABORATION_ROLES[keyof typeof COLLABORATION_ROLES];
