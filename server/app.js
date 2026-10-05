import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { authRoutes } from "./routes/auth.js";
import { problemRoutes } from "./routes/problems.js";
import { authenticate } from "./middleware/auth.js";
import { runReminders } from "./lib/reminders.js";
export function createApp(config) {
  const app = express();
  if (config.production) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
          "connect-src": ["'self'"],
          "upgrade-insecure-requests": config.production ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }), cookieParser());
  app.get("/api/health", (req, res) =>
    res
      .status(mongoose.connection.readyState === 1 ? 200 : 503)
      .json({
        status:
          mongoose.connection.readyState === 1 ? "ok" : "database unavailable",
      }),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60000,
      limit: 400,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests. Please try again later." },
    }),
  );
  // Cookies are HTTP-only. State-changing browser requests must match our origin.
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
      req.path === "/jobs/reminders"
    )
      return next();
    if (req.get("origin") !== config.origin)
      return res
        .status(403)
        .json({ message: "Request origin rejected. Check APP_URL." });
    next();
  });
  app.post("/api/jobs/reminders", async (req, res) => {
    const secret = process.env.CRON_SECRET || "",
      supplied = (req.get("authorization") || "").replace(/^Bearer /, "");
    if (secret.length < 32)
      return res
        .status(503)
        .json({ message: "Scheduled reminders are not configured." });
    if (
      Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))
    )
      return res.status(401).json({ message: "Unauthorized." });
    res.json(await runReminders(config.origin));
  });
  app.use("/api/auth", authRoutes(config));
  app.use("/api/problems", authenticate(config), problemRoutes());
  app.use("/api", (req, res) =>
    res.status(404).json({ message: "API route not found." }),
  );
  const dist = fileURLToPath(new URL("../client/dist/", import.meta.url));
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*path}", (req, res) => res.sendFile(dist + "index.html"));
  }
  app.use((error, req, res, next) => {
    if (error instanceof ZodError)
      return res
        .status(400)
        .json({
          message: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
    if (error.code === 11000)
      return res
        .status(409)
        .json({
          message: error.keyPattern?.email
            ? "An account with that email already exists."
            : "You have already logged this problem URL. Edit the existing record instead.",
        });
    if (error.type === "entity.too.large")
      return res.status(413).json({ message: "Request is too large." });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ message: "Invalid JSON." });
    console.error("Request failed:", error.name);
    res
      .status(500)
      .json({
        message:
          "Something went wrong. Please try again. If sending email, check the email provider settings.",
      });
  });
  return app;
}
