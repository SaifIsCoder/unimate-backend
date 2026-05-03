import * as scheduleService from "./schedule.service.js";
import { sendSuccess } from "../../utils/response.js";

// Schedules
export const createSchedule = async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);
  return sendSuccess(res, schedule, 201);
};

export const getSchedulesByOffering = async (req, res) => {
  const schedules = await scheduleService.getSchedulesByOffering(req.params.offeringId);
  return sendSuccess(res, schedules);
};

export const deleteSchedule = async (req, res) => {
  const schedule = await scheduleService.deleteSchedule(req.params.id);
  return sendSuccess(res, schedule);
};

// Exceptions
export const createException = async (req, res) => {
  const exception = await scheduleService.createException(req.body);
  return sendSuccess(res, exception, 201);
};

export const getExceptionsByOffering = async (req, res) => {
  const exceptions = await scheduleService.getExceptionsByOffering(req.params.offeringId);
  return sendSuccess(res, exceptions);
};

export const deleteException = async (req, res) => {
  const exception = await scheduleService.deleteException(req.params.id);
  return sendSuccess(res, exception);
};
