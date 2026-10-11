import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import env from "./config/env.js";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { pinoHttp } from "pino-http";
import logger from "./config/logger.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { sendError, sendSuccess } from "./utils/response.js";
import { AppError } from "./utils/app-error.js";

const app = express();
const API_PREFIX = "/api";
const CURRENT_API_VERSION = "v1";
const VERSIONED_API_PREFIX = `${API_PREFIX}/${CURRENT_API_VERSION}`;

// ── Proxy trust ───────────────────────────────────────────────────────────────
// Render terminates TLS at its load balancer and forwards X-Forwarded-* headers.
// Trust exactly one proxy hop so that rate-limiter and req.ip work correctly.
app.set("trust proxy", 1);

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: env.isProduction ? 300 : 1000, // generous in prod, very relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes",
      type: "RateLimitError",
    },
  },
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: env.isProduction
    ? env.corsOrigins
    : true, // allow all in development
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(globalLimiter);
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        query: req.query,
        id: req.id,
      }),
      // Never log response bodies (may contain tokens)
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    // Don't log health-check noise
    autoLogging: {
      ignore: (req) => req.url === "/api/v1/health" || req.url === "/health",
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve static files from the 'public' directory
app.use(express.static("public"));

// ── Root / info routes ────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "Unimate backend is running",
    api: {
      currentVersion: CURRENT_API_VERSION,
      baseUrl: VERSIONED_API_PREFIX,
      health: `${VERSIONED_API_PREFIX}/health`,
    },
  });
});

// Top-level health check (Render health-check path)
app.get("/health", (req, res) => {
  return sendSuccess(res, { status: "ok" });
});

app.get(API_PREFIX, (req, res) => {
  return sendSuccess(res, {
    versions: [CURRENT_API_VERSION],
    currentVersion: CURRENT_API_VERSION,
    baseUrl: VERSIONED_API_PREFIX,
  });
});

app.use(VERSIONED_API_PREFIX, routes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

// ── Centralised error handler ─────────────────────────────────────────────────

app.use(errorMiddleware);

export default app;
