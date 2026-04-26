import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { sendError, sendSuccess } from "./utils/response.js";

const app = express();
const API_PREFIX = "/api";
const CURRENT_API_VERSION = "v1";
const VERSIONED_API_PREFIX = `${API_PREFIX}/${CURRENT_API_VERSION}`;

app.use(cors());
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

app.use((req, res) => {
  return sendError(res, "Route not found", 404);
});

app.use(errorMiddleware);

export default app;
