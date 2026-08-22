import Joi from "joi";
import { SUPER_ADMIN, ADMIN, STUDENT, TEACHER } from "../../constants/roles.js";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

import { paginationSchema } from "../../utils/pagination.js";

export const listQuery = Joi.object(paginationSchema);

export const emptyQuery = Joi.object({});

export const createUserBody = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid(SUPER_ADMIN, ADMIN, STUDENT, TEACHER).required(),
  is_active: Joi.boolean(),

  password: Joi.string().min(8).max(128).required(),

  // Student profile fields
  roll_number: Joi.when("role", {
    is: STUDENT,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
  batch: Joi.when("role", {
    is: STUDENT,
    then: Joi.number().integer().min(2000).max(2100),
    otherwise: Joi.forbidden(),
  }),

  // Teacher profile fields
  employee_id: Joi.when("role", {
    is: TEACHER,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),

  admin_id: Joi.when("role", {
    is: Joi.valid(ADMIN, SUPER_ADMIN),
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),

  // Shared profile field
  department_id: Joi.when("role", {
    is: Joi.valid(STUDENT, TEACHER, ADMIN, SUPER_ADMIN),
    then: Joi.number().integer().required(),
    otherwise: Joi.forbidden(),
  }),
});

export const updateUserBody = Joi.object({
  email: Joi.string().trim().lowercase().email(),
  password: Joi.string().min(8).max(128),
  role: Joi.string().valid(ADMIN, STUDENT, TEACHER),
  is_active: Joi.boolean(),
}).min(1);

