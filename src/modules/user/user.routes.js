import express from "express";
import { ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./user.controller.js";
import {
  createUserBody,
  emptyQuery,
  idParams,
  updateUserBody,
} from "./user.validation.js";

const router = express.Router();

router.use(authMiddleware);

// Self-access: any authenticated user
router.get("/me", validate({ query: emptyQuery }), asyncHandler(controller.getMe));

// Admin-only routes
router.use(roleMiddleware([ADMIN]));

router.post(
  "/",
  validate({ query: emptyQuery, body: createUserBody }),
  asyncHandler(controller.createUser),
);
router.get(
  "/",
  validate({ query: emptyQuery }),
  asyncHandler(controller.getUsers),
);
router.get(
  "/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getUserById),
);
router.patch(
  "/:id",
  validate({ params: idParams, query: emptyQuery, body: updateUserBody }),
  asyncHandler(controller.updateUser),
);
router.delete(
  "/:id",
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.deleteUser),
);

export default router;
