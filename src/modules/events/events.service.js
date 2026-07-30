import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import { logAudit } from "../../utils/audit.js";
import * as eventsRepository from "./events.repository.js";

const withUpcomingFlag = (event) => ({
  ...event,
  is_upcoming: new Date(event.date) >= new Date(),
});

export const getUpcomingEvents = async (limit = 1) => {
  const events = await eventsRepository.findUpcomingEvents(limit);

  return events.map((event) => ({
    ...event,
    is_upcoming: true,
  }));
};

export const getAllEvents = async ({ page, limit } = {}) => {
  const result = await eventsRepository.findAll({ page, limit });
  const now = new Date();

  return {
    ...result,
    data: result.data.map((event) => ({
      ...event,
      is_upcoming: new Date(event.date) >= now,
    })),
  };
};

export const getEventById = async (id) => {
  const event = await eventsRepository.findById(id);
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return withUpcomingFlag(event);
};

export const createEvent = async (payload, actor) => {
  const event = await eventsRepository.create({
    title: payload.title,
    description: payload.description || null,
    date: payload.date,
    location: payload.location || null,
  });

  logAudit(
    {
      action: "EVENT_CREATED",
      actorId: actor?.id,
      targetId: event.id,
      metadata: { title: event.title, date: event.date },
    },
    `Event "${event.title}" created`,
  );

  return withUpcomingFlag(event);
};

export const updateEvent = async (id, payload, actor) => {
  const existing = await eventsRepository.findById(id);
  if (!existing) {
    throw new AppError("Event not found", 404);
  }

  const data = omitUndefined(payload);
  // Joi allows "" so the client can clear these optional text fields.
  if (data.description === "") data.description = null;
  if (data.location === "") data.location = null;

  const event = await eventsRepository.update(id, data);

  logAudit(
    {
      action: "EVENT_UPDATED",
      actorId: actor?.id,
      targetId: id,
      metadata: data,
    },
    `Event ${id} updated`,
  );

  return withUpcomingFlag(event);
};

export const deleteEvent = async (id, actor) => {
  const event = await eventsRepository.remove(id);
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  logAudit(
    {
      action: "EVENT_DELETED",
      actorId: actor?.id,
      targetId: id,
    },
    `Event ${id} deleted`,
  );

  return event;
};
