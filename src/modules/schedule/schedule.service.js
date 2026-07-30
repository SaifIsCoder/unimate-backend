import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as scheduleRepository from "./schedule.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as authHelpers from "../../utils/auth.helpers.js";

// Validation Helper
const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

// Resolves the offering behind a schedule/exception row and asserts the actor owns it.
const assertOwnsOffering = async (offeringId, user, client) => {
  const offering = await assertOfferingExists(offeringId, client);

  if (user) {
    await authHelpers.assertAccessToOffering(user, offering);
  }

  return offering;
};

export const createSchedule = async (payload, user) => {
  return withTransaction(async (client) => {
    await assertOwnsOffering(payload.offering_id, user, client);

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

export const getSchedulesByOffering = async (offeringId, user) => {
  await assertOwnsOffering(offeringId, user);

  return scheduleRepository.findSchedulesByOffering(offeringId);
};

export const deleteSchedule = async (id, user) => {
  return withTransaction(async (client) => {
    const schedule = await scheduleRepository.findScheduleById(id, client);
    if (!schedule) {
      throw new AppError("Schedule not found", 404);
    }

    await assertOwnsOffering(schedule.offering_id, user, client);

    return scheduleRepository.deleteSchedule(id, client);
  });
};

export const createException = async (payload, user) => {
  return withTransaction(async (client) => {
    await assertOwnsOffering(payload.offering_id, user, client);

    if (payload.schedule_id) {
      const schedule = await scheduleRepository.findScheduleById(payload.schedule_id, client);
      if (!schedule || String(schedule.offering_id) !== String(payload.offering_id)) {
        throw new AppError("Invalid schedule ID for this offering", 400);
      }
    }

    return scheduleRepository.createException(payload, client);
  });
};

export const getExceptionsByOffering = async (offeringId, user) => {
  await assertOwnsOffering(offeringId, user);

  return scheduleRepository.findExceptionsByOffering(offeringId);
};

export const deleteException = async (id, user) => {
  return withTransaction(async (client) => {
    const exception = await scheduleRepository.findExceptionById(id, client);
    if (!exception) {
      throw new AppError("Schedule exception not found", 404);
    }

    await assertOwnsOffering(exception.offering_id, user, client);

    return scheduleRepository.deleteException(id, client);
  });
};

// ── Teacher Schedules ────────────────────────────────────────────────────────────

/**
 * A teacher's weekly timetable, grouped by day. Scoped by the teacher's own
 * profile rather than an offering id, so there is nothing here to enumerate —
 * the caller only ever sees offerings they own.
 */
export const getTeacherSchedules = async (userId) => {
  const teacher = await teacherRepository.findByUserId(userId);
  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const schedules = await scheduleRepository.findSchedulesByTeacher(teacher.id);
  const exceptions = await scheduleRepository.findExceptionsByTeacher(teacher.id);

  const days = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = [];
    }

    const matchingExceptions = exceptions.filter(
      (exception) => String(exception.schedule_id) === String(schedule.schedule_id)
    );

    acc[schedule.day_of_week].push({
      schedule_id: schedule.schedule_id,
      offering_id: schedule.offering_id,
      course_id: schedule.course_id,
      course_code: schedule.course_code,
      course_title: schedule.course_title,
      section: schedule.section,
      semester: schedule.semester,
      room: schedule.room,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      capacity: schedule.capacity,
      enrolled_count: schedule.enrolled_count,
      exceptions: matchingExceptions,
    });

    return acc;
  }, {});

  return { days, exceptions };
};

// ── Mobile Student Schedules ─────────────────────────────────────────────────────

