import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "shillong-teer-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Enhanced registration schema with better validation messages
      // const registrationSchema = insertUserSchema.extend({
      //   username: z.string()
      //     .min(3, "Username must be at least 3 characters")
      //     .max(50, "Username cannot exceed 50 characters")
      //     .trim()
      //     .refine(val => /^[a-zA-Z0-9_]+$/.test(val), {
      //       message: "Username can only contain letters, numbers, and underscores",
      //     }),
      //   password: z.string()
      //     .min(6, "Password must be at least 6 characters")
      //     .refine(val => /[A-Za-z]/.test(val) && /[0-9]/.test(val), {
      //       message: "Password must contain at least one letter and one number",
      //     }),
      //   email: z.string().email("Please enter a valid email").optional().nullish(),
      //   name: z.string().min(2, "Name must be at least 2 characters").optional().nullish()
      // });

      const registrationSchema = insertUserSchema.extend({
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(50, "Username cannot exceed 50 characters")
          .trim()
          .refine(val => /^[a-zA-Z0-9_]+$/.test(val), {
            message: "Username can only contain letters, numbers, and underscores",
          }),
        password: z.string()
          .min(6, "Password must be at least 6 characters")
          .refine(val => /[A-Za-z]/.test(val) && /[0-9]/.test(val), {
            message: "Password must contain at least one letter and one number",
          }),
        email: z.string().email("Please enter a valid email"),
        name: z.string().min(2, "Name must be at least 2 characters")
      });


      const userData = registrationSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Registration failed", 
          errors: [{ path: ["username"], message: "This username is already taken" }] 
        });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(err => ({
            path: err.path,
            message: err.message
          }))
        });
      }
      
      // Generic error handler
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Enhanced login schema with better validation
      const loginSchema = z.object({
        username: z.string()
          .min(1, "Username is required")
          .refine(val => val.trim().length > 0, "Username cannot be empty"),
        password: z.string()
          .min(1, "Password is required")
          .refine(val => val.trim().length > 0, "Password cannot be empty"),
      });
      
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ 
            message: "An error occurred during login. Please try again later." 
          });
        }
        
        if (!user) {
          // Provide a more secure but helpful message (not revealing if username exists)
          return res.status(401).json({ 
            message: "Invalid username or password", 
            errors: [{ 
              path: ["credentials"], 
              message: "The username or password you entered is incorrect" 
            }]
          });
        }
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session error during login:", err);
            return res.status(500).json({ 
              message: "Could not create login session. Please try again." 
            });
          }
          
          // Don't send password to client
          const { password, ...userWithoutPassword } = user;
          
          // Set the last login time (if you want to track this)
          // This is a good place to update any user metadata
          
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login validation error:", error);
      
      if (error instanceof z.ZodError) {
        // Format validation errors in a more consistent way
        return res.status(400).json({ 
          message: "Please check your login information", 
          errors: error.errors.map(err => ({
            path: err.path,
            message: err.message
          }))
        });
      }
      
      // For any other errors, return a generic message
      res.status(500).json({ 
        message: "Login failed due to a technical issue. Please try again." 
      });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Check if the user is actually logged in
    if (!req.isAuthenticated()) {
      return res.status(200).json({ 
        message: "You were already logged out" 
      });
    }
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ 
          message: "Error during logout. You may still be logged in." 
        });
      }
      
      // Destroy the session after logout for better security
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ 
            message: "Error clearing your session. You have been logged out, but some data may remain." 
          });
        }
        
        res.status(200).json({ 
          message: "You have been successfully logged out" 
        });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        message: "You are not logged in or your session has expired" 
      });
    }
    
    try {
      // Don't send password to client
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error retrieving user data:", error);
      res.status(500).json({ 
        message: "Error retrieving your user profile data" 
      });
    }
  });
  
  // Create an admin user if it doesn't exist
  (async () => {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      const hashedPassword = await hashPassword("admin123");
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        name: "Admin",
        email: "admin@example.com"
      });
      console.log("Admin user created");
    }
  })();
}
