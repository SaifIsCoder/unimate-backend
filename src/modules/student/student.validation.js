import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const createStudentBody = Joi.object({
  user_id: Joi.string().uuid().required(),
  roll_number: Joi.string().trim().min(2).max(50).required(),
  department: Joi.string().trim().max(120),
  batch: Joi.number().integer().min(1900).max(2200),
});

export const updateStudentBody = Joi.object({
  user_id: Joi.string().uuid(),
  roll_number: Joi.string().trim().min(2).max(50),
  department: Joi.string().trim().max(120).allow(null, ""),
  batch: Joi.number().integer().min(1900).max(2200).allow(null),
}).min(1);
