import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as attendanceController from "./attendance.controller.js";
import * as validation from "./attendance.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.recordAttendanceSchema }),
  asyncHandler(attendanceController.recordAttendance)
);

router.get(
  "/session/:sessionId",
  asyncHandler(attendanceController.getSessionRecords)
);

router.get(
  "/offering/:offeringId",
  asyncHandler(attendanceController.getAttendanceStats)
);

export default router;
