import * as notificationService from "./notification.service.js";
import { sendSuccess } from "../../utils/response.js";

export const registerToken = async (req, res) => {
  const result = await notificationService.registerFcmToken(req.user.id, req.body.token);
  return sendSuccess(res, result, 201);
};

export const getUserNotifications = async (req, res) => {
  const { page, limit } = req.query;
  const notifications = await notificationService.getUserNotifications(req.user.id, page, limit);
  return sendSuccess(res, notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  return sendSuccess(res, notification);
};

export const markAllAsRead = async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  return sendSuccess(res, result);
};
