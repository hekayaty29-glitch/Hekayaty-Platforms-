import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import { setupVite, serveStatic, log } from "./server/vite";
import { setupSecurity } from "./server/security-middleware";
import { securityMonitoringMiddleware, setupHoneypots, setupSecurityDashboard } from "./server/security-monitoring";
import { secureDatabaseConnection } from "./server/database-security";
import { validateEnvironmentSecurity } from "./server/environment-security";

const app = express();

// Trust first proxy (important for rate limiting behind proxies)
app.set('trust proxy', 1);

// Remove the X-Powered-By header so attackers can’t easily fingerprint Express
app.disable("x-powered-by");

// --- Enhanced Security Setup ---
// Validate environment security first
validateEnvironmentSecurity();

// Check database security
secureDatabaseConnection();

// Setup comprehensive security
setupSecurity(app);

// Security monitoring
app.use(securityMonitoringMiddleware);

// Setup honeypots to catch attackers
setupHoneypots(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  
  // Setup security dashboard for admins
  setupSecurityDashboard(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log security-related errors
    if (status === 401 || status === 403 || status === 429) {
      console.warn(`[SECURITY] ${status} error: ${message} from ${_req.ip}`);
    }

    res.status(status).json({ message });
    throw err;
  });

  // If running in development and we *haven't* opted for an external Vite dev-server
  // then attach Vite in middleware mode. To opt-out, start your dev script with
  // USE_INTERNAL_VITE=false, e.g. via the new concurrently-based script.
  if (app.get("env") === "development" && process.env.USE_INTERNAL_VITE !== "false") {
    await setupVite(app, server);
  } else if (app.get("env") !== "development") {
    // In production always serve the pre-built static files
    serveStatic(app);
  }

  // In Vercel serverless environment we export the Express app
  if (process.env.VERCEL !== "1") {
    // Local or traditional server environment – start listening normally
    const port = 5000;
    const listenOptions: any = { port, host: "0.0.0.0" };
    if (process.platform !== "win32") {
      listenOptions.reusePort = true;
    }
    server.listen(listenOptions, () => {
      log(`serving on port ${port}`);
    });
  }
})();

// Export for Vercel
export default app;
