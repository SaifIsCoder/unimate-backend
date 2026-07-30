import Joi from "joi";

export const emptyQuery = Joi.object({});

// Handlers that read nothing off the request still get a schema so that
// stripUnknown drops stray keys instead of letting them reach the service.
export const emptyBody = Joi.object({});

// GPA is scored on the 4.0 scale enforced by utils/academic-rules.js.
const targetCgpa = Joi.number().min(0).max(4);

// students.study_intensity is a free-text column (no DB enum), so this is only
// length-bounded rather than restricted to a guessed vocabulary.
const studyIntensity = Joi.string().trim().max(30);

export const copilotBody = Joi.object({
  query: Joi.string().trim().min(1).max(2000).required(),
  // A course_offerings.id — the service loads that offering's grades and
  // attendance into the prompt context. Empty/null means "no active course".
  activeCourseId: Joi.string().uuid().allow(null, ""),
});

export const gradeProjectionBody = Joi.object({
  targetCgpa,
  studyIntensity,
});

export const studyBlocksBody = Joi.object({
  date: Joi.date().iso(),
});

export const gpaGoalBody = Joi.object({
  targetCgpa,
  studyIntensity,
  // Echoed back to the caller verbatim, so the item shape is left open.
  upcomingAssessments: Joi.array().items(Joi.object().unknown(true)),
});

export const smartScheduleQuery = Joi.object({
  date: Joi.date().iso(),
});
