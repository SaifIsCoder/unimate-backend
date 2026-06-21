import path from "path";
import { AppError } from "./app-error.js";

const FIVE_MB = 5 * 1024 * 1024;
const TWENTY_MB = 20 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export const validateUploadFile = ({ mimetype, originalname, size }) => {
  const extension = path.extname(originalname || "").toLowerCase();
  const isImage = mimetype?.startsWith("image/") || IMAGE_EXTENSIONS.has(extension);
  const isDocument =
    mimetype === "application/pdf" ||
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    DOCUMENT_EXTENSIONS.has(extension);

  if (!isImage && !isDocument) {
    throw new AppError("Unsupported file type", 400);
  }

  const maxBytes = isImage ? FIVE_MB : TWENTY_MB;
  if (size > maxBytes) {
    throw new AppError(
      isImage ? "Image files must be 5MB or smaller" : "Document files must be 20MB or smaller",
      400
    );
  }

  return {
    isImage,
    isDocument,
    maxBytes,
  };
};
