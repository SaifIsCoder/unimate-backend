import * as communityService from "./community.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createPost = async (req, res) => {
  const post = await communityService.createPost(req.body, req.user);
  return sendSuccess(res, post, 201);
};

export const getPosts = async (req, res) => {
  const posts = await communityService.getPosts(req.query, req.user);
  return sendSuccess(res, posts);
};

export const getPostById = async (req, res) => {
  const post = await communityService.getPostById(req.params.id, req.user);
  return sendSuccess(res, post);
};

export const updatePost = async (req, res) => {
  const post = await communityService.updatePost(req.params.id, req.body, req.user);
  return sendSuccess(res, post);
};

export const deletePost = async (req, res) => {
  const post = await communityService.deletePost(req.params.id, req.user);
  return sendSuccess(res, post);
};

export const createComment = async (req, res) => {
  const comment = await communityService.createComment(req.params.id, req.body, req.user);
  return sendSuccess(res, comment, 201);
};

export const updateComment = async (req, res) => {
  const comment = await communityService.updateComment(req.params.id, req.body, req.user);
  return sendSuccess(res, comment);
};

export const deleteComment = async (req, res) => {
  const comment = await communityService.deleteComment(req.params.id, req.user);
  return sendSuccess(res, comment);
};

export const likePost = async (req, res) => {
  const result = await communityService.likePost(req.params.id, req.user);
  return sendSuccess(res, result, 201);
};

export const unlikePost = async (req, res) => {
  const result = await communityService.unlikePost(req.params.id, req.user);
  return sendSuccess(res, result);
};
