import admin from "firebase-admin";
import env from "./env.js";
import fs from "fs";
import path from "path";
import * as logger from "./logger.js";

let isFirebaseInitialized = false;

try {
  let serviceAccount = null;

  // Priority 1: JSON string in environment variable (recommended for Render)
  if (env.firebaseServiceAccountKey) {
    try {
      serviceAccount = JSON.parse(env.firebaseServiceAccountKey);
    } catch {
      logger.warn("FIREBASE_SERVICE_ACCOUNT_KEY is set but contains invalid JSON. Notifications will be disabled.");
    }
  }

  // Priority 2: File path (local development)
  if (!serviceAccount && env.firebaseCredentialsPath) {
    const serviceAccountPath = path.resolve(process.cwd(), env.firebaseCredentialsPath);

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    } else {
      logger.warn(`Firebase service account file not found at ${serviceAccountPath}. Notifications will be disabled.`);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isFirebaseInitialized = true;
    logger.info("Firebase Admin SDK initialized successfully.");
  } else {
    logger.warn("Firebase credentials not configured. Push notifications will be disabled.");
  }
} catch (error) {
  logger.error({ err: error }, "Error initializing Firebase Admin SDK");
}

export const isFirebaseReady = () => isFirebaseInitialized;

export default admin;
