import { AppError } from "../utils/app-error.js";

const validate = (schemas = {}) => (req, res, next) => {
  const options = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
    convert: true,
  };

  for (const segment of ["params", "query", "body"]) {
    const schema = schemas[segment];

    if (!schema) {
      continue;
    }

    const source = req[segment] ?? {};
    const { value, error } = schema.validate(source, options);

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      return next(new AppError(message, 400));
    }

    if (segment !== "query") {
      req[segment] = value;
    }
  }

  return next();
};

export default validate;
