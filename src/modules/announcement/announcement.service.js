import { AppError } from "../../utils/app-error.js";
import { STUDENT, TEACHER, isAdmin } from "../../constants/roles.js";
import { pool } from "../../config/db.js";
import { withTransaction } from "../../utils/transaction.js";
import * as announcementRepo from "./announcement.repository.js";
import * as notificationService from "../notification/notification.service.js";
import * as teacherRepo from "../teacher/teacher.repository.js";
import * as offeringRepo from "../offering/offering.repository.js";
import * as enrollmentRepo from "../enrollment/enrollment.repository.js";
import * as studentRepo from "../student/student.repository.js";
import * as adminRepo from "../admins/admin.repository.js";
import { sanitizeHtml } from "../../utils/sanitizer.js";

// Called after the write transaction has committed, so it defaults to the pool.
// The semester branch below queries `client` directly and has no fallback of its
// own, unlike the repository helpers used by the other two branches.
const resolveTargetUserIds = async (announcement, client = pool) => {
  let targetUserIds = [];

  if (announcement.department_id) {
    const students = await studentRepo.findByDepartmentId(
      announcement.department_id,
      client,
    );
    targetUserIds.push(...students.map((s) => s.user_id));
    const teachers = await teacherRepo.findByDepartmentId(
      announcement.department_id,
      client,
    );
    targetUserIds.push(...teachers.map((t) => t.user_id));
  } else if (announcement.semester) {
    const studentRes = await client.query(
      `SELECT DISTINCT s.user_id 
       FROM students s 
       JOIN enrollments e ON e.student_id = s.id 
       JOIN course_offerings co ON co.id = e.offering_id 
       WHERE co.semester = $1`,
      [announcement.semester],
    );
    targetUserIds.push(...studentRes.rows.map((r) => r.user_id));

    const teacherRes = await client.query(
      `SELECT DISTINCT t.user_id 
       FROM teachers t 
       JOIN course_offerings co ON co.teacher_id = t.id 
       WHERE co.semester = $1`,
      [announcement.semester],
    );
    targetUserIds.push(...teacherRes.rows.map((r) => r.user_id));
  } else {
    const offeringIds = await announcementRepo.findOfferingIdsByAnnouncementId(
      announcement.id,
      client,
    );
    for (const oid of offeringIds) {
      const enrollmentsRes = await enrollmentRepo.findByOffering(
        oid,
        {},
        client,
      );
      const userIds = enrollmentsRes.data
        .filter((e) => e.status === "enrolled")
        .map((e) => e.student_user_id);
      targetUserIds.push(...userIds);
    }
  }

  return [...new Set(targetUserIds)];
};


export const createAnnouncement = async (payload, user) => {
  let announcement;

  await withTransaction(async (client) => {
    if (user.role === TEACHER) {
      if (!payload.offering_ids || payload.offering_ids.length === 0) {
        throw new AppError("Teachers must target at least one offering", 403);
      }
      const teacher = await teacherRepo.findByUserId(user.id);
      for (const oid of payload.offering_ids) {
        const offering = await offeringRepo.findPlainById(oid, client);
        if (!offering || String(offering.teacher_id) !== String(teacher.id)) {
          throw new AppError(
            `Forbidden: You do not own offering ${oid}`,
            403,
          );
        }
      }
    }

    if (isAdmin(user.role) && payload.department_id) {
      const admin = await adminRepo.findByUserId(user.id);
      if (!admin || admin.department_id !== payload.department_id) {
        throw new AppError(
          "Forbidden: You can only post to your department",
          403,
        );
      }
    }

    announcement = await announcementRepo.createAnnouncement(
      {
        title: sanitizeHtml(payload.title),
        content: sanitizeHtml(payload.content),
        department_id: payload.department_id,
        semester: payload.semester,
        author_id: user.id,
      },
      client,
    );

    if (payload.offering_ids) {
      await announcementRepo.addOfferingTargets(
        announcement.id,
        payload.offering_ids,
        client,
      );
    }
  });

  const targetUserIds = await resolveTargetUserIds(announcement);

  if (targetUserIds.length > 0) {
    notificationService
      .dispatchAnnouncementNotifications(announcement, targetUserIds)
      .catch((error) =>
        console.error(
          "[Notification Error] Failed to send notifications:",
          error,
        ),
      );
  }

  return announcement;
};

