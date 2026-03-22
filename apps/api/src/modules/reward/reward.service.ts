import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginatedResponse } from '@/common/dto';

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  async getAllBadges() {
    return this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async awardBadge(userId: string, badgeId: string, source?: string) {
    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (existing) return existing;

    return this.prisma.userBadge.create({
      data: { userId, badgeId, source },
      include: { badge: true },
    });
  }

  async getAvailableRewards(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rewards, total] = await Promise.all([
      this.prisma.reward.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reward.count({ where: { isActive: true } }),
    ]);
    return new PaginatedResponse(rewards, total, page, limit);
  }

  async claimReward(userId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) throw new NotFoundException('Reward not found');

    if (reward.stock !== null && reward.claimed >= reward.stock) {
      throw new NotFoundException('Reward is out of stock');
    }

    if (reward.cost) {
      const scores = await this.prisma.userScore.findUnique({ where: { userId } });
      if (!scores || scores.totalXp < reward.cost) {
        throw new NotFoundException('Insufficient XP');
      }
      await this.prisma.userScore.update({
        where: { userId },
        data: { totalXp: { decrement: reward.cost } },
      });
    }

    await this.prisma.reward.update({
      where: { id: rewardId },
      data: { claimed: { increment: 1 } },
    });

    return this.prisma.userReward.create({
      data: { userId, rewardId },
      include: { reward: true },
    });
  }
}
