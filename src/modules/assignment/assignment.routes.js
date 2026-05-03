import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as assignmentController from "./assignment.controller.js";
import * as validation from "./assignment.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createAssignmentSchema }),
  asyncHandler(assignmentController.createAssignment)
);

router.get(
  "/offering/:offeringId",
  asyncHandler(assignmentController.getAssignmentsByOffering)
);

router.patch(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.updateAssignmentSchema }),
  asyncHandler(assignmentController.updateAssignment)
);

router.patch(
  "/:id/done",
  roleMiddleware(["admin", "teacher"]),
  asyncHandler(assignmentController.markAsDone)
);

router.delete(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  asyncHandler(assignmentController.deleteAssignment)
);

export default router;
