import * as eventsRepository from "./events.repository.js";

export const getUpcomingEvents = async (limit = 1) => {
  const events = await eventsRepository.findUpcomingEvents(limit);

  return events.map((event) => ({
    ...event,
    is_upcoming: true,
  }));
};
