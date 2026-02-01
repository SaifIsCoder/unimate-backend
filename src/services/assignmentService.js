// assignmentService.js
// All assignment-related business logic is implemented here.

const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get all assignments with optional filters
 */
async function getAllAssignments(tenantId, filters = {}) {
    const query = { tenantId };
    if (filters.classId) query.classId = filters.classId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.createdBy) query.createdBy = filters.createdBy;

    return Assignment.find(query)
        .populate('classId', 'name')
        .populate('subjectId', 'name code')
        .populate('createdBy', 'profile.fullName')
        .sort({ dueDate: 1 });
}

/**
 * Get assignments for enrolled classes (for students)
 */
async function getAssignmentsForStudent(tenantId, studentId) {
    // Get student's enrolled classes
    const enrollments = await Enrollment.find({
        tenantId,
        userId: studentId,
        status: 'active'
    }).select('classId');

    const classIds = enrollments.map(e => e.classId);

    return Assignment.find({
        tenantId,
        classId: { $in: classIds }
    })
        .populate('classId', 'name')
        .populate('subjectId', 'name code')
        .sort({ dueDate: 1 });
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(tenantId, id) {
    const assignment = await Assignment.findOne({ _id: id, tenantId })
        .populate('classId', 'name')
        .populate('subjectId', 'name code creditHours')
        .populate('createdBy', 'profile.fullName email');

    if (!assignment) {
        throw new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return assignment;
}

/**
 * Create assignment
 */
async function createAssignment(tenantId, userId, data) {
    // Validate class exists
    const classDoc = await Class.findOne({ _id: data.classId, tenantId });
    if (!classDoc) {
        throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Validate subject exists
    const subject = await Subject.findOne({ _id: data.subjectId, tenantId });
    if (!subject) {
        throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const assignment = await Assignment.create({
        tenantId,
        ...data,
        createdBy: userId
    });

    await logAction({
        tenantId,
        userId,
        action: 'assignment_created',
        entity: 'Assignment',
        entityId: assignment._id
    });

    return assignment;
}

/**
 * Update assignment
 */
async function updateAssignment(tenantId, userId, id, data) {
    // Validate class if provided
    if (data.classId) {
        const classDoc = await Class.findOne({ _id: data.classId, tenantId });
        if (!classDoc) {
            throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
        }
    }

    // Validate subject if provided
    if (data.subjectId) {
        const subject = await Subject.findOne({ _id: data.subjectId, tenantId });
        if (!subject) {
            throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
        }
    }

    const assignment = await Assignment.findOneAndUpdate(
        { _id: id, tenantId },
        data,
        { new: true, runValidators: true }
    );

    if (!assignment) {
        throw new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await logAction({
        tenantId,
        userId,
        action: 'assignment_updated',
        entity: 'Assignment',
        entityId: assignment._id
    });

    return assignment;
}

/**
 * Delete assignment (soft delete)
 */
async function deleteAssignment(tenantId, userId, id) {
    const assignment = await Assignment.findOne({ _id: id, tenantId });
    if (!assignment) {
        throw new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND);
    }

    assignment.deletedAt = new Date();
    await assignment.save();

    await logAction({
        tenantId,
        userId,
        action: 'assignment_deleted',
        entity: 'Assignment',
        entityId: assignment._id
    });

    return { message: 'Assignment deleted successfully' };
}

/**
 * Get submissions for an assignment
 */
async function getSubmissions(tenantId, assignmentId) {
    return Submission.find({ tenantId, assignmentId })
        .populate('studentId', 'profile.fullName email')
        .sort({ submittedAt: -1 });
}

/**
 * Submit assignment (student)
 */
async function submitAssignment(tenantId, studentId, assignmentId, data) {
    // Validate assignment exists
    const assignment = await Assignment.findOne({ _id: assignmentId, tenantId });
    if (!assignment) {
        throw new AppError('Assignment not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Check if student is enrolled in the class
    const enrollment = await Enrollment.findOne({
        tenantId,
        classId: assignment.classId,
        userId: studentId,
        status: 'active'
    });

    if (!enrollment) {
        throw new AppError('You are not enrolled in this class', 403, ERROR_CODES.NOT_ENROLLED);
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
        tenantId,
        assignmentId,
        studentId
    });

    // Check if late
    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (existingSubmission) {
        // Update existing submission (versioning)
        existingSubmission.content = data.content;
        existingSubmission.fileUrl = data.fileUrl;
        existingSubmission.submittedAt = now;
        existingSubmission.status = isLate ? 'late' : 'submitted';
        await existingSubmission.save();

        await logAction({
            tenantId,
            userId: studentId,
            action: 'submission_updated',
            entity: 'Submission',
            entityId: existingSubmission._id
        });

        return existingSubmission;
    }

    // Create new submission
    const submission = await Submission.create({
        tenantId,
        assignmentId,
        studentId,
        content: data.content,
        fileUrl: data.fileUrl,
        status: isLate ? 'late' : 'submitted'
    });

    await logAction({
        tenantId,
        userId: studentId,
        action: 'submission_created',
        entity: 'Submission',
        entityId: submission._id
    });

    return submission;
}

/**
 * Grade submission (teacher)
 */
async function gradeSubmission(tenantId, teacherId, submissionId, marks, feedback) {
    const submission = await Submission.findOne({ _id: submissionId, tenantId });
    if (!submission) {
        throw new AppError('Submission not found', 404, ERROR_CODES.NOT_FOUND);
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = teacherId;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    await submission.save();

    await logAction({
        tenantId,
        userId: teacherId,
        action: 'submission_graded',
        entity: 'Submission',
        entityId: submission._id
    });

    return submission;
}

/**
 * Get student's submissions
 */
async function getStudentSubmissions(tenantId, studentId, filters = {}) {
    const query = { tenantId, studentId };
    if (filters.status) query.status = filters.status;

    return Submission.find(query)
        .populate('assignmentId', 'title dueDate maxMarks')
        .sort({ submittedAt: -1 });
}

module.exports = {
    getAllAssignments,
    getAssignmentsForStudent,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getSubmissions,
    submitAssignment,
    gradeSubmission,
    getStudentSubmissions
};
