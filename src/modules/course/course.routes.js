import express from "express";
import { ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./course.controller.js";
import { createCourseBody, emptyQuery, idParams, updateCourseBody } from "./course.validation.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware([ADMIN]),
  validate({ query: emptyQuery, body: createCourseBody }),
  asyncHandler(controller.createCourse)
);
router.get("/", validate({ query: emptyQuery }), asyncHandler(controller.getCourses));
router.get("/:id", validate({ params: idParams, query: emptyQuery }), asyncHandler(controller.getCourseById));
router.patch(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery, body: updateCourseBody }),
  asyncHandler(controller.updateCourse)
);
router.delete(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.deleteCourse)
);

export default router;
