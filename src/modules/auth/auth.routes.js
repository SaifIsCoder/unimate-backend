import express from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import controller from "./auth.controller.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ module: "auth", status: "ok" });
});

router.post("/login", asyncHandler(controller.login));

export default router;
