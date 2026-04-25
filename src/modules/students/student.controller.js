import service from "./student.service.js";
import { sendSuccess } from "../../utils/response.js";

const studentController = {
  getAll: async (req, res) => sendSuccess(res, await service.listStudents(), "Students fetched"),
};

export default studentController;
