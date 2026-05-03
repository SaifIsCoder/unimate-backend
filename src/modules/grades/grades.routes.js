import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as gradesController from "./grades.controller.js";
import * as validation from "./grades.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.submitGradeSchema }),
  asyncHandler(gradesController.submitGrade)
);

router.get(
  "/offering/:offeringId",
  roleMiddleware(["admin", "teacher"]),
  asyncHandler(gradesController.getGradesByOffering)
);

router.get(
  "/student/:studentId/offering/:offeringId/calculation",
  asyncHandler(gradesController.calculateCourseGrade)
);

router.get(
  "/student/:studentId/transcript",
  asyncHandler(gradesController.getStudentTranscript)
);

export default router;
