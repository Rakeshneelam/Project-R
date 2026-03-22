import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ReportReason, ReportStatus, ReportTargetType, ModerationActionType } from '@bondbridge/database';
import { PaginatedResponse } from '@/common/dto';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, data: {
    targetType: ReportTargetType;
    targetId: string;
    targetUserId?: string;
    reason: ReportReason;
    description?: string;
  }) {
    return this.prisma.report.create({
      data: { reporterId, ...data },
    });
  }

  async getReports(status?: ReportStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, profile: { select: { displayName: true } } } },
          targetUser: { select: { id: true, profile: { select: { displayName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return new PaginatedResponse(reports, total, page, limit);
  }

  async resolveReport(reportId: string, moderatorId: string, data: {
    status: ReportStatus;
    reviewNote?: string;
    action?: {
      actionType: ModerationActionType;
      reason: string;
      expiresAt?: Date;
    };
  }) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        reviewedBy: moderatorId,
        reviewNote: data.reviewNote,
        resolvedAt: new Date(),
      },
    });

    // Take moderation action if specified
    if (data.action && report.targetUserId) {
      await this.prisma.moderationAction.create({
        data: {
          userId: report.targetUserId,
          moderatorId,
          actionType: data.action.actionType,
          reason: data.action.reason,
          expiresAt: data.action.expiresAt,
          reportId,
        },
      });

      // Apply action effects
      await this.applyModerationAction(report.targetUserId, data.action.actionType);
    }

    return { success: true };
  }

  async blockUser(blockerId: string, blockedId: string) {
    return this.prisma.block.create({
      data: { blockerId, blockedId },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });
  }

  async computeTrustScore(userId: string): Promise<number> {
    const [reports, actions, verification, scores] = await Promise.all([
      this.prisma.report.count({ where: { targetUserId: userId, status: ReportStatus.RESOLVED } }),
      this.prisma.moderationAction.count({ where: { userId } }),
      this.prisma.userVerification.findUnique({ where: { userId } }),
      this.prisma.userScore.findUnique({ where: { userId } }),
    ]);

    let trustScore = 50; // Base score

    // Verification boost
    if (verification?.status === 'VERIFIED') trustScore += 15;

    // Report penalties
    trustScore -= reports * 5;

    // Moderation action penalties
    trustScore -= actions * 10;

    // Participation bonus
    if (scores) {
      if (scores.participationScore > 100) trustScore += 5;
      if (scores.consistencyScore > 50) trustScore += 5;
      if (scores.supportScore > 50) trustScore += 5;
    }

    // Clamp between 0-100
    trustScore = Math.max(0, Math.min(100, trustScore));

    await this.prisma.userScore.update({
      where: { userId },
      data: { trustScore },
    });

    return trustScore;
  }

  private async applyModerationAction(userId: string, actionType: ModerationActionType) {
    switch (actionType) {
      case ModerationActionType.BAN:
      case ModerationActionType.ACCOUNT_SUSPENSION:
        await this.prisma.user.update({
          where: { id: userId },
          data: { isBanned: true, banReason: `Moderation action: ${actionType}` },
        });
        break;
      case ModerationActionType.TRUST_REDUCTION:
        await this.prisma.userScore.update({
          where: { userId },
          data: { trustScore: { decrement: 15 } },
        });
        break;
      case ModerationActionType.SCORE_PENALTY:
        await this.prisma.userScore.update({
          where: { userId },
          data: { totalXp: { decrement: 50 }, participationScore: { decrement: 10 } },
        });
        break;
    }
  }
}
