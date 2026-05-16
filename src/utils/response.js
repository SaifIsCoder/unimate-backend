export const sendSuccess = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res, message = "Something went wrong", statusCode = 500, type = "InternalError", code = undefined) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      type,
      code,
    },
  });
};
