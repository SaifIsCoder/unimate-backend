import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const createCourseBody = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(30).required(),
  title: Joi.string().trim().min(2).max(160).required(),
  credit_hours: Joi.number().integer().min(0).max(10).required(),
  department: Joi.string().trim().max(120),
});

export const updateCourseBody = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(30),
  title: Joi.string().trim().min(2).max(160),
  credit_hours: Joi.number().integer().min(0).max(10),
  department: Joi.string().trim().max(120).allow(null, ""),
}).min(1);
