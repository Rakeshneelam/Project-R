import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        profile: true,
        scores: true,
        verification: {
          select: { status: true, verifiedAt: true },
        },
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
          take: 20,
        },
        streaks: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getPublicProfile(userId: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile: true,
        scores: {
          select: {
            participationScore: true,
            consistencyScore: true,
            creativityScore: true,
            supportScore: true,
            trustScore: true,
            overallLevel: true,
          },
        },
        verification: {
          select: { status: true },
        },
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Check if viewer is blocked
    if (viewerId) {
      const blocked = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: viewerId },
            { blockerId: viewerId, blockedId: userId },
          ],
        },
      });
      if (blocked) throw new NotFoundException('User not found');
    }

    // Respect privacy settings
    if (!user.profile?.isProfilePublic && viewerId !== userId) {
      return {
        id: user.id,
        displayName: user.profile?.displayName,
        isAnonymous: user.profile?.isAnonymous,
        verificationStatus: user.verification?.status,
        level: user.scores?.overallLevel,
      };
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...dto,
        socialType: dto.socialType as any,
        communicationStyle: dto.communicationStyle as any,
        datingIntent: dto.datingIntent as any,
      },
    });
    return profile;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const settings = await this.prisma.userSettings.update({
      where: { userId },
      data: dto,
    });
    return settings;
  }

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) throw new NotFoundException('Settings not found');
    return settings;
  }

  async getScores(userId: string) {
    const scores = await this.prisma.userScore.findUnique({
      where: { userId },
    });
    if (!scores) throw new NotFoundException('Scores not found');
    return scores;
  }

  async searchUsers(query: string, currentUserId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get blocked user IDs to exclude
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
    });
    const blockedIds = blocks.map((b) =>
      b.blockerId === currentUserId ? b.blockedId : b.blockerId,
    );

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { notIn: [currentUserId, ...blockedIds] },
          isActive: true,
          isBanned: false,
          profile: {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { nickname: { contains: query, mode: 'insensitive' } },
              { interests: { hasSome: [query.toLowerCase()] } },
            ],
          },
        },
        select: {
          id: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              socialType: true,
              city: true,
              isAnonymous: true,
            },
          },
          scores: {
            select: { overallLevel: true, trustScore: true },
          },
          verification: {
            select: { status: true },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          id: { notIn: [currentUserId, ...blockedIds] },
          isActive: true,
          isBanned: false,
          profile: {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { nickname: { contains: query, mode: 'insensitive' } },
              { interests: { hasSome: [query.toLowerCase()] } },
            ],
          },
        },
      }),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
