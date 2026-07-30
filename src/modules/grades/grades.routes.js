import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as gradesController from "./grades.controller.js";
import * as validation from "./grades.validation.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/my/summary",
  roleMiddleware(["student"]),
  asyncHandler(gradesController.getMyGradesSummary)
);

// Alias: the mobile client is configured to call GET /grades/my
router.get(
  "/my",
  roleMiddleware(["student"]),
  asyncHandler(gradesController.getMyGradesSummary)
);

router.get(
  "/my/course/:courseId",
  roleMiddleware(["student"]),
  validate({ params: validation.myCourseParams }),
  asyncHandler(gradesController.getMyCourseGradeDetails)
);

router.get(
  "/all-semesters",
  roleMiddleware(["student"]),
  asyncHandler(gradesController.getMyAllSemesters)
);

router.post(
  "/gpa-goals",
  roleMiddleware(["student"]),
  validate({ body: validation.updateGpaGoalsSchema }),
  asyncHandler(gradesController.updateGpaGoals)
);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.submitGradeSchema }),
  asyncHandler(gradesController.submitGrade)
);

router.get(
  "/offering/:offeringId",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.offeringIdParams, query: validation.paginationQuery }),
  asyncHandler(gradesController.getGradesByOffering)
);

router.get(
  "/student/:studentId/offering/:offeringId/calculation",
  roleMiddleware(["admin", "teacher", "student"]),
  validate({ params: validation.calculationParams }),
  asyncHandler(gradesController.calculateCourseGrade)
);

router.get(
  "/student/:studentId/transcript",
  roleMiddleware(["admin", "student"]),
  validate({ params: validation.studentIdParams }),
  asyncHandler(gradesController.getStudentTranscript)
);

export default router;
