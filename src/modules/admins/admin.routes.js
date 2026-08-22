import express from "express";
import { ADMIN, SUPER_ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./admin.controller.js";
import { updateAdminSchema, idParams, listQuery } from "./admin.validation.js";

const router = express.Router();

router.use(authMiddleware);

// Self-access
router.get(
  "/me",
  roleMiddleware([ADMIN, SUPER_ADMIN]),
  asyncHandler(controller.getMe)
);

// Admin management (Super admins or just the same role for now)
router.get(
  "/",
  roleMiddleware([ADMIN, SUPER_ADMIN]),
  validate({ query: listQuery }),
  asyncHandler(controller.getAdmins)
);

router.get(
  "/:id",
  roleMiddleware([ADMIN, SUPER_ADMIN]),
  validate({ params: idParams }),
  asyncHandler(controller.getAdminById)
);

router.patch(
  "/:id",
  roleMiddleware([ADMIN, SUPER_ADMIN]),
  validate({ params: idParams, body: updateAdminSchema }),
  asyncHandler(controller.updateAdmin)
);

router.delete(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams }),
  asyncHandler(controller.deleteAdmin)
);

export default router;
