import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const emptyQuery = Joi.object({});

export const semesterParams = Joi.object({
  semester: Joi.string().trim().min(1).max(50).required(),
});

export const createStudentBody = Joi.object({
  user_id: Joi.string().uuid().required(),
  roll_number: Joi.string().trim().min(2).max(50).required(),
 department_id: Joi.number().integer().optional(),
  batch: Joi.number().integer().min(1900).max(2200),
});

export const updateStudentBody = Joi.object({
  roll_number: Joi.string().trim().min(2).max(50),
department_id: Joi.number().integer().optional(),
  batch: Joi.number().integer().min(1900).max(2200).allow(null),
}).min(1);
