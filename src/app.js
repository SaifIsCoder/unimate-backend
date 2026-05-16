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

app.set("trust proxy", 1); // Trust proxy for accurate IP in rate limiting

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes"
});

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
    },
  })
);
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get(API_PREFIX, (req, res) => {
  return sendSuccess(res, {
    versions: [CURRENT_API_VERSION],
    currentVersion: CURRENT_API_VERSION,
    baseUrl: VERSIONED_API_PREFIX,
  });
});

app.use(VERSIONED_API_PREFIX, routes);



// ... inside app ...
app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorMiddleware);

export default app;
