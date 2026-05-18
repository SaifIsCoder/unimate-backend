import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as assignmentController from "./assignment.controller.js";
import * as validation from "./assignment.validation.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/my",
  roleMiddleware(["student"]),
  asyncHandler(assignmentController.getMyAssignments)
);

router.post(
  "/:id/submit",
  roleMiddleware(["student"]),
  asyncHandler(assignmentController.submitMyAssignment)
);

router.post(
  "/:id/progress",
  roleMiddleware(["student"]),
  asyncHandler(assignmentController.updateMyAssignmentProgress)
);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createAssignmentSchema }),
  asyncHandler(assignmentController.createAssignment)
);

router.get(
  "/offering/:offeringId",
  validate({ params: validation.offeringIdParams }),
  asyncHandler(assignmentController.getAssignmentsByOffering)
);

router.patch(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.idParams, body: validation.updateAssignmentSchema }),
  asyncHandler(assignmentController.updateAssignment)
);

router.patch(
  "/:id/done",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.idParams }),
  asyncHandler(assignmentController.markAsDone)
);

router.delete(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.idParams }),
  asyncHandler(assignmentController.deleteAssignment)
);

// ── Mobile Student Submission and Details Routes ──
router.get(
  "/:id",
  validate({ params: validation.idParams }),
  asyncHandler(assignmentController.getAssignmentDetails)
);

router.put(
  "/:id/update-submission",
  roleMiddleware(["student"]),
  validate({ params: validation.idParams }),
  asyncHandler(assignmentController.submitMyAssignment)
);

router.delete(
  "/:id/submission",
  roleMiddleware(["student"]),
  validate({ params: validation.idParams }),
  asyncHandler(assignmentController.deleteMyAssignmentSubmission)
);
export default router;
