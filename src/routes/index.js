import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import studentRoutes from "../modules/student/student.routes.js";
import teacherRoutes from "../modules/teacher/teacher.routes.js";
import courseRoutes from "../modules/course/course.routes.js";
import offeringRoutes from "../modules/offering/offering.routes.js";
import enrollmentRoutes from "../modules/enrollment/enrollment.routes.js";
import scheduleRoutes from "../modules/schedule/schedule.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import assignmentRoutes from "../modules/assignment/assignment.routes.js";
import gradesRoutes from "../modules/grades/grades.routes.js";
import announcementRoutes from "../modules/announcement/announcement.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import adminRoutes from "../modules/admins/admin.routes.js";
import communityRoutes from "../modules/community/community.routes.js";
import departmentRoutes from "../modules/department/department.routes.js";
import { sendSuccess } from "../utils/response.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "../docs/swagger.yaml"));

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.get("/health", (req, res) => {
  return sendSuccess(res, { status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/courses", courseRoutes);
router.use("/offerings", offeringRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/grades", gradesRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admins", adminRoutes);
router.use("/community", communityRoutes);
router.use("/departments", departmentRoutes);

export default router;
