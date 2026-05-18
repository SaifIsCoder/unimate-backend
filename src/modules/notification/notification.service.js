import admin, { isFirebaseReady } from "../../config/firebase.js";
import * as notificationRepo from "./notification.repository.js";
import { AppError } from "../../utils/app-error.js";

export const dispatchAnnouncementNotifications = async (announcement, userIds) => {
  if (!userIds || userIds.length === 0) return;

  try {
    // 1. Bulk Insert into DB for In-App history in Batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batchUserIds = userIds.slice(i, i + BATCH_SIZE);
      const dbPayload = batchUserIds.map(userId => ({
        user_id: userId,
        type: 'announcement',
        title: `New Announcement: ${announcement.title}`,
        message: announcement.content.substring(0, 100),
        reference_id: announcement.id
      }));
      await notificationRepo.bulkCreateNotifications(dbPayload);
    }

    // 2. Fetch FCM Tokens for these users
    const tokens = await notificationRepo.getFcmTokensForUsers(userIds);
    
    // 3. Push to Firebase in Batches (FCM limit is 500 per multicast)
    if (tokens.length > 0 && isFirebaseReady()) {
      const fcmPayload = {
        notification: {
          title: `New Announcement: ${announcement.title}`,
          body: announcement.content.substring(0, 100)
        },
        data: {
          type: 'announcement',
          reference_id: String(announcement.id)
        }
      };

      for (let i = 0; i < tokens.length; i += 500) {
        const batchTokens = tokens.slice(i, i + 500);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          ...fcmPayload
        });
        console.log(`[FCM] Successfully sent batch of ${response.successCount} notifications.`);
      }
    } else if (tokens.length > 0) {
      console.warn('[FCM] Tokens exist but Firebase is not initialized. Skipping push notification.');
    }
  } catch (error) {
    console.error('[Notification Service] Error dispatching notifications:', error);
    // We intentionally don't throw here to avoid rolling back the announcement
  }
};

export const registerFcmToken = async (userId, token) => {
  return notificationRepo.registerFcmToken(userId, token);
};

const transformNotification = (n) => {
  if (!n) return n;
  return {
    ...n,
    isRead: n.is_read,
    createdAt: n.created_at,
    body: n.message, // 🌟 Map message to body for mobile client compatibility
  };
};

export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const notifications = await notificationRepo.getUserNotifications(userId, limit, offset);
  return notifications.map(transformNotification);
};

export const markAsRead = async (id, userId) => {
  const notification = await notificationRepo.markAsRead(id, userId);
  if (!notification) {
    throw new AppError("Notification not found or access denied", 404);
  }
  return transformNotification(notification);
};

export const markAllAsRead = async (userId) => {
  const notifications = await notificationRepo.markAllAsRead(userId);
  return notifications.map(transformNotification);
};
