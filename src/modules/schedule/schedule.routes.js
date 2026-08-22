import { Router } from "express";
import { ADMIN, TEACHER, STUDENT } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as scheduleController from "./schedule.controller.js";
import * as validation from "./schedule.validation.js";

const router = Router();

// Middleware to ensure user is logged in
router.use(authMiddleware);

// SCHEDULES
router.post(
  "/",
  roleMiddleware([ADMIN, TEACHER]),
  validate({ body: validation.createScheduleSchema }),
  asyncHandler(scheduleController.createSchedule)
);

router.get(
  "/offering/:offeringId",
  validate({ params: validation.offeringIdParams }),
  asyncHandler(scheduleController.getSchedulesByOffering)
);

// GET / is student-only, so teachers get their own scoped timetable here.
// Declared before "/:id" routes; no GET "/:id" exists, so there is no conflict.
router.get(
  "/me",
  roleMiddleware([TEACHER]),
  asyncHandler(scheduleController.getMyTeachingSchedule)
);

router.get(
  "/my/today",
  roleMiddleware([STUDENT]),
  asyncHandler(scheduleController.getMyTodaySchedule)
);

router.get(
  "/",
  roleMiddleware([STUDENT]),
  validate({ query: validation.myScheduleQuery }),
  asyncHandler(scheduleController.getMySchedules)
);

// EXCEPTIONS
router.post(
  "/exceptions",
  roleMiddleware([ADMIN, TEACHER]),
  validate({ body: validation.createExceptionSchema }),
  asyncHandler(scheduleController.createException)
);

router.get(
  "/offering/:offeringId/exceptions",
  validate({ params: validation.offeringIdParams }),
  asyncHandler(scheduleController.getExceptionsByOffering)
);

router.delete(
  "/exceptions/:id",
  roleMiddleware([ADMIN, TEACHER]),
  validate({ params: validation.idParams }),
  asyncHandler(scheduleController.deleteException)
);

router.delete(
  "/:id",
  roleMiddleware([ADMIN, TEACHER]),
  validate({ params: validation.idParams }),
  asyncHandler(scheduleController.deleteSchedule)
);

export default router;
