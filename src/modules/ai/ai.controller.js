import * as aiService from "./ai.service.js";
import { sendSuccess } from "../../utils/response.js";

export const getBriefing = async (req, res) => {
  const briefing = await aiService.getBriefing(req.user.id);
  return sendSuccess(res, briefing);
};

export const getCopilotReply = async (req, res) => {
  const { query, activeCourseId } = req.body;
  const reply = await aiService.getCopilotReply(req.user.id, query, activeCourseId);
  return sendSuccess(res, reply);
};

export const getGradeProjection = async (req, res) => {
  const { targetCgpa, studyIntensity } = req.body;
  const projection = await aiService.getGradeProjection(req.user.id, targetCgpa, studyIntensity);
  return sendSuccess(res, projection);
};

export const getStudyBlocks = async (req, res) => {
  const { date } = req.body;
  const blocks = await aiService.getStudyBlocks(req.user.id, date);
  return sendSuccess(res, blocks);
};

export const prioritizeTasks = async (req, res) => {
  const prioritization = await aiService.prioritizeTasks(req.user.id);
  return sendSuccess(res, prioritization);
};

export const getAnnouncementsSummary = async (req, res) => {
  const summary = await aiService.getAnnouncementsSummary(req.user.id);
  return sendSuccess(res, summary);
};

export const getGpaGoal = async (req, res) => {
  const { targetCgpa, studyIntensity, upcomingAssessments } = req.body;
  const data = await aiService.getGpaGoal(req.user.id, {
    targetCgpa,
    studyIntensity,
    upcomingAssessments,
  });
  return sendSuccess(res, data);
};

export const getAttendanceGuardian = async (req, res) => {
  const data = await aiService.getAttendanceGuardian(req.user.id);
  return sendSuccess(res, data);
};

export const getSmartSchedule = async (req, res) => {
  const data = await aiService.getSmartSchedule(req.user.id, req.query.date);
  return sendSuccess(res, data);
};

export const getSkillTrends = async (req, res) => {
  const data = await aiService.getSkillTrends(req.user.id);
  return sendSuccess(res, data);
};
