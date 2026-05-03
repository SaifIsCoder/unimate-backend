import Joi from "joi";
import { DROPPED, ENROLLED } from "../../constants/enrollmentStatus.js";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
export const createEnrollmentBody = Joi.object({
  student_id: Joi.string().uuid().required(),
  offering_id: Joi.string().uuid().required(),
  status: Joi.string().valid(ENROLLED, DROPPED),
});

export const updateEnrollmentBody = Joi.object({
  student_id: Joi.string().uuid(),
  offering_id: Joi.string().uuid(),
  status: Joi.string().valid(ENROLLED, DROPPED),
}).min(1);
