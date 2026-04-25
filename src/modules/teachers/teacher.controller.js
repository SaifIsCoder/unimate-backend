import service from "./teacher.service.js";
import { sendSuccess } from "../../utils/response.js";

const teacherController = {
  getAll: async (req, res) => sendSuccess(res, await service.listTeachers(), "Teachers fetched"),
};

export default teacherController;
