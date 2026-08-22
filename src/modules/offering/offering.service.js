import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as courseRepository from "../course/course.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as offeringRepository from "./offering.repository.js";
import { getPagination } from "../../utils/pagination.js";

const assertCourseExists = async (courseId) => {
  const course = await courseRepository.findById(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

const assertTeacherExists = async (teacherId) => {
  if (teacherId === undefined || teacherId === null) {
    return null;
  }

  const teacher = await teacherRepository.findById(teacherId);

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
};

const WEIGHT_FIELDS = [
  "mid_weight",
  "sessional_weight",
  "final_weight",
  "practical_weight",
];

// Grade calculation divides by these percentages, so a set that does not add up
// to 100 silently produces wrong final marks. Reject it at the boundary.
const assertWeightsSumToHundred = (weights) => {
  const total = WEIGHT_FIELDS.reduce(
    (sum, field) => sum + Number(weights[field] ?? 0),
    0,
  );

  // Tolerance for the decimal column round-tripping through JS floats.
  if (Math.abs(total - 100) > 0.01) {
    throw new AppError(
      `Assessment weights must total 100 (received ${total})`,
      400,
    );
  }
};

export const createOffering = async (payload) => {
  await assertCourseExists(payload.course_id);
  await assertTeacherExists(payload.teacher_id);
  assertWeightsSumToHundred(payload);

  return offeringRepository.create(payload);
};

export const getOfferings = async (filters = {}) => {
  const { page, limit, offset } = getPagination(filters);
  return offeringRepository.findAll(filters, limit, offset);
};

export const getOfferingById = async (id) => {
  const offering = await offeringRepository.findById(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  return offering;
};

export const updateOffering = async (id, payload) => {
  const offering = await offeringRepository.findById(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  if (payload.course_id) {
    await assertCourseExists(payload.course_id);
  }

  await assertTeacherExists(payload.teacher_id);

  const data = omitUndefined(payload);

  // A partial weight update still has to leave the offering summing to 100, so
  // validate the merged result rather than just the supplied fields.
  if (WEIGHT_FIELDS.some((field) => data[field] !== undefined)) {
    assertWeightsSumToHundred({
      mid_weight: offering.mid_weight,
      sessional_weight: offering.sessional_weight,
      final_weight: offering.final_weight,
      practical_weight: offering.practical_weight,
      ...Object.fromEntries(
        WEIGHT_FIELDS.filter((field) => data[field] !== undefined).map(
          (field) => [field, data[field]],
        ),
      ),
    });
  }

  return offeringRepository.update(id, data);
};

export const deleteOffering = async (id) => {
  const offering = await offeringRepository.remove(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  return offering;
};
