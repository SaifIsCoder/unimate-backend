import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/app-error.js";

export const uploadImage = async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  // Build the URL to access the uploaded file
  // E.g., if hosted on localhost:5000, it would be http://localhost:5000/uploads/filename.jpg
  // In production, you would use a base URL from env vars or construct it dynamically
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  return sendSuccess(res, { imageUrl }, 201);
};
