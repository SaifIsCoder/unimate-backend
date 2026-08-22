import Joi from "joi";
import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const updateAdminSchema = Joi.object({
  admin_id: Joi.string().trim(),
department_id: Joi.number().integer().optional(),
});

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

