import Joi from "joi";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EXCEPTION_TYPES = ["cancelled", "rescheduled", "extra"];

export const createScheduleSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  day_of_week: Joi.string().valid(...DAYS_OF_WEEK).required(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(), // HH:mm or HH:mm:ss
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
  room: Joi.string().allow(null, ""),
});

export const createExceptionSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  schedule_id: Joi.string().uuid().allow(null, "").optional(),
  date: Joi.date().iso().required(),
  exception_type: Joi.string().valid(...EXCEPTION_TYPES).required(),
  new_start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, "").optional(),
  new_end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, "").optional(),
  new_room: Joi.string().allow(null, "").optional(),
});
