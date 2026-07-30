import * as scheduleService from "./schedule.service.js";
import { sendSuccess } from "../../utils/response.js";

// Schedules
export const createSchedule = async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body, req.user);
  return sendSuccess(res, schedule, 201);
};

export const getSchedulesByOffering = async (req, res) => {
  const schedules = await scheduleService.getSchedulesByOffering(req.params.offeringId, req.user);
  return sendSuccess(res, schedules);
};

export const deleteSchedule = async (req, res) => {
  const schedule = await scheduleService.deleteSchedule(req.params.id, req.user);
  return sendSuccess(res, schedule);
};

// Exceptions
export const createException = async (req, res) => {
  const exception = await scheduleService.createException(req.body, req.user);
  return sendSuccess(res, exception, 201);
};

export const getExceptionsByOffering = async (req, res) => {
  const exceptions = await scheduleService.getExceptionsByOffering(req.params.offeringId, req.user);
  return sendSuccess(res, exceptions);
};

export const deleteException = async (req, res) => {
  const exception = await scheduleService.deleteException(req.params.id, req.user);
  return sendSuccess(res, exception);
};

// ── Teacher Schedule Controller ──────────────────────────────────────────────────

export const getMyTeachingSchedule = async (req, res) => {
  const data = await scheduleService.getTeacherSchedules(req.user.id);
  return sendSuccess(res, data);
};

// ── Mobile Student Schedule Controller ───────────────────────────────────────────

export const getMySchedules = async (req, res) => {
  const { date } = req.query;
  if (date) {
    const data = await scheduleService.getResolvedSchedulesForDate(req.user.id, date);
    return sendSuccess(res, data);
  }
  const data = await scheduleService.getStudentSchedules(req.user.id);
  return sendSuccess(res, data);
};
