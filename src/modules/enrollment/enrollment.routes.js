import express from "express";
import { ADMIN, TEACHER } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./enrollment.controller.js";
import {
  createEnrollmentBody,
  emptyQuery,
  paginationQuery,
  idParams,
  studentIdParams,
  offeringIdParams,
  updateEnrollmentBody,
} from "./enrollment.validation.js";

const router = express.Router();

router.use(authMiddleware);

// Class roster — a teacher needs this to resolve the student_ids required by
// POST /grades and POST /attendance. Ownership of the offering is enforced in
// the service layer via assertAccessToOffering.
router.get(
  "/offering/:offeringId",
  roleMiddleware([ADMIN, TEACHER]),
  validate({ params: offeringIdParams, query: paginationQuery }),
  asyncHandler(controller.getEnrollmentsByOffering),
);

router.use(roleMiddleware([ADMIN]));

router.post(
  "/",
  validate({ query: emptyQuery, body: createEnrollmentBody }),
  asyncHandler(controller.createEnrollment),
);
router.get(
  "/",
  validate({ query: paginationQuery }),
  asyncHandler(controller.getEnrollments),
);
router.get(
  "/student/:studentId",
  validate({ params: studentIdParams, query: paginationQuery }),
  asyncHandler(controller.getEnrollmentsByStudent),
);
router.get(
  "/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getEnrollmentById),
);
router.patch(
  "/:id",
  validate({ params: idParams, query: emptyQuery, body: updateEnrollmentBody }),
  asyncHandler(controller.updateEnrollment),
);
router.delete(
  "/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.deleteEnrollment),
);

export default router;
