import { prisma } from "./db";

export type NotificationType =
  | "BUDGET_WARNING"
  | "BUDGET_EXCEEDED"
  | "SETTLEMENT_REMINDER"
  | "NEW_GROUP_EXPENSE"
  | "MONTHLY_REPORT"
  | "GOAL_PROGRESS";

/**
 * Triggers a notification for a user.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    // In a production app, we would trigger Push Notifications here.
    // Example: WebPush, Firebase Cloud Messaging, or Email alerts.
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Fetches unread notifications for a user.
 */
export async function getUnreadNotifications(userId: string) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

/**
 * Marks a notification as read.
 */
export async function markAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
