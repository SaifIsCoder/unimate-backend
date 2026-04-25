import service from "./offering.service.js";
import { sendSuccess } from "../../utils/response.js";

const offeringController = {
  getAll: async (req, res) => sendSuccess(res, await service.listOfferings(), "Course offerings fetched"),
};

export default offeringController;
