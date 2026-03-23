import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginatedResponse } from '@/common/dto';
import { NotificationService } from '../notification/notification.service';


@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        include: {
          participants: {
            include: {
              user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
            },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { participants: { some: { userId } } } }),
    ]);

    return new PaginatedResponse(
      conversations.map(c => ({
        ...c,
        otherParticipants: c.participants.filter(p => p.userId !== userId),
        lastMessage: c.messages[0] || null,
      })),
      total, page, limit,
    );
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 50) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        include: {
          sender: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId, isDeleted: false } }),
    ]);

    // Mark as read
    await this.prisma.conversationParticipant.update({
      where: { userId_conversationId: { userId, conversationId } },
      data: { lastReadAt: new Date() },
    });

    return new PaginatedResponse(messages, total, page, limit);
  }

  async sendMessage(userId: string, conversationId: string, content: string, mediaUrls?: string[]) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        mediaUrls: mediaUrls || [],
      },
      include: {
        sender: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Send push notification to other participants
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });
    const senderName = message.sender?.profile?.displayName ?? 'Someone';
    for (const p of participants) {
      this.notificationService.sendPushNotification(
        p.userId,
        `New message from ${senderName}`,
        message.content ?? '📎 Media',
        { conversationId, type: 'NEW_MESSAGE' },
      ).catch(() => {});
    }

    return message;
  }

  async createOrGetDirectConversation(userId: string, otherUserId: string) {
    // Check for blocks
    const block = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] },
    });
    if (block) throw new NotFoundException('User not found');

    // Check DM settings
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      include: { settings: true },
    });
    if (!otherUser?.settings?.dmFromStrangers) {
      // Check if they are friends
      const friendship = await this.prisma.friendRequest.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      });
      if (!friendship) throw new ForbiddenException('User does not accept DMs from non-friends');
    }

    // Find existing conversation
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });
    if (existing) return existing;

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
    });
  }
}