export const getStudentSchedules = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const schedules = await scheduleRepository.findSchedulesByStudent(student.id);
  const exceptions = await scheduleRepository.findExceptionsByStudent(student.id);
  const days = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = [];
    }

    const matchingExceptions = exceptions.filter(
      (exception) => String(exception.schedule_id) === String(schedule.schedule_id)
    );

    acc[schedule.day_of_week].push({
      schedule_id: schedule.schedule_id,
      offering_id: schedule.offering_id,
      course_id: schedule.course_id,
      course_code: schedule.course_code,
      course_title: schedule.course_title,
      section: schedule.section,
      teacher_email: schedule.teacher_email,
      room: schedule.room,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      exceptions: matchingExceptions,
    });

    return acc;
  }, {});

  return { days, exceptions };
};

const combineDateAndTime = (dateStr, timeStr) => {
  return `${dateStr}T${timeStr.substring(0, 5)}:00Z`;
};

export const getResolvedSchedulesForDate = async (userId, dateStr) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  // Parse day of week from dateStr (YYYY-MM-DD)
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayName = daysOfWeek[dateObj.getDay()];

  // Fetch all recurring weekly schedules for this student
  const studentSchedules = await scheduleRepository.findSchedulesByStudent(student.id);
  
  // Filter schedules that fall on this day of the week
  const daySchedules = studentSchedules.filter(s => s.day_of_week === dayName);

  // Fetch all schedule exceptions for this student on this date
  const studentExceptions = await scheduleRepository.findExceptionsByStudent(student.id);
  const dateExceptions = studentExceptions.filter(
    e => new Date(e.date).toISOString().split("T")[0] === dateStr
  );

  const resolved = [];

  // 1. Process regular schedules, checking for cancellations/rescheduling
  for (const sch of daySchedules) {
    const exception = dateExceptions.find(e => String(e.schedule_id) === String(sch.schedule_id));

    if (exception) {
      if (exception.exception_type === "cancelled") {
        resolved.push({
          id: sch.schedule_id,
          courseName: sch.course_title,
          courseCode: sch.course_code,
          room: sch.room,
          startTime: combineDateAndTime(dateStr, sch.start_time),
          endTime: combineDateAndTime(dateStr, sch.end_time),
          status: "cancelled",
          aiPrepSuggested: false,
          date: dateStr,
          isCancelled: true,
          isRescheduled: false,
          rescheduledRoom: ""
        });
      } else if (exception.exception_type === "rescheduled") {
        resolved.push({
          id: sch.schedule_id,
          courseName: sch.course_title,
          courseCode: sch.course_code,
          room: exception.new_room || sch.room,
          startTime: combineDateAndTime(dateStr, exception.new_start_time || sch.start_time),
          endTime: combineDateAndTime(dateStr, exception.new_end_time || sch.end_time),
          status: "upcoming",
          aiPrepSuggested: false,
          date: dateStr,
          isCancelled: false,
          isRescheduled: true,
          rescheduledRoom: exception.new_room || ""
        });
      }
    } else {
      // Regular schedule with no exceptions
      resolved.push({
        id: sch.schedule_id,
        courseName: sch.course_title,
        courseCode: sch.course_code,
        room: sch.room,
        startTime: combineDateAndTime(dateStr, sch.start_time),
        endTime: combineDateAndTime(dateStr, sch.end_time),
        status: "upcoming",
        aiPrepSuggested: false,
        date: dateStr,
        isCancelled: false,
        isRescheduled: false,
        rescheduledRoom: ""
      });
    }
  }

  // 2. Process extra classes (exceptions with exception_type = 'extra' and no schedule_id)
  const extraClasses = dateExceptions.filter(e => e.exception_type === "extra");
  for (const extra of extraClasses) {
    resolved.push({
      id: extra.exception_id,
      courseName: extra.course_title,
      courseCode: extra.course_code,
      room: extra.new_room || "Room TBA",
      startTime: combineDateAndTime(dateStr, extra.new_start_time || "09:00:00"),
      endTime: combineDateAndTime(dateStr, extra.new_end_time || "10:30:00"),
      status: "upcoming",
      aiPrepSuggested: false,
      date: dateStr,
      isCancelled: false,
      isRescheduled: false,
      rescheduledRoom: ""
    });
  }

  // Sort resolved classes by start time
  resolved.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return resolved;
};
