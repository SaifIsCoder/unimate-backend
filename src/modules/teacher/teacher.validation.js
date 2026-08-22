import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const emptyQuery = Joi.object({});

export const createTeacherBody = Joi.object({
  user_id: Joi.string().uuid().required(),
  employee_id: Joi.string().trim().min(2).max(50).required(),
  department_id: Joi.number().integer().optional(),
});

export const updateTeacherBody = Joi.object({
  user_id: Joi.string().uuid(),
  employee_id: Joi.string().trim().min(2).max(50),
 department_id: Joi.number().integer().optional(),
}).min(1);
