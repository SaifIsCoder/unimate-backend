import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import teacherRoutes from "../modules/teachers/teacher.routes.js";
import adminRoutes from "../modules/admins/admin.routes.js";
import courseRoutes from "../modules/courses/course.routes.js";
import offeringRoutes from "../modules/courseOffering/offering.routes.js";
import enrollmentRoutes from "../modules/enrollment/enrollment.routes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/admins", adminRoutes);
router.use("/courses", courseRoutes);
router.use("/course-offerings", offeringRoutes);
router.use("/enrollments", enrollmentRoutes);

export default router;
