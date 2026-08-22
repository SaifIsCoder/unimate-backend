import Joi from "joi";
import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const idParams = Joi.object({
  id: Joi.number().integer().required(),
});

export const createDepartmentBody = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().uppercase().min(2).max(10).required(),
  description: Joi.string().trim().max(500),
});

export const updateDepartmentBody = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  code: Joi.string().trim().uppercase().min(2).max(10),
  description: Joi.string().trim().max(500),
}).min(1);
