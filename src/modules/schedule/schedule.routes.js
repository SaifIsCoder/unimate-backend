import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as scheduleController from "./schedule.controller.js";
import * as validation from "./schedule.validation.js";

const router = Router();

// Middleware to ensure user is logged in
router.use(authMiddleware);

// SCHEDULES
router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createScheduleSchema }),
  asyncHandler(scheduleController.createSchedule)
);

router.get(
  "/offering/:offeringId",
  asyncHandler(scheduleController.getSchedulesByOffering)
);

router.delete(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  asyncHandler(scheduleController.deleteSchedule)
);

// EXCEPTIONS
router.post(
  "/exceptions",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createExceptionSchema }),
  asyncHandler(scheduleController.createException)
);

router.get(
  "/offering/:offeringId/exceptions",
  asyncHandler(scheduleController.getExceptionsByOffering)
);

router.delete(
  "/exceptions/:id",
  roleMiddleware(["admin", "teacher"]),
  asyncHandler(scheduleController.deleteException)
);

export default router;
