import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import * as eventsController from "./events.controller.js";

const router = Router();

router.get("/upcoming", asyncHandler(eventsController.getUpcomingEvents));

export default router;
