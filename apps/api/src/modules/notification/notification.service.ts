import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationType } from '@bondbridge/database';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  /** Register (or update) the user's Expo / FCM push token */
  async registerPushToken(userId: string, token: string, platform: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token, pushPlatform: platform } as any,
    });
  }

  /** Create an in-app notification AND send a push if the user has a token */
  async create(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, any>) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data as any },
    });

    // Fire-and-forget push notification
    this.sendPushNotification(userId, title, body, data).catch(() => {});

    return notification;
  }

  /** Send an FCM push notification to the user's device */
  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true } as any,
      });

      const token = (user as any)?.pushToken;
      if (!token) return;

      // Skip if Firebase Admin is not initialized
      if (admin.apps.length === 0) return;

      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });

      this.logger.log(`Push sent to user ${userId}`);
    } catch (err: any) {
      this.logger.warn(`Push failed for user ${userId}: ${err.message}`);
    }
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    const unreadCount = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { data: notifications, meta: { total, page, limit, unreadCount } };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

