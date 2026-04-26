import express from "express";
import { ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./enrollment.controller.js";
import {
  createEnrollmentBody,
  emptyQuery,
  idParams,
  updateEnrollmentBody,
} from "./enrollment.validation.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware([ADMIN]));

router.post(
  "/",
  validate({ query: emptyQuery, body: createEnrollmentBody }),
  asyncHandler(controller.createEnrollment),
);
router.get(
  "/",
  validate({ query: emptyQuery }),
  asyncHandler(controller.getEnrollments),
);
router.get(
  "/student/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getEnrollmentsByStudent),
);
router.get(
  "/offering/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getEnrollmentsByOffering),
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
