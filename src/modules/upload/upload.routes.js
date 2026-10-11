import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import authMiddleware from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as uploadController from "./upload.controller.js";
import { AppError } from "../../utils/app-error.js";
import env from "../../config/env.js";

const router = Router();

// ── Storage Strategy ──────────────────────────────────────────────────────────
// In production on Render, the filesystem is ephemeral. Uploaded files will be
// lost on redeploy. For a production-grade setup, integrate an object-storage
// provider (e.g., Supabase Storage, AWS S3, Cloudflare R2).
//
// The UPLOAD_PROVIDER env var controls this:
//   - "local" (default): disk storage under public/uploads
//   - Future: "s3", "supabase-storage", etc.
//
// For now, we use disk storage with security hardening.

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Sanitise filenames to prevent path-traversal attacks.
 */
const safeFilename = (originalname) => {
  const ext = path.extname(originalname || "").toLowerCase();
  // Only allow safe extensions
  const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError("Invalid file extension", 400);
  }
  const randomName = crypto.randomBytes(16).toString("hex");
  return `${randomName}${ext}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    try {
      cb(null, safeFilename(file.originalname));
    } catch (err) {
      cb(err);
    }
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(authMiddleware);

router.post("/", upload.single("image"), asyncHandler(uploadController.uploadImage));

export default router;
