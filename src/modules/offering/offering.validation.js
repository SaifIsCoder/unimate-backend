import Joi from "joi";

export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const emptyQuery = Joi.object({});

import { paginationSchema } from "../../utils/pagination.js";

export const offeringQuery = Joi.object({
  semester: Joi.string().trim().max(50),
  course_id: Joi.string().uuid(),
  ...paginationSchema,
});

// Assessment weights feed academic-rules.calculateRawMarks(); each is a
// percentage of the final course grade. Defaults mirror the column defaults on
// course_offerings so existing clients keep the current 30/20/50/0 split.
const weight = Joi.number().min(0).max(100);

export const createOfferingBody = Joi.object({
  course_id: Joi.string().uuid().required(),
  teacher_id: Joi.string().uuid().allow(null),
  semester: Joi.string().trim().min(2).max(50).required(),
  section: Joi.string().trim().min(1).max(20).required(),
  capacity: Joi.number().integer().min(1).max(500).required(),
  mid_weight: weight.default(30),
  sessional_weight: weight.default(20),
  final_weight: weight.default(50),
  practical_weight: weight.default(0),
});

export const updateOfferingBody = Joi.object({
  course_id: Joi.string().uuid(),
  teacher_id: Joi.string().uuid().allow(null),
  semester: Joi.string().trim().min(2).max(50),
  section: Joi.string().trim().min(1).max(20),
  capacity: Joi.number().integer().min(1).max(500),
  mid_weight: weight,
  sessional_weight: weight,
  final_weight: weight,
  practical_weight: weight,
}).min(1);
