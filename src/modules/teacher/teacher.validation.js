import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const createTeacherBody = Joi.object({
  user_id: Joi.string().uuid().required(),
  employee_id: Joi.string().trim().min(2).max(50).required(),
  department: Joi.string().trim().max(120),
});

export const updateTeacherBody = Joi.object({
  user_id: Joi.string().uuid(),
  employee_id: Joi.string().trim().min(2).max(50),
  department: Joi.string().trim().max(120).allow(null, ""),
}).min(1);
