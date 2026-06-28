import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as aiController from "./ai.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["student"]));

router.get(
  "/briefing",
  asyncHandler(aiController.getBriefing)
);

router.post(
  "/copilot",
  asyncHandler(aiController.getCopilotReply)
);

router.post(
  "/grades/projection",
  asyncHandler(aiController.getGradeProjection)
);

router.post(
  "/schedule/study-blocks",
  asyncHandler(aiController.getStudyBlocks)
);

router.post(
  "/tasks/prioritize",
  asyncHandler(aiController.prioritizeTasks)
);

router.post(
  "/gpa-goal",
  asyncHandler(aiController.getGpaGoal)
);

router.get(
  "/attendance-guardian",
  asyncHandler(aiController.getAttendanceGuardian)
);

router.get(
  "/smart-schedule",
  asyncHandler(aiController.getSmartSchedule)
);

router.get(
  "/skill-trends",
  asyncHandler(aiController.getSkillTrends)
);



router.get(
  "/announcements/summary",
  asyncHandler(aiController.getAnnouncementsSummary)
);

export default router;
