import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationType } from '@bondbridge/database';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, any>) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data as any },
    });

    // TODO: Send push notification via Expo Push / FCM
    // This would be handled by a BullMQ job in production

    return notification;
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
