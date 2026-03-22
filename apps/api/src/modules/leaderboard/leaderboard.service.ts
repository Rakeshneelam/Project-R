import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { LeaderboardPeriod, LeaderboardCategory } from '@bondbridge/database';

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private getRedisKey(period: LeaderboardPeriod, category: LeaderboardCategory, communityId?: string): string {
    const scope = communityId || 'global';
    return `lb:${period}:${category}:${scope}`;
  }

  async updateScore(userId: string, category: LeaderboardCategory, increment: number, communityId?: string) {
    // Update Redis sorted sets for each period
    for (const period of [LeaderboardPeriod.DAILY, LeaderboardPeriod.WEEKLY, LeaderboardPeriod.MONTHLY, LeaderboardPeriod.ALL_TIME]) {
      const key = this.getRedisKey(period, category, communityId);
      await this.redis.zincrby(key, increment, userId);
    }
  }

  async getLeaderboard(
    period: LeaderboardPeriod,
    category: LeaderboardCategory,
    communityId?: string,
    page = 1,
    limit = 20,
  ) {
    const key = this.getRedisKey(period, category, communityId);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const entries = await this.redis.zrevrangeWithScores(key, start, end);

    // Enrich with user data
    const userIds = entries.map((e) => e.member);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        profile: { select: { displayName: true, avatarUrl: true } },
        verification: { select: { status: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return entries.map((entry, index) => ({
      rank: start + index + 1,
      score: entry.score,
      user: userMap.get(entry.member) || { id: entry.member },
    }));
  }

  async getUserRank(userId: string, period: LeaderboardPeriod, category: LeaderboardCategory, communityId?: string) {
    const key = this.getRedisKey(period, category, communityId);
    const rank = await this.redis.zrevrank(key, userId);
    return { rank: rank !== null ? rank + 1 : null };
  }

  async getUserLeaderboardSummary(userId: string) {
    const categories = Object.values(LeaderboardCategory);
    const summary: Record<string, any> = {};

    for (const category of categories) {
      const key = this.getRedisKey(LeaderboardPeriod.ALL_TIME, category);
      const rank = await this.redis.zrevrank(key, userId);
      summary[category] = { rank: rank !== null ? rank + 1 : null };
    }

    return summary;
  }
}
