import Joi from "joi";

export const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(3).required()
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  content: Joi.string().min(3),
  status: Joi.string().valid('active', 'hidden', 'deleted')
}).min(1);

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).required()
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1),
  status: Joi.string().valid('active', 'hidden', 'deleted')
}).min(1);

// page/limit rather than limit/offset: the service paginates via
// utils/pagination.getPagination, which derives the offset from `page`.
export const getPostsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Comments nested under GET /posts/:id, which the repository pages at 50.
export const getPostCommentsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

export const idParams = Joi.object({
  id: Joi.string().uuid().required()
});
