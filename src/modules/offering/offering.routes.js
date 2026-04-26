import express from "express";
import { ADMIN } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./offering.controller.js";
import { createOfferingBody, emptyQuery, idParams, offeringQuery, updateOfferingBody } from "./offering.validation.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware([ADMIN]),
  validate({ query: emptyQuery, body: createOfferingBody }),
  asyncHandler(controller.createOffering)
);
router.get("/", validate({ query: offeringQuery }), asyncHandler(controller.getOfferings));
router.get("/:id", validate({ params: idParams, query: emptyQuery }), asyncHandler(controller.getOfferingById));
router.patch(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery, body: updateOfferingBody }),
  asyncHandler(controller.updateOffering)
);
router.delete(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.deleteOffering)
);

export default router;
