import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as assignmentRepository from "./assignment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as authHelpers from "../../utils/auth.helpers.js";
import { logAudit } from "../../utils/audit.js";


// Authorization helpers moved to src/utils/auth.helpers.js

export const createAssignment = async (payload, user) => {
  return withTransaction(async (client) => {
    const offering = await authHelpers.assertOfferingExists(payload.offering_id, client);

    if (user) {
      await authHelpers.assertAccessToOffering(user, offering);
    }

    if (new Date(payload.due_date) < new Date()) {
      throw new AppError("Due date cannot be in the past", 400);
    }

    const duplicate = await assignmentRepository.findDuplicateAssignment(
      payload.offering_id,
      payload.title,
      payload.description,
      null,
      client
    );

    if (duplicate) {
      throw new AppError("An assignment with this title and description already exists for this offering", 409);
    }

    const result = await assignmentRepository.createAssignment(payload, client);
    
    logAudit({
      action: "ASSIGNMENT_CREATED",
      actorId: user?.id,
      targetId: result.id,
      metadata: { offeringId: payload.offering_id, title: payload.title }
    }, `Assignment ${payload.title} created for offering ${payload.offering_id}`);

    return result;
  });
};

export const getAssignmentsByOffering = async (offeringId, user) => {
  const offering = await authHelpers.assertOfferingExists(offeringId);
  await authHelpers.assertAccessToOffering(user, offering);

  return assignmentRepository.findAssignmentsByOffering(offeringId);
};

export const getAssignments = async (query, user) => {
  const { offering_id: offeringId, is_done: isDone, page, limit } = query;

  let offeringIds;
  if (user.role === "teacher") {
    const teacher = await teacherRepository.findByUserId(user.id);
    if (!teacher) {
      throw new AppError("Teacher profile not found", 404);
    }

    const offerings = await teacherRepository.getOfferings(teacher.id);
    offeringIds = offerings.map((offering) => offering.id);

    if (offeringId && !offeringIds.includes(offeringId)) {
      throw new AppError("Forbidden: You do not own this offering", 403);
    }

    if (offeringIds.length === 0) {
      return { data: [], meta: { total: 0, page: page || 1, limit: limit || 20 } };
    }
  }

  return assignmentRepository.findAllAssignments({
    offeringId,
    offeringIds: user.role === "teacher" ? offeringIds : undefined,
    isDone,
    page,
    limit,
  });
};

export const deleteAssignment = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  const assignment = await assignmentRepository.deleteAssignment(id);

  logAudit({
    action: "ASSIGNMENT_DELETED",
    actorId: user?.id,
    targetId: id,
  }, `Assignment ${id} deleted`);

  return assignment;
};

export const updateAssignment = async (id, payload, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  if (payload.title !== undefined || payload.description !== undefined) {
    const newTitle = payload.title !== undefined ? payload.title : existing.title;
    const newDescription = payload.description !== undefined ? payload.description : existing.description;

    const duplicate = await assignmentRepository.findDuplicateAssignment(
      existing.offering_id,
      newTitle,
      newDescription,
      id
    );

    if (duplicate) {
      throw new AppError("Another assignment with this title and description already exists for this offering", 409);
    }
  }

  const assignment = await assignmentRepository.updateAssignment(id, payload);

  logAudit({
    action: "ASSIGNMENT_UPDATED",
    actorId: user?.id,
    targetId: id,
    metadata: payload
  }, `Assignment ${id} updated`);

  return assignment;
};

export const markAsDone = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  const assignment = await assignmentRepository.updateAssignment(id, { is_done: true });

  logAudit({
    action: "ASSIGNMENT_COMPLETED",
    actorId: user?.id,
    targetId: id,
  }, `Assignment ${id} marked as done`);

  return assignment;
};

// ── Mobile Student Assignment Service Methods ────────────────────────────────────

