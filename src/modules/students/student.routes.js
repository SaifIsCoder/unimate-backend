import express from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import controller from "./student.controller.js";

const router = express.Router();

router.get("/", asyncHandler(controller.getAll));

export default router;
