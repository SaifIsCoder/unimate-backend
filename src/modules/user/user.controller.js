import * as userService from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  return sendSuccess(res, user, 201);
};

export const getUsers = async (req, res) => {
  const users = await userService.getUsers();
  return sendSuccess(res, users);
};

export const getMe = async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return sendSuccess(res, user);
};

export const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, user);
};

export const updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return sendSuccess(res, user);
};

export const deleteUser = async (req, res) => {
  const user = await userService.softDeleteUser(req.params.id);
  return sendSuccess(res, user);
};
