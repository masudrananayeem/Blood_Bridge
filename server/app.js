// Single Hono app used by BOTH entry points:
//   - Node / Render / local  ->  server.js   (@hono/node-server)
//   - Cloudflare Workers     ->  worker.js   (wrangler module)
//
// No request path is defined twice — this is the one source of truth.
import { Hono } from "hono";
import { cors } from "hono/cors";
import { setEnv, getEnv } from "./config/env.js";
import { secureHeaders } from "./middlewares/security.js";
import { rateLimit } from "./middlewares/ratelimit.js";
import { onError, notFound } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

export const createApp = () => {
  const app = new Hono();

  // Expose Worker bindings to the runtime-agnostic utils (Node falls back to
  // process.env automatically). Must run before anything that reads config.
  app.use("*", async (c, next) => {
    setEnv(c.env);
    await next();
  });

  app.use("*", secureHeaders);
  app.use(
    "*",
    cors({
      origin: (origin, c) => getEnv("CLIENT_URL") || "http://localhost:5173",
      credentials: true,
    })
  );

  // Global API limiter — protects every endpoint from abuse.
  app.use(
    "/api/*",
    rateLimit({
      name: "api",
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: "Too many requests, please try again later.",
    })
  );

  // ---- Health check ----
  app.get("/api/health", (c) => c.json({ success: true, message: "BloodBridge API is running" }));

  // ---- Routes ----
  app.route("/api/auth", authRoutes);
  app.route("/api/users", userRoutes);
  app.route("/api/requests", requestRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/notifications", notificationRoutes);
  app.route("/api/organizations", organizationRoutes);
  app.route("/api/feedback", feedbackRoutes);

  // ---- Error handling (always last) ----
  app.notFound(notFound);
  app.onError(onError);

  return app;
};

export default createApp;