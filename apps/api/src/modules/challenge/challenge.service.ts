import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { ChallengeType, ChallengeStatus, SubmissionType } from '@bondbridge/database';
import { PaginatedResponse } from '@/common/dto';

@Injectable()
export class ChallengeService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(userId: string, data: {
    title: string;
    description: string;
    type: ChallengeType;
    communityId?: string;
    submissionTypes: SubmissionType[];
    startsAt: Date;
    endsAt: Date;
    lateEntryUntil?: Date;
    rules?: string;
    rewardDescription?: string;
    rewardBadgeId?: string;
  }) {
    // Authorization: community challenges require mod/admin role
    if (data.communityId) {
      const member = await this.prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId: data.communityId } },
      });
      if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
        throw new ForbiddenException('Only moderators and admins can create community challenges');
      }
    }

    return this.prisma.challenge.create({
      data: {
        ...data,
        creatorId: userId,
        status: new Date(data.startsAt) <= new Date() ? ChallengeStatus.ACTIVE : ChallengeStatus.DRAFT,
      },
    });
  }

  async getActive(type?: ChallengeType, communityId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const where: any = {
      status: { in: [ChallengeStatus.ACTIVE, ChallengeStatus.VOTING] },
      startsAt: { lte: now },
    };
    if (type) where.type = type;
    if (communityId) where.communityId = communityId;

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        include: {
          creator: { select: { id: true, profile: { select: { displayName: true } } } },
          community: { select: { id: true, name: true, slug: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { endsAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return new PaginatedResponse(challenges, total, page, limit);
  }

  async getById(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: { select: { id: true, profile: { select: { displayName: true } } } },
        community: { select: { id: true, name: true, slug: true } },
        submissions: {
          where: { isDisqualified: false },
          include: {
            user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
            _count: { select: { reactions: true } },
          },
          orderBy: { upvoteCount: 'desc' },
          take: 50,
        },
        _count: { select: { submissions: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async submit(userId: string, challengeId: string, data: {
    type: SubmissionType;
    content?: string;
    mediaUrls?: string[];
  }) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const now = new Date();
    const deadline = challenge.lateEntryUntil || challenge.endsAt;
    if (now > deadline) throw new BadRequestException('Challenge deadline has passed');
    if (challenge.status !== ChallengeStatus.ACTIVE) throw new BadRequestException('Challenge is not active');

    if (!challenge.submissionTypes.includes(data.type)) {
      throw new BadRequestException(`Submission type ${data.type} not allowed for this challenge`);
    }

    // Check for existing submission
    const existing = await this.prisma.challengeSubmission.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) throw new BadRequestException('You have already submitted to this challenge');

    // Community membership check for community challenges
    if (challenge.communityId) {
      const member = await this.prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId: challenge.communityId } },
      });
      if (!member) throw new ForbiddenException('Must be a community member');
    }

    const submission = await this.prisma.challengeSubmission.create({
      data: {
        challengeId,
        userId,
        type: data.type,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
      },
    });

    // Update counts and scores
    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { submissionCount: { increment: 1 } },
    });

    await this.prisma.userScore.update({
      where: { userId },
      data: {
        participationScore: { increment: 5 },
        consistencyScore: { increment: 2 },
        totalXp: { increment: 10 },
      },
    });

    // Update streak
    await this.updateStreak(userId, challenge.type);

    return submission;
  }

  async voteOnSubmission(userId: string, submissionId: string, type: string) {
    const submission = await this.prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      include: { challenge: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    // Cannot vote on own submission
    if (submission.userId === userId) {
      throw new BadRequestException('Cannot vote on your own submission');
    }

    const existing = await this.prisma.reaction.findFirst({
      where: { userId, submissionId, type: type as any },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      if (type === 'UPVOTE') {
        await this.prisma.challengeSubmission.update({
          where: { id: submissionId },
          data: { upvoteCount: { decrement: 1 } },
        });
      }
      return { removed: true };
    }

    await this.prisma.reaction.create({
      data: { userId, submissionId, type: type as any },
    });

    if (type === 'UPVOTE') {
      await this.prisma.challengeSubmission.update({
        where: { id: submissionId },
        data: { upvoteCount: { increment: 1 } },
      });
    }

    // Increment voter's support score
    await this.prisma.userScore.update({
      where: { userId },
      data: { supportScore: { increment: 1 }, totalXp: { increment: 1 } },
    });

    return { added: true };
  }

  async getTodaysPlatformChallenge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.challenge.findFirst({
      where: {
        type: ChallengeType.PLATFORM_DAILY,
        status: ChallengeStatus.ACTIVE,
        startsAt: { gte: today, lt: tomorrow },
      },
      include: { _count: { select: { submissions: true } } },
    });
  }

  private async updateStreak(userId: string, challengeType: ChallengeType) {
    const streakType = challengeType === ChallengeType.PLATFORM_DAILY
      ? 'daily_challenge'
      : 'community_challenge';

    const streak = await this.prisma.streak.findUnique({
      where: { userId_type: { userId, type: streakType } },
    });

    if (!streak) {
      await this.prisma.streak.create({
        data: { userId, type: streakType, currentCount: 1, longestCount: 1, lastActivityAt: new Date() },
      });
      return;
    }

    const lastActivity = streak.lastActivityAt;
    const now = new Date();
    const hoursSinceLastActivity = lastActivity
      ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceLastActivity <= 48) {
      // Continue streak
      const newCount = streak.currentCount + 1;
      await this.prisma.streak.update({
        where: { userId_type: { userId, type: streakType } },
        data: {
          currentCount: newCount,
          longestCount: Math.max(newCount, streak.longestCount),
          lastActivityAt: now,
          brokenAt: null,
        },
      });
    } else {
      // Streak broken, restart
      await this.prisma.streak.update({
        where: { userId_type: { userId, type: streakType } },
        data: {
          currentCount: 1,
          lastActivityAt: now,
          brokenAt: lastActivity,
        },
      });
    }
  }
}
