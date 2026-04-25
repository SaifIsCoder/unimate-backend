import service from "./admin.service.js";
import { sendSuccess } from "../../utils/response.js";

const adminController = {
  getAll: async (req, res) => sendSuccess(res, await service.listAdmins(), "Admins fetched"),
};

export default adminController;
