import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Unimate backend scaffold is ready",
  });
});

app.use(errorMiddleware);

export default app;
