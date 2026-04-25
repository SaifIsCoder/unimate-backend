import service from "./enrollment.service.js";
import { sendSuccess } from "../../utils/response.js";

const enrollmentController = {
  getAll: async (req, res) => sendSuccess(res, await service.listEnrollments(), "Enrollments fetched"),
};

export default enrollmentController;
