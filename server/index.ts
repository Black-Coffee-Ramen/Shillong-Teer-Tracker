import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static(path.resolve(process.cwd(), "public")));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port 5000 as primary port for Replit deployment
  // Try fallback ports if the primary port is in use
  const tryPorts = [5000, 3000, 3001, 3002, 8080];
  
  const tryListen = async (portIndex = 0): Promise<void> => {
    if (portIndex >= tryPorts.length) {
      log('All ports are in use. Please free up a port and try again.');
      process.exit(1);
      return;
    }
    
    const port = tryPorts[portIndex];
    
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
        // Save the successful port to a file for the APK build script to read
        try {
          // Get current directory
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          fs.writeFileSync(path.join(__dirname, '..', '.port'), port.toString());
          log(`Port ${port} saved to .port file`);
        } catch (err) {
          log(`Could not save port to file: ${err}`);
        }
        resolve();
      }).on('error', async (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use, trying next port...`);
          serverInstance.close();
          await tryListen(portIndex + 1);
          resolve();
        } else {
          reject(err);
        }
      });
    });
  };
  
  await tryListen();
})();
