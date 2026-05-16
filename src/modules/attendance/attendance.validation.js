import Joi from "joi";

const ATTENDANCE_STATUSES = ["present", "absent", "late", "leave"];

export const recordAttendanceSchema = Joi.object({
  offering_id: Joi.string().uuid().optional(),
  date: Joi.date().iso().optional(),
  session_id: Joi.string().uuid().optional(),
  schedule_id: Joi.string().uuid().optional(),
  exception_id: Joi.string().uuid().optional(),
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().uuid().required(),
      status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
    })
  ).optional(),
}).xor("offering_id", "session_id").with("offering_id", "date");

export const createSessionSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  schedule_id: Joi.string().uuid().optional(),
  exception_id: Joi.string().uuid().optional(),
});

export const offeringIdParams = Joi.object({
  offeringId: Joi.string().uuid().required(),
});

export const sessionIdParams = Joi.object({
  sessionId: Joi.string().uuid().required(),
});
export const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
