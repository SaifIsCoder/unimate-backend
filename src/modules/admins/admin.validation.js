import Joi from "joi";

export const updateAdminSchema = Joi.object({
  admin_id: Joi.string().trim(),
  department: Joi.string().trim(),
});

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

