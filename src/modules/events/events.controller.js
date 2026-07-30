import * as eventsService from "./events.service.js";
import { sendSuccess } from "../../utils/response.js";

export const getUpcomingEvents = async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 1;
  const events = await eventsService.getUpcomingEvents(limit);
  return sendSuccess(res, events);
};

export const getAllEvents = async (req, res) => {
  const { page, limit } = req.query;
  const events = await eventsService.getAllEvents({ page, limit });
  return sendSuccess(res, events);
};

export const getEventById = async (req, res) => {
  const event = await eventsService.getEventById(req.params.id);
  return sendSuccess(res, event);
};

export const createEvent = async (req, res) => {
  const event = await eventsService.createEvent(req.body, req.user);
  return sendSuccess(res, event, 201);
};

export const updateEvent = async (req, res) => {
  const event = await eventsService.updateEvent(req.params.id, req.body, req.user);
  return sendSuccess(res, event);
};

export const deleteEvent = async (req, res) => {
  const event = await eventsService.deleteEvent(req.params.id, req.user);
  return sendSuccess(res, event);
};
