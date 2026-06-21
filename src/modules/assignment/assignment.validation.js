import Joi from "joi";

export const createAssignmentSchema = Joi.object({
  offering_id: Joi.string().uuid().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  assessment_type: Joi.string().valid("assignment", "quiz", "presentation", "project").default("assignment"),
  due_date: Joi.date().iso().required(),
  total_points: Joi.number().positive().required(),
});

export const updateAssignmentSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().allow(null, "").optional(),
  assessment_type: Joi.string().valid("assignment", "quiz", "presentation", "project").optional(),
  due_date: Joi.date().iso().optional(),
  total_points: Joi.number().positive().optional(),
});
export const idParams = Joi.object({
  id: Joi.string().uuid().required(),
});

export const offeringIdParams = Joi.object({
  offeringId: Joi.string().uuid().required(),
});

export const getMyAssignmentsQuery = Joi.object({
  status: Joi.string().valid("pending", "done", "overdue").optional(),
});

export const submitAssignmentSchema = Joi.object({
  fileUrl: Joi.string().uri().allow(null, "").optional(),
  textContent: Joi.string().trim().allow(null, "").optional(),
}).or("fileUrl", "textContent");

export const updateProgressSchema = Joi.object({
  progress: Joi.number().integer().min(0).max(100).required(),
  status: Joi.string().valid("pending", "done", "overdue").optional(),
});
