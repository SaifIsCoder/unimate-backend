import * as offeringService from "./offering.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createOffering = async (req, res) => {
  const offering = await offeringService.createOffering(req.body);
  return sendSuccess(res, offering, 201);
};

export const getOfferings = async (req, res) => {
  const query = { ...req.query };
  if (req.user?.role === "admin" && req.user?.department_id) {
    query.department_id = req.user.department_id;
  }
  const offerings = await offeringService.getOfferings(query);
  return sendSuccess(res, offerings);
};

export const getOfferingById = async (req, res) => {
  const offering = await offeringService.getOfferingById(req.params.id);
  return sendSuccess(res, offering);
};

export const updateOffering = async (req, res) => {
  const offering = await offeringService.updateOffering(req.params.id, req.body);
  return sendSuccess(res, offering);
};

export const deleteOffering = async (req, res) => {
  const offering = await offeringService.deleteOffering(req.params.id);
  return sendSuccess(res, offering);
};
