import { Router } from "express";
import { ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as eventsController from "./events.controller.js";
import * as validation from "./events.validation.js";

const router = Router();

// Reads are intentionally left open to match the existing behaviour the mobile
// app relies on. Writes are admin-only.
router.get(
  "/upcoming",
  validate({ query: validation.getUpcomingEventsQuery }),
  asyncHandler(eventsController.getUpcomingEvents)
);

router.get(
  "/",
  validate({ query: validation.getEventsQuery }),
  asyncHandler(eventsController.getAllEvents)
);

router.get(
  "/:id",
  validate({ params: validation.idParams }),
  asyncHandler(eventsController.getEventById)
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware([ADMIN]),
  validate({ query: validation.emptyQuery, body: validation.createEventBody }),
  asyncHandler(eventsController.createEvent)
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([ADMIN]),
  validate({
    params: validation.idParams,
    query: validation.emptyQuery,
    body: validation.updateEventBody,
  }),
  asyncHandler(eventsController.updateEvent)
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([ADMIN]),
  validate({ params: validation.idParams, query: validation.emptyQuery }),
  asyncHandler(eventsController.deleteEvent)
);

export default router;
