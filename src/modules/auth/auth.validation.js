import Joi from "joi";

export const emptyQuery = Joi.object({});

// All logins use the same shape: email + password
// Student initial password = roll_number
// Teacher initial password = employee_id
export const loginBody = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Shared strength rule for every password the user chooses themselves.
const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
  .message(
    "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)",
  );

// One-time password reset (student or teacher)
export const resetPasswordBody = Joi.object({
  password: strongPassword.required(),
});

// Mobile alias of the reset above. The controller reads `newPassword` first and
// falls back to `password`, so either key satisfies the request.
export const setPasswordBody = Joi.object({
  newPassword: strongPassword,
  password: strongPassword,
}).or("newPassword", "password");

export const refreshTokenBody = Joi.object({
  refreshToken: Joi.string().required(),
});
