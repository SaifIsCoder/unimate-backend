import Joi from "joi";

export const createAssignmentSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  due_date: Joi.date().iso().required(),
  total_points: Joi.number().positive().required(),
});

export const updateAssignmentSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().allow(null, "").optional(),
  due_date: Joi.date().iso().optional(),
  total_points: Joi.number().positive().optional(),
});
