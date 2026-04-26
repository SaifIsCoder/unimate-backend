import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const offeringQuery = Joi.object({
  semester: Joi.string().trim().max(50),
  course_id: Joi.string().uuid(),
});

export const createOfferingBody = Joi.object({
  course_id: Joi.string().uuid().required(),
  teacher_id: Joi.string().uuid().allow(null),
  semester: Joi.string().trim().min(2).max(50).required(),
  section: Joi.string().trim().min(1).max(20).required(),
  capacity: Joi.number().integer().min(1).max(500).required(),
});

export const updateOfferingBody = Joi.object({
  course_id: Joi.string().uuid(),
  teacher_id: Joi.string().uuid().allow(null),
  semester: Joi.string().trim().min(2).max(50),
  section: Joi.string().trim().min(1).max(20),
  capacity: Joi.number().integer().min(1).max(500),
}).min(1);
