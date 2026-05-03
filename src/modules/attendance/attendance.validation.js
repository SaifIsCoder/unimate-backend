import Joi from "joi";

const ATTENDANCE_STATUSES = ["present", "absent", "late", "leave"];

export const recordAttendanceSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().uuid().required(),
      status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
    })
  ).optional(), // Optional because default is present for everyone
});
