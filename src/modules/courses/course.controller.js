import service from "./course.service.js";
import { sendSuccess } from "../../utils/response.js";

const courseController = {
  getAll: async (req, res) => sendSuccess(res, await service.listCourses(), "Courses fetched"),
};

export default courseController;
