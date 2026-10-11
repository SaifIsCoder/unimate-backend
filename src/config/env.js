import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

// Load .env file only if it exists (production on Render uses dashboard env vars)
const envPath = path.resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// ── Required environment variable validation ──────────────────────────────────

const REQUIRED_VARS = ["DATABASE_URL", "JWT_SECRET"];
const REQUIRED_IF_REFRESH = ["JWT_REFRESH_SECRET"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `FATAL: Missing required environment variable(s): ${missing.join(", ")}.\n` +
      "Set them in .env (local) or the Render dashboard (production)."
  );
  process.exit(1);
}

// Warn about refresh-token secret falling back to access-token secret
if (!process.env.JWT_REFRESH_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "WARNING: JWT_REFRESH_SECRET is not set. Falling back to JWT_SECRET for refresh tokens. " +
      "Set a separate JWT_REFRESH_SECRET in production."
  );
}

// ── Exported config ───────────────────────────────────────────────────────────

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  firebaseCredentialsPath: process.env.FIREBASE_CREDENTIALS_PATH || "",
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  // CORS: support comma-separated origins for multiple frontends
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export default env;