const getDefaultAnnouncementsForUser = async (user, { page, limit }) => {
  if (user.role === TEACHER) {
    const teacher = await teacherRepo.findByUserId(user.id);
    if (teacher?.department_id) {
      return announcementRepo.getByDepartment(teacher.department_id, { page, limit });
    }
    return announcementRepo.getRecent({ page, limit });
  }

  if (user.role === STUDENT) {
    const student = await studentRepo.findByUserId(user.id);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }

    const enrollments = await studentRepo.getEnrollments(student.id);
    const offeringIds = enrollments.map((enrollment) => enrollment.offering_id);
    const semesters = [...new Set(enrollments.map((enrollment) => enrollment.semester))];

    return announcementRepo.getRelevantForStudent(
      { departmentId: student.department_id, offeringIds, semesters },
      { page, limit },
    );
  }

  // admin / super_admin default: recent announcements across the institution
  return announcementRepo.getRecent({ page, limit });
};

const attachReadStatus = async (result, userId) => {
  const ids = result.data.map((announcement) => announcement.id);
  const readIds = new Set(await announcementRepo.findReadAnnouncementIds(userId, ids));

  return {
    ...result,
    data: result.data.map((announcement) => ({
      ...announcement,
      is_read: readIds.has(announcement.id),
    })),
  };
};

export const getAnnouncements = async (query, user) => {
  const { offering_id, department_id, semester, page, limit } = query;

  let result;
  if (offering_id) {
    result = await announcementRepo.getByOffering(offering_id, { page, limit });
  } else if (department_id) {
    result = await announcementRepo.getByDepartment(department_id, { page, limit });
  } else if (semester) {
    result = await announcementRepo.getBySemester(semester, { page, limit });
  } else {
    result = await getDefaultAnnouncementsForUser(user, { page, limit });
  }

  return attachReadStatus(result, user.id);
};

export const getAnnouncementById = async (id, user) => {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  const readIds = await announcementRepo.findReadAnnouncementIds(user.id, [id]);
  return { ...announcement, is_read: readIds.includes(id) };
};

export const markAnnouncementRead = async (id, userId) => {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  await announcementRepo.markAsRead(id, userId);
  return { message: "Announcement marked as read" };
};

export const updateAnnouncement = async (id, payload, user) => {
  const existing = await announcementRepo.findById(id);
  if (!existing) throw new AppError("Announcement not found", 404);
  if (String(existing.author_id) !== String(user.id)) {
    throw new AppError("Forbidden: You can only edit your own announcements", 403);
  }

  const updateData = {};
  if (payload.title) updateData.title = sanitizeHtml(payload.title);
  if (payload.content) updateData.content = sanitizeHtml(payload.content);
  
  if (Object.keys(updateData).length === 0) return existing;

  const updated = await announcementRepo.updateAnnouncement(id, updateData);

  // Trigger notification for update
  const targetUserIds = await resolveTargetUserIds(updated);
  if (targetUserIds.length > 0) {
    notificationService
      .dispatchAnnouncementNotifications(
        { ...updated, title: `Updated: ${updated.title}` },
        targetUserIds,
      )
      .catch((error) =>
        console.error(
          "[Notification Error] Failed to send update notifications:",
          error,
        ),
      );
  }

  return updated;
};

export const deleteAnnouncement = async (id, user) => {
  const existing = await announcementRepo.findById(id);
  if (!existing) throw new AppError("Announcement not found", 404);
  if (String(existing.author_id) !== String(user.id) && !isAdmin(user.role)) {
    throw new AppError("Forbidden: You can only delete your own announcements", 403);
  }
  return announcementRepo.deleteAnnouncement(id);
};
