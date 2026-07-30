import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

export const getEventsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Without this, a non-numeric ?limit reaches the query as NaN and the driver
// rejects it. The default of 1 matches the controller's existing fallback.
export const getUpcomingEventsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(1),
});

export const createEventBody = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(2000).allow(null, ""),
  date: Joi.date().iso().required(),
  location: Joi.string().trim().max(160).allow(null, ""),
});

export const updateEventBody = Joi.object({
  title: Joi.string().trim().min(2).max(160),
  description: Joi.string().trim().max(2000).allow(null, ""),
  date: Joi.date().iso(),
  location: Joi.string().trim().max(160).allow(null, ""),
}).min(1);
