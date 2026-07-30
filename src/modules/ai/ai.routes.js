import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as aiController from "./ai.controller.js";
import * as validation from "./ai.validation.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["student"]));

router.get(
  "/briefing",
  validate({ query: validation.emptyQuery }),
  asyncHandler(aiController.getBriefing)
);

router.post(
  "/copilot",
  validate({ query: validation.emptyQuery, body: validation.copilotBody }),
  asyncHandler(aiController.getCopilotReply)
);

router.post(
  "/grades/projection",
  validate({ query: validation.emptyQuery, body: validation.gradeProjectionBody }),
  asyncHandler(aiController.getGradeProjection)
);

router.post(
  "/schedule/study-blocks",
  validate({ query: validation.emptyQuery, body: validation.studyBlocksBody }),
  asyncHandler(aiController.getStudyBlocks)
);

router.post(
  "/tasks/prioritize",
  validate({ query: validation.emptyQuery, body: validation.emptyBody }),
  asyncHandler(aiController.prioritizeTasks)
);

router.post(
  "/gpa-goal",
  validate({ query: validation.emptyQuery, body: validation.gpaGoalBody }),
  asyncHandler(aiController.getGpaGoal)
);

router.get(
  "/attendance-guardian",
  validate({ query: validation.emptyQuery }),
  asyncHandler(aiController.getAttendanceGuardian)
);

router.get(
  "/smart-schedule",
  validate({ query: validation.smartScheduleQuery }),
  asyncHandler(aiController.getSmartSchedule)
);

router.get(
  "/skill-trends",
  validate({ query: validation.emptyQuery }),
  asyncHandler(aiController.getSkillTrends)
);

router.get(
  "/announcements/summary",
  validate({ query: validation.emptyQuery }),
  asyncHandler(aiController.getAnnouncementsSummary)
);

export default router;
