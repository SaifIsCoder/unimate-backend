import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const getAnnouncementsQuery = Joi.object({
  offering_id: Joi.string().uuid(),
  department_id: Joi.number().integer(),
  semester: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  offering_ids: Joi.array().items(Joi.string().uuid()),
  department_id: Joi.number().integer(),
  semester: Joi.string(),
}).xor("offering_ids", "department_id", "semester");

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string(),
  content: Joi.string(),
}).min(1);
