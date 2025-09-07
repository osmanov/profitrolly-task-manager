import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertPortfolioSchema, insertTaskSchema, insertSystemSettingsSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Middleware for authentication
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections per portfolio
  const portfolioConnections = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws: WebSocket, request) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_portfolio':
            const portfolioId = message.portfolioId;
            if (!portfolioConnections.has(portfolioId)) {
              portfolioConnections.set(portfolioId, new Set());
            }
            portfolioConnections.get(portfolioId)!.add(ws);
            
            // Store user info on the websocket
            (ws as any).userId = message.userId;
            (ws as any).username = message.username;
            (ws as any).portfolioId = portfolioId;
            
            // Notify user joined
            ws.send(JSON.stringify({
              type: 'joined_portfolio',
              portfolioId: portfolioId
            }));
            break;
            
          case 'portfolio_update':
            // Broadcast portfolio changes to all connected users
            const targetPortfolioId = message.portfolioId;
            const connections = portfolioConnections.get(targetPortfolioId);
            if (connections) {
              connections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'portfolio_changed',
                    portfolioId: targetPortfolioId,
                    data: message.data
                  }));
                }
              });
            }
            break;
            
          case 'task_update':
            // Broadcast task changes
            const taskPortfolioId = message.portfolioId;
            const taskConnections = portfolioConnections.get(taskPortfolioId);
            if (taskConnections) {
              taskConnections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'task_changed',
                    portfolioId: taskPortfolioId,
                    taskId: message.taskId,
                    data: message.data
                  }));
                }
              });
            }
            break;
            
          case 'field_focus':
            // Broadcast field focus to other users
            const focusPortfolioId = message.portfolioId;
            const focusConnections = portfolioConnections.get(focusPortfolioId);
            if (focusConnections) {
              focusConnections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'user_field_focus',
                    portfolioId: focusPortfolioId,
                    fieldId: message.fieldId,
                    taskId: message.taskId,
                    userId: (ws as any).userId,
                    username: (ws as any).username
                  }));
                }
              });
            }
            break;
            
          case 'field_blur':
            // Broadcast field blur to other users
            const blurPortfolioId = message.portfolioId;
            const blurConnections = portfolioConnections.get(blurPortfolioId);
            if (blurConnections) {
              blurConnections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'user_field_blur',
                    portfolioId: blurPortfolioId,
                    fieldId: message.fieldId,
                    taskId: message.taskId,
                    userId: (ws as any).userId,
                    username: (ws as any).username
                  }));
                }
              });
            }
            break;
            
          case 'field_change':
            // Broadcast real-time field changes
            const changePortfolioId = message.portfolioId;
            const changeConnections = portfolioConnections.get(changePortfolioId);
            if (changeConnections) {
              changeConnections.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'field_changed',
                    portfolioId: changePortfolioId,
                    fieldId: message.fieldId,
                    taskId: message.taskId,
                    value: message.value,
                    userId: (ws as any).userId,
                    username: (ws as any).username
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from all portfolios
      portfolioConnections.forEach((connections, portfolioId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          portfolioConnections.delete(portfolioId);
        }
      });
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(400).json({ message: "Username or email already exists" });
      } else {
        console.error("Registration error:", error);
        res.status(400).json({ message: error.message || "Registration failed" });
      }
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
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
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
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Portfolio routes - All portfolios are now public and accessible to all authenticated users
  app.get("/api/portfolios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolios = await storage.getAllPortfolios();
      res.json(portfolios);
    } catch (error) {
      console.error("Get portfolios error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolio = await storage.getPortfolioWithTasks(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      console.error("Get portfolio error:", error);
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
    } catch (error: any) {
      console.error("Create portfolio error:", error);
      res.status(400).json({ message: error.message || "Failed to create portfolio" });
    }
  });

  app.patch("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const portfolioData = insertPortfolioSchema.partial().parse(req.body);
      
      // Check if user is the owner or allow all authenticated users to edit
      const existingPortfolio = await storage.getPortfolio(req.params.id);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      const portfolio = await storage.updatePortfolio(req.params.id, portfolioData);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      // Broadcast changes via WebSocket
      const connections = portfolioConnections.get(req.params.id);
      if (connections) {
        connections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'portfolio_changed',
              portfolioId: req.params.id,
              data: portfolio
            }));
          }
        });
      }

      res.json(portfolio);
    } catch (error: any) {
      console.error("Update portfolio error:", error);
      res.status(400).json({ message: error.message || "Failed to update portfolio" });
    }
  });

  app.delete("/api/portfolios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is the owner or admin
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      if (portfolio.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only the owner or admin can delete this portfolio" });
      }

      const success = await storage.deletePortfolio(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      res.json({ message: "Portfolio deleted successfully" });
    } catch (error) {
      console.error("Delete portfolio error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Task routes
  app.get("/api/portfolios/:portfolioId/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.params.portfolioId);
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/portfolios/:portfolioId/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({
        ...taskData,
        portfolioId: req.params.portfolioId,
      });
      
      // Broadcast new task via WebSocket
      const connections = portfolioConnections.get(req.params.portfolioId);
      if (connections) {
        connections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'task_added',
              portfolioId: req.params.portfolioId,
              data: task
            }));
          }
        });
      }
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Create task error:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Broadcast task changes via WebSocket
      const connections = portfolioConnections.get(task.portfolioId);
      if (connections) {
        connections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'task_changed',
              portfolioId: task.portfolioId,
              taskId: task.id,
              data: task
            }));
          }
        });
      }
      
      res.json(task);
    } catch (error: any) {
      console.error("Update task error:", error);
      res.status(400).json({ message: error.message || "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Get task before deletion to know which portfolio to broadcast to
      const task = await storage.getTask(req.params.id);
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Broadcast task deletion via WebSocket
      if (task) {
        const connections = portfolioConnections.get(task.portfolioId);
        if (connections) {
          connections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'task_deleted',
                portfolioId: task.portfolioId,
                taskId: req.params.id
              }));
            }
          });
        }
      }
      
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User search routes (for future features)
  app.get("/api/users/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const users = await storage.searchUsers(q);
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName
      })));
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // System settings routes (admin only)
  app.get("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings || { maxDaysPerTask: 3 });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const settingsData = insertSystemSettingsSchema.parse(req.body);
      const settings = await storage.updateSystemSettings({
        ...settingsData,
        updatedBy: req.user!.id,
      });
      res.json(settings);
    } catch (error: any) {
      console.error("Update settings error:", error);
      res.status(400).json({ message: error.message || "Failed to update settings" });
    }
  });

  return httpServer;
}