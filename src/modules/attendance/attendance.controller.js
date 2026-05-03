import * as attendanceService from "./attendance.service.js";
import { sendSuccess } from "../../utils/response.js";

export const recordAttendance = async (req, res) => {
  const result = await attendanceService.recordAttendance(req.body);
  return sendSuccess(res, result, 201);
};

export const getSessionRecords = async (req, res) => {
  const records = await attendanceService.getSessionRecords(req.params.sessionId);
  return sendSuccess(res, records);
};

export const getAttendanceStats = async (req, res) => {
  const stats = await attendanceService.getAttendanceStats(req.params.offeringId);
  return sendSuccess(res, stats);
};
