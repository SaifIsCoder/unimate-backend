import Joi from "joi";

const ASSESSMENT_TYPES = ["assignment", "sessional", "midterm", "final", "practical"];

export const submitGradeSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  student_id: Joi.string().uuid().required(),
  assessment_type: Joi.string().valid(...ASSESSMENT_TYPES).required(),
  reference_id: Joi.string().uuid().allow(null, "").optional(),
  title: Joi.string().required(),
  score: Joi.number().min(0).required(),
  max_score: Joi.number().positive().required(),
});
