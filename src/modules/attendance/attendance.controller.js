import * as attendanceService from "./attendance.service.js";
import { sendSuccess } from "../../utils/response.js";

export const recordAttendance = async (req, res) => {
  const result = await attendanceService.recordAttendance(req.body, req.user);
  return sendSuccess(res, result, 201);
};

export const createSession = async (req, res) => {
  const session = await attendanceService.createSession(req.body, req.user);
  return sendSuccess(res, session, 201);
};

export const getSessionsByOffering = async (req, res) => {
  const sessions = await attendanceService.getSessionsByOffering(req.params.offeringId, req.user);
  return sendSuccess(res, sessions);
};

export const getSessionRecords = async (req, res) => {
  const records = await attendanceService.getSessionRecords(req.params.sessionId, req.user);
  return sendSuccess(res, records);
};

export const getAttendanceStats = async (req, res) => {
  const { page, limit } = req.query;
  const stats = await attendanceService.getAttendanceStats(req.params.offeringId, req.user, { page, limit });
  return sendSuccess(res, stats);
};
