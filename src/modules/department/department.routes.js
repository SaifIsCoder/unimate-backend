import express from "express";
import { ADMIN, SUPER_ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./department.controller.js";
import { createDepartmentBody, idParams, updateDepartmentBody } from "./department.validation.js";

const router = express.Router();

// Publicly viewable by any authenticated user
router.use(authMiddleware);

router.get("/", asyncHandler(controller.getDepartments));
router.get("/:id", validate({ params: idParams }), asyncHandler(controller.getDepartmentById));

// Admin/SuperAdmin only: modifications
router.use(roleMiddleware([ADMIN, SUPER_ADMIN]));

router.post("/", validate({ body: createDepartmentBody }), asyncHandler(controller.createDepartment));
router.patch("/:id", validate({ params: idParams, body: updateDepartmentBody }), asyncHandler(controller.updateDepartment));
router.delete("/:id", validate({ params: idParams }), asyncHandler(controller.deleteDepartment));

export default router;
