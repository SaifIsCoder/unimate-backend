import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const emptyQuery = Joi.object({});

export const createCourseBody = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(30).required(),
  title: Joi.string().trim().min(2).max(160).required(),
  credit_hours: Joi.number().integer().min(0).max(10).required(),
  department_id: Joi.number().integer().required(),
  has_practical: Joi.boolean().default(false),
});

export const updateCourseBody = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(30),
  title: Joi.string().trim().min(2).max(160),
  credit_hours: Joi.number().integer().min(0).max(10),
  department_id: Joi.number().integer(),
  has_practical: Joi.boolean(),
}).min(1);
