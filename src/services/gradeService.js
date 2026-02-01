// gradeService.js
// All grade-related business logic is implemented here.

const Grade = require('../models/Grade');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get grades for a class
 */
async function getGradesByClass(tenantId, classId, filters = {}) {
    const query = { tenantId, classId };
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.studentId) query.studentId = filters.studentId;

    return Grade.find(query)
        .populate('studentId', 'profile.fullName email')
        .populate('subjectId', 'name code creditHours')
        .populate('gradedBy', 'profile.fullName')
        .sort({ createdAt: -1 });
}

/**
 * Get grades for a student
 */
async function getStudentGrades(tenantId, studentId, filters = {}) {
    const query = { tenantId, studentId };
    if (filters.classId) query.classId = filters.classId;
    if (filters.subjectId) query.subjectId = filters.subjectId;

    return Grade.find(query)
        .populate('classId', 'name')
        .populate('subjectId', 'name code creditHours')
        .populate('gradedBy', 'profile.fullName')
        .sort({ createdAt: -1 });
}

/**
 * Get grade by ID
 */
async function getGradeById(tenantId, id) {
    const grade = await Grade.findOne({ _id: id, tenantId })
        .populate('classId', 'name')
        .populate('studentId', 'profile.fullName email')
        .populate('subjectId', 'name code creditHours')
        .populate('gradedBy', 'profile.fullName');

    if (!grade) {
        throw new AppError('Grade not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return grade;
}

/**
 * Create/Update grade
 */
async function upsertGrade(tenantId, userId, data) {
    // Validate class
    const classDoc = await Class.findOne({ _id: data.classId, tenantId });
    if (!classDoc) {
        throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Validate subject
    const subject = await Subject.findOne({ _id: data.subjectId, tenantId });
    if (!subject) {
        throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Validate student enrollment
    const enrollment = await Enrollment.findOne({
        tenantId,
        classId: data.classId,
        userId: data.studentId,
        status: 'active'
    });

    if (!enrollment) {
        throw new AppError('Student is not enrolled in this class', 400, ERROR_CODES.NOT_ENROLLED);
    }

    // Check if grade exists
    let grade = await Grade.findOne({
        tenantId,
        classId: data.classId,
        studentId: data.studentId,
        subjectId: data.subjectId,
        component: data.component
    });

    if (grade) {
        // Store old value for audit logging
        const oldValue = grade.value;

        grade.value = data.value;
        grade.gradedBy = userId;
        grade.gradedAt = new Date();
        await grade.save();

        await logAction({
            tenantId,
            userId,
            action: 'grade_updated',
            entity: 'Grade',
            entityId: grade._id,
            before: { value: oldValue },
            after: { value: data.value }
        });
    } else {
        grade = await Grade.create({
            tenantId,
            classId: data.classId,
            studentId: data.studentId,
            subjectId: data.subjectId,
            component: data.component,
            value: data.value,
            maxValue: data.maxValue,
            weight: data.weight,
            gradedBy: userId,
            gradedAt: new Date()
        });

        await logAction({
            tenantId,
            userId,
            action: 'grade_created',
            entity: 'Grade',
            entityId: grade._id
        });
    }

    return grade;
}

/**
 * Batch grade entry
 */
async function batchGradeEntry(tenantId, userId, classId, subjectId, grades) {
    const results = [];

    for (const gradeData of grades) {
        const grade = await upsertGrade(tenantId, userId, {
            classId,
            subjectId,
            studentId: gradeData.studentId,
            component: gradeData.component,
            value: gradeData.value,
            maxValue: gradeData.maxValue,
            weight: gradeData.weight
        });
        results.push(grade);
    }

    return results;
}

/**
 * Override grade (admin only)
 */
async function overrideGrade(tenantId, userId, gradeId, newValue, reason) {
    const grade = await Grade.findOne({ _id: gradeId, tenantId });
    if (!grade) {
        throw new AppError('Grade not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const oldValue = grade.value;
    grade.value = newValue;
    grade.gradedBy = userId;
    grade.gradedAt = new Date();
    await grade.save();

    await logAction({
        tenantId,
        userId,
        action: 'grade_override',
        entity: 'Grade',
        entityId: grade._id,
        before: { value: oldValue },
        after: { value: newValue, reason }
    });

    return grade;
}

/**
 * Get grade summary for a student in a class
 */
async function getGradeSummary(tenantId, classId, studentId) {
    const grades = await Grade.find({
        tenantId,
        classId,
        studentId
    }).populate('subjectId', 'name code creditHours');

    // Group by subject
    const summary = {};
    grades.forEach(grade => {
        const subjectId = grade.subjectId._id.toString();
        if (!summary[subjectId]) {
            summary[subjectId] = {
                subject: grade.subjectId,
                components: [],
                totalWeighted: 0,
                totalWeight: 0
            };
        }
        summary[subjectId].components.push({
            component: grade.component,
            value: grade.value,
            maxValue: grade.maxValue,
            weight: grade.weight
        });

        if (grade.weight && grade.maxValue) {
            const percentage = (grade.value / grade.maxValue) * grade.weight;
            summary[subjectId].totalWeighted += percentage;
            summary[subjectId].totalWeight += grade.weight;
        }
    });

    // Calculate final percentages
    return Object.values(summary).map(s => ({
        ...s,
        finalPercentage: s.totalWeight > 0 ? (s.totalWeighted / s.totalWeight * 100).toFixed(2) : null
    }));
}

/**
 * Delete grade
 */
async function deleteGrade(tenantId, userId, id) {
    const grade = await Grade.findOne({ _id: id, tenantId });
    if (!grade) {
        throw new AppError('Grade not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await grade.deleteOne();

    await logAction({
        tenantId,
        userId,
        action: 'grade_deleted',
        entity: 'Grade',
        entityId: id
    });

    return { message: 'Grade deleted successfully' };
}

module.exports = {
    getGradesByClass,
    getStudentGrades,
    getGradeById,
    upsertGrade,
    batchGradeEntry,
    overrideGrade,
    getGradeSummary,
    deleteGrade
};
