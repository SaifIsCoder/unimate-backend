import service from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";

const userController = {
  getAll: async (req, res) => sendSuccess(res, await service.listUsers(), "Users fetched"),
};

export default userController;
