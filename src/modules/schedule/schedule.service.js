import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as scheduleRepository from "./schedule.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";

// Validation Helper
const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

export const createSchedule = async (payload) => {
  return withTransaction(async (client) => {
    await assertOfferingExists(payload.offering_id, client);

    // Basic overlap check in service layer
    const existingSchedules = await scheduleRepository.findSchedulesByOffering(payload.offering_id, client);
    const hasOverlap = existingSchedules.some(
      (sch) =>
        sch.day_of_week === payload.day_of_week &&
        sch.start_time < payload.end_time &&
        sch.end_time > payload.start_time
    );

    if (hasOverlap) {
      throw new AppError("Schedule overlaps with an existing schedule for this offering on this day", 409);
    }

    return scheduleRepository.createSchedule(payload, client);
  });
};

export const getSchedulesByOffering = async (offeringId) => {
  return scheduleRepository.findSchedulesByOffering(offeringId);
};

export const deleteSchedule = async (id) => {
  const schedule = await scheduleRepository.deleteSchedule(id);
  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }
  return schedule;
};

export const createException = async (payload) => {
  return withTransaction(async (client) => {
    await assertOfferingExists(payload.offering_id, client);

    if (payload.schedule_id) {
      const schedule = await scheduleRepository.findScheduleById(payload.schedule_id, client);
      if (!schedule || String(schedule.offering_id) !== String(payload.offering_id)) {
        throw new AppError("Invalid schedule ID for this offering", 400);
      }
    }

    return scheduleRepository.createException(payload, client);
  });
};

export const getExceptionsByOffering = async (offeringId) => {
  return scheduleRepository.findExceptionsByOffering(offeringId);
};

export const deleteException = async (id) => {
  const exception = await scheduleRepository.deleteException(id);
  if (!exception) {
    throw new AppError("Schedule exception not found", 404);
  }
  return exception;
};
