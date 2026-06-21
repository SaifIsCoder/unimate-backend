import * as eventsService from "./events.service.js";
import { sendSuccess } from "../../utils/response.js";

export const getUpcomingEvents = async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 1;
  const events = await eventsService.getUpcomingEvents(limit);
  return sendSuccess(res, events);
};
