import * as announcementService from "./announcement.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createAnnouncement = async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user);
  return sendSuccess(res, announcement, 201);
};

export const getAnnouncements = async (req, res) => {
  const announcements = await announcementService.getAnnouncements(req.query, req.user);
  return sendSuccess(res, announcements);
};

export const getAnnouncementById = async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.id, req.user);
  return sendSuccess(res, announcement);
};

export const markAnnouncementRead = async (req, res) => {
  const result = await announcementService.markAnnouncementRead(req.params.id, req.user.id);
  return sendSuccess(res, result);
};

export const updateAnnouncement = async (req, res) => {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body, req.user);
  return sendSuccess(res, announcement);
};

export const deleteAnnouncement = async (req, res) => {
  const announcement = await announcementService.deleteAnnouncement(req.params.id, req.user);
  return sendSuccess(res, announcement);
};
