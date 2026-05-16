import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./notification.controller.js";
import * as validation from "./notification.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/token",
  validate({ body: validation.registerTokenSchema }),
  asyncHandler(controller.registerToken)
);

router.get(
  "/",
  validate({ query: validation.paginationQuery }),
  asyncHandler(controller.getUserNotifications)
);

router.patch(
  "/:id/read",
  validate({ params: validation.idParams }),
  asyncHandler(controller.markAsRead)
);

export default router;
