import service from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

const authController = {
  login: async (req, res) => {
    const result = await service.login(req.body || {});
    return sendSuccess(res, result, "Login scaffold is ready");
  },
};

export default authController;
