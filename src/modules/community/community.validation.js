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

export const getPostsQuery = Joi.object({
  limit: Joi.number().min(1).max(100),
  offset: Joi.number().min(0)
});

export const idParams = Joi.object({
  id: Joi.string().uuid().required()
});
