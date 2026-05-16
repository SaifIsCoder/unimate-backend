import admin from 'firebase-admin';
import env from './env.js';
import fs from 'fs';
import path from 'path';

let isFirebaseInitialized = false;

try {
  if (env.firebaseCredentialsPath) {
    const serviceAccountPath = path.resolve(process.cwd(), env.firebaseCredentialsPath);
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      isFirebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn(`Firebase service account file not found at ${serviceAccountPath}. Notifications will be disabled.`);
    }
  } else {
    console.warn('FIREBASE_CREDENTIALS_PATH not set in .env. Notifications will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

export const isFirebaseReady = () => isFirebaseInitialized;

export default admin;
