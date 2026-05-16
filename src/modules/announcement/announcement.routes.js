import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./announcement.controller.js";
import * as validation from "./announcement.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createAnnouncementSchema }),
  asyncHandler(controller.createAnnouncement)
);

router.get(
  "/",
  validate({ query: validation.getAnnouncementsQuery }),
  asyncHandler(controller.getAnnouncements)
);

router.patch(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.idParams, body: validation.updateAnnouncementSchema }),
  asyncHandler(controller.updateAnnouncement)
);

router.delete(
  "/:id",
  roleMiddleware(["admin", "teacher"]),
  validate({ params: validation.idParams }),
  asyncHandler(controller.deleteAnnouncement)
);

export default router;
