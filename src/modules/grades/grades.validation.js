import Joi from "joi";

const ASSESSMENT_TYPES = [
  "assignment",
  "sessional",
  "midterm",
  "final",
  "practical",
  "quiz",
  "presentation",
  "project",
];

export const submitGradeSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  student_id: Joi.string().uuid().required(),
  assessment_type: Joi.string()
    .valid(...ASSESSMENT_TYPES)
    .required(),
  reference_id: Joi.string().uuid().allow(null, "").optional(),
  title: Joi.string().when("assessment_type", {
    is: Joi.valid("assignment", "quiz", "presentation", "project"),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  score: Joi.number().min(0).required(),
  max_score: Joi.number().positive().when("assessment_type", {
    is: Joi.valid("assignment", "quiz", "presentation", "project"),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
});

export const offeringIdParams = Joi.object({
  offeringId: Joi.string().uuid().required(),
});

export const studentIdParams = Joi.object({
  studentId: Joi.string().uuid().required(),
});

export const calculationParams = Joi.object({
  studentId: Joi.string().uuid().required(),
  offeringId: Joi.string().uuid().required(),
});
export const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const myCourseParams = Joi.object({
  courseId: Joi.string().uuid().required(),
});