export const getMyAssignments = async (userId, statusFilter) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const list = await assignmentRepository.findAssignmentsByStudent(student.id);
  const now = new Date();

  const assignments = list.map(item => {
    let status = item.status;
    if (status === 'pending' && new Date(item.due) < now) {
      status = 'overdue';
    }
    return {
      id: item.id,
      title: item.title,
      subject: `${item.course_title} (${item.course_code})`,
      due: item.due,
      progress: Number(item.progress),
      difficulty: item.difficulty,
      priority: item.priority,
      status,
      isGraded: item.is_graded,
      marks: item.marks !== null ? Number(item.marks) : null,
      maxMarks: Number(item.max_marks),
      fileUrl: item.file_url,
      textContent: item.text_content,
      submittedAt: item.submitted_at
    };
  });

  if (!statusFilter) {
    return assignments;
  }

  return assignments.filter((assignment) => assignment.status === statusFilter);
};

export const getMySubmissions = async (userId) => {
  const assignments = await getMyAssignments(userId);
  return assignments.filter((assignment) => Boolean(assignment.submittedAt));
};

export const updateMyAssignmentProgress = async (userId, assignmentId, progress, status) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const assignment = await assignmentRepository.findAssignmentById(assignmentId);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  return assignmentRepository.upsertAssignmentProgress(student.id, assignmentId, progress, status);
};

export const submitMyAssignment = async (userId, assignmentId, fileUrl, textContent) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const assignment = await assignmentRepository.findAssignmentById(assignmentId);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  const enrollment = await enrollmentRepository.findByStudentAndOffering(
    student.id,
    assignment.offering_id,
  );
  if (!enrollment || enrollment.status !== "enrolled") {
    throw new AppError("Forbidden: You are not enrolled in this offering", 403);
  }

  if (new Date(assignment.due_date) < new Date()) {
    throw new AppError("Submission deadline has passed", 400);
  }

  if (!fileUrl && !textContent) {
    throw new AppError("Either fileUrl or textContent is required", 400);
  }

  const result = await assignmentRepository.upsertAssignmentSubmission(student.id, assignmentId, fileUrl, textContent);

  logAudit({
    action: "ASSIGNMENT_SUBMITTED",
    actorId: userId,
    targetId: assignmentId,
  }, `Assignment ${assignmentId} submitted by student ${student.id}`);

  return result;
};

export const getAssignmentDetails = async (assignmentId, user) => {
  if (user.role === "student") {
    const student = await studentRepository.findByUserId(user.id);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }

    const row = await assignmentRepository.findAssignmentDetailsForStudent(assignmentId, student.id);
    if (!row) {
      throw new AppError("Assignment not found", 404);
    }

    const now = new Date();
    const submissionAllowed = new Date(row.due) > now;

    return {
      id: row.id,
      title: row.title,
      instructions: row.instructions || "",
      due: row.due,
      maxMarks: Number(row.max_marks),
      difficulty: row.difficulty,
      priority: row.priority,
      status: row.status,
      progress: Number(row.progress),
      fileUrl: row.file_url,
      textContent: row.text_content,
      submittedAt: row.submitted_at,
      isGraded: row.is_graded,
      marks: row.marks !== null ? Number(row.marks) : null,
      teacherRemarks: row.grade_title || "",
      attachments: [],
      submissionAllowed
    };
  } else {
    const assignment = await assignmentRepository.findAssignmentById(assignmentId);
    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.description || "",
      due: assignment.due_date,
      maxMarks: Number(assignment.total_points),
      difficulty: assignment.difficulty,
      priority: assignment.priority,
      attachments: [],
      teacherRemarks: "",
      submissionAllowed: true
    };
  }
};

// export const deleteMyAssignmentSubmission = async (userId, assignmentId) => {
//   const student = await studentRepository.findByUserId(userId);
//   if (!student) {
//     throw new AppError("Student profile not found", 404);
//   }

//   const assignment = await assignmentRepository.findAssignmentById(assignmentId);
//   if (!assignment) {
//     throw new AppError("Assignment not found", 404);
//   }

//   const deleted = await assignmentRepository.deleteAssignmentSubmission(student.id, assignmentId);
//   if (!deleted) {
//     throw new AppError("Submission not found", 404);
//   }

//   return { message: "Submission withdrawn successfully" };
// };
