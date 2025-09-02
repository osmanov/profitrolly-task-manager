import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertPortfolioSchema, insertTaskSchema, insertSystemSettingsSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";

interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Middleware for authentication
const authenticateToken = async (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware for admin-only routes
const requireAdmin = (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { usernameOrEmail, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolios = await storage.getPortfolios(req.user!.id);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolioWithTasks(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/portfolios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolioData = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio({
        ...portfolioData,
        userId: req.user!.id,
      });

      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const portfolioData = insertPortfolioSchema.partial().parse(req.body);
      const updated = await storage.updatePortfolio(req.params.id, portfolioData);

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deletePortfolio(req.params.id);
      if (success) {
        res.json({ message: "Portfolio deleted successfully" });
      } else {
        res.status(400).json({ message: "Failed to delete portfolio" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Task routes
  app.get("/api/portfolios/:id/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const tasks = await storage.getTasks(req.params.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/portfolios/:id/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({
        ...taskData,
        portfolioId: req.params.id,
      });

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const portfolio = await storage.getPortfolio(task.portfolioId);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const taskData = insertTaskSchema.partial().parse(req.body);
      const updated = await storage.updateTask(req.params.id, taskData);

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const portfolio = await storage.getPortfolio(task.portfolioId);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Check if user owns the portfolio or is admin
      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteTask(req.params.id);
      if (success) {
        res.json({ message: "Task deleted successfully" });
      } else {
        res.status(400).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings routes (admin only)
  app.get("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings || { maxDaysPerTask: 3 });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const settingsData = insertSystemSettingsSchema.parse(req.body);
      const settings = await storage.updateSystemSettings({
        ...settingsData,
        updatedBy: req.user!.id,
      });

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Utility routes
  app.get("/api/risks/table", (req, res) => {
    const riskTable = [
      { totalDays: 2, riskDays: 1 },
      { totalDays: "3-7", riskDays: 2 },
      { totalDays: "8-12", riskDays: 3 },
      { totalDays: "13-17", riskDays: 4 },
      { totalDays: "18-22", riskDays: 5 },
      { totalDays: "23-27", riskDays: 6 },
      { totalDays: "28-30", riskDays: 7 },
      { totalDays: "30+", riskDays: 7 },
    ];
    res.json(riskTable);
  });

  app.get("/api/holidays/2025", (req, res) => {
    const holidays = [
      "2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06", "2025-01-07", "2025-01-08",
      "2025-02-22", "2025-02-23",
      "2025-03-08", "2025-03-09",
      "2025-05-01", "2025-05-02", "2025-05-03", "2025-05-04",
      "2025-05-08", "2025-05-09", "2025-05-10", "2025-05-11",
      "2025-06-12", "2025-06-13", "2025-06-14", "2025-06-15",
      "2025-11-02", "2025-11-03", "2025-11-04",
      "2025-12-31",
    ];
    res.json(holidays);
  });

  const httpServer = createServer(app);
  return httpServer;
}
