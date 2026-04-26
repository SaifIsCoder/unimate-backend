import Joi from "joi";

export const emptyQuery = Joi.object({});

// All logins use the same shape: email + password
// Student initial password = roll_number
// Teacher initial password = employee_id
export const loginBody = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// One-time password reset (student or teacher)
export const resetPasswordBody = Joi.object({
  password: Joi.string().min(8).max(128).required(),
});
