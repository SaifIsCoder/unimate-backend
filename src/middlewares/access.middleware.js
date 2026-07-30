import { isAdmin } from "../constants/roles.js";
import { AppError } from "../utils/app-error.js";

export const selfOrAdminByOwner = (findResourceById, label) => async (req, res, next) => {
  if (isAdmin(req.user?.role)) {
    return next();
  }

  const resource = await findResourceById(req.params.id);

  if (!resource) {
    return next(new AppError(`${label} not found`, 404));
  }

  if (String(resource.user_id) !== String(req.user.id)) {
    return next(new AppError("You are not authorized to access this resource", 403));
  }

  return next();
};

export const selfByOwner = (findResourceById, label) => async (req, res, next) => {
  const resource = await findResourceById(req.params.id);

  if (!resource) {
    return next(new AppError(`${label} not found`, 404));
  }

  if (String(resource.user_id) !== String(req.user.id)) {
    return next(new AppError("You are not authorized to access this resource", 403));
  }

  return next();
};
