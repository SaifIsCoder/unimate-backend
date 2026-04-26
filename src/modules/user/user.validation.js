import Joi from "joi";
import { ADMIN, STUDENT, TEACHER } from "../../constants/roles.js";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const createUserBody = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  role: Joi.string().valid(ADMIN, STUDENT, TEACHER).required(),
  is_active: Joi.boolean(),

  // Password: required for admin, not accepted for student/teacher
  password: Joi.when("role", {
    is: ADMIN,
    then: Joi.string().min(8).max(128).required(),
    otherwise: Joi.forbidden(),
  }),

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

  // Shared optional profile field
  department: Joi.when("role", {
    is: Joi.valid(STUDENT, TEACHER),
    then: Joi.string().trim(),
    otherwise: Joi.forbidden(),
  }),
});

export const updateUserBody = Joi.object({
  email: Joi.string().trim().lowercase().email(),
  password: Joi.string().min(8).max(128),
  role: Joi.string().valid(ADMIN, STUDENT, TEACHER),
  is_active: Joi.boolean(),
}).min(1);
