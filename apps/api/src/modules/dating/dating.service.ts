import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DatingStage, DatingCloseReason } from '@bondbridge/database';

/** Prompts used during the guided text phase */
const DATING_PROMPTS = [
  'What does a perfect day off look like for you?',
  'What is something you are passionate about that most people don\'t know?',
  'What quality do you value most in a close relationship?',
  'Describe a small moment that made you genuinely happy recently.',
  'What is your favorite way to show someone you care?',
  'If we spent 3 hours together, what would you want us to do?',
  'What is one thing you are working on improving about yourself?',
];

@Injectable()
export class DatingService {
  constructor(private prisma: PrismaService) {}

  /** Run the matchmaking engine and create a match if eligible */
  async findMatch(userId: string) {
    // Check for active match (one-at-a-time enforcement)
    const activeMatch = await this.prisma.datingMatch.findFirst({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });
    if (activeMatch) {
      throw new BadRequestException('You already have an active dating match. Complete or close it first.');
    }

    // Check cooldown
    const lastClosed = await this.prisma.datingMatch.findFirst({
      where: {
        isActive: false,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { closedAt: 'desc' },
    });
    if (lastClosed?.cooldownUntil && lastClosed.cooldownUntil > new Date()) {
      throw new BadRequestException(`Cooldown active until ${lastClosed.cooldownUntil.toISOString()}`);
    }

    // Get user profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, scores: true, settings: true },
    });
    if (!user?.profile) throw new NotFoundException('Profile not found');
    if (user.profile.datingIntent === 'NOT_INTERESTED') {
      throw new BadRequestException('Dating intent is set to not interested');
    }
    if (!user.settings?.allowDatingMatch) {
      throw new BadRequestException('Dating matching is disabled in settings');
    }

    // Get blocked users
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const blockedIds = blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);

    // Get past matches to avoid re-matching
    const pastMatches = await this.prisma.datingMatch.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    const pastMatchedIds = pastMatches.map(m => m.userAId === userId ? m.userBId : m.userAId);

    const excludeIds = [...new Set([userId, ...blockedIds, ...pastMatchedIds])];

    // Find candidates
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        isActive: true,
        isBanned: false,
        profile: {
          datingIntent: { in: ['OPEN_TO_IT', 'ACTIVELY_LOOKING'] },
        },
        settings: { allowDatingMatch: true },
        // No active matches (one-at-a-time)
        datingMatchesAsA: { none: { isActive: true } },
        datingMatchesAsB: { none: { isActive: true } },
      },
      include: { profile: true, scores: true },
      take: 50,
    });

    if (candidates.length === 0) {
      return { match: null, message: 'No compatible matches available right now. Check back later.' };
    }

    // Score candidates (similar to friendship but with dating-specific factors)
    const scored = candidates
      .filter(c => c.profile)
      .map(candidate => {
        let score = 0;

        // Gender preference check
        if (user.profile!.genderPreference.length > 0 && candidate.profile!.gender) {
          if (!user.profile!.genderPreference.includes(candidate.profile!.gender)) return null;
        }
        if (candidate.profile!.genderPreference.length > 0 && user.profile!.gender) {
          if (!candidate.profile!.genderPreference.includes(user.profile!.gender)) return null;
        }

        // Interest overlap
        const sharedInterests = user.profile!.interests.filter(i =>
          candidate.profile!.interests.includes(i),
        ).length;
        score += Math.min(sharedInterests * 5, 25);

        // Vibe compatibility
        const sharedVibes = user.profile!.vibeTags.filter(v =>
          candidate.profile!.vibeTags.includes(v),
        ).length;
        score += Math.min(sharedVibes * 5, 20);

        // City match
        if (user.profile!.city && candidate.profile!.city &&
            user.profile!.city.toLowerCase() === candidate.profile!.city.toLowerCase()) {
          score += 20;
        }

        // Trust score
        if (candidate.scores && candidate.scores.trustScore >= 70) score += 15;
        else if (candidate.scores && candidate.scores.trustScore >= 50) score += 8;

        // Communication style compatibility
        if (user.profile!.communicationStyle === candidate.profile!.communicationStyle) score += 10;

        // Dating feedback from past matches (if available)
        // TODO: Factor in aggregated dating feedback in V2

        return { user: candidate, matchScore: score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.matchScore - a!.matchScore) as { user: any; matchScore: number }[];

    if (scored.length === 0) {
      return { match: null, message: 'No compatible matches available right now.' };
    }

    // Select the top match
    const topMatch = scored[0];

    // Create the dating match
    const match = await this.prisma.datingMatch.create({
      data: {
        userAId: userId,
        userBId: topMatch.user.id,
        matchScore: topMatch.matchScore,
        stage: DatingStage.MATCHED,
        prompts: {
          create: DATING_PROMPTS.map((text, index) => ({
            promptText: text,
            order: index + 1,
          })),
        },
      },
      include: {
        prompts: { orderBy: { order: 'asc' }, take: 1 },
      },
    });

    return {
      match: {
        id: match.id,
        stage: match.stage,
        matchScore: match.matchScore,
        partner: {
          displayName: topMatch.user.profile.displayName,
          // Progressive reveal: don't show avatar initially
          socialType: topMatch.user.profile.socialType,
          interests: topMatch.user.profile.interests.slice(0, 3),
        },
        currentPrompt: match.prompts[0],
      },
    };
  }

  async getActiveMatch(userId: string) {
    const match = await this.prisma.datingMatch.findFirst({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true, interests: true } } } },
        userB: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true, interests: true } } } },
        prompts: { orderBy: { order: 'asc' } },
      },
    });

    if (!match) return null;

    const isUserA = match.userAId === userId;
    const partner = isUserA ? match.userB : match.userA;

    // Progressive reveal logic
    const revealStages: string[] = [DatingStage.VOICE_UNLOCKED, DatingStage.MEET_SUGGESTED, DatingStage.POST_DATE];
    const showAvatar = revealStages.includes(match.stage);

    return {
      id: match.id,
      stage: match.stage,
      matchScore: match.matchScore,
      promptsCompleted: match.promptsCompleted,
      partner: {
        id: partner.id,
        displayName: partner.profile?.displayName,
        avatarUrl: showAvatar ? partner.profile?.avatarUrl : null,
        interests: partner.profile?.interests?.slice(0, 5),
      },
      prompts: match.prompts,
      myCheckpoint: isUserA ? match.checkpointAApproved : match.checkpointBApproved,
      partnerCheckpoint: isUserA ? match.checkpointBApproved : match.checkpointAApproved,
      lastActivityAt: match.lastActivityAt,
    };
  }

  async respondToPrompt(userId: string, matchId: string, promptId: string, response: string) {
    const match = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match || !match.isActive) throw new NotFoundException('Match not found');
    if (match.userAId !== userId && match.userBId !== userId) throw new ForbiddenException();

    const isUserA = match.userAId === userId;
    const prompt = await this.prisma.datingPrompt.findUnique({ where: { id: promptId } });
    if (!prompt || prompt.matchId !== matchId) throw new NotFoundException('Prompt not found');

    await this.prisma.datingPrompt.update({
      where: { id: promptId },
      data: isUserA ? { responseA: response } : { responseB: response },
    });

    // Check if both have responded
    const updatedPrompt = await this.prisma.datingPrompt.findUnique({ where: { id: promptId } });
    if (updatedPrompt?.responseA && updatedPrompt?.responseB) {
      await this.prisma.datingMatch.update({
        where: { id: matchId },
        data: {
          promptsCompleted: { increment: 1 },
          lastActivityAt: new Date(),
          stage: DatingStage.TEXT_PHASE,
        },
      });
    }

    return { success: true };
  }

  async approveCheckpoint(userId: string, matchId: string) {
    const match = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match || !match.isActive) throw new NotFoundException('Match not found');

    const isUserA = match.userAId === userId;
    const data: any = isUserA
      ? { checkpointAApproved: true }
      : { checkpointBApproved: true };

    await this.prisma.datingMatch.update({ where: { id: matchId }, data });

    // Check if both approved
    const updated = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (updated?.checkpointAApproved && updated?.checkpointBApproved) {
      await this.prisma.datingMatch.update({
        where: { id: matchId },
        data: {
          stage: DatingStage.VOICE_UNLOCKED,
          lastActivityAt: new Date(),
        },
      });
      return { stage: DatingStage.VOICE_UNLOCKED, message: 'Both approved! Voice/call is now unlocked.' };
    }

    return { stage: DatingStage.CHECKPOINT, message: 'Waiting for your match to approve.' };
  }

  async advanceStage(userId: string, matchId: string, newStage: DatingStage) {
    const match = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match || !match.isActive) throw new NotFoundException('Match not found');
    if (match.userAId !== userId && match.userBId !== userId) throw new ForbiddenException();

    const validTransitions: Record<string, string[]> = {
      [DatingStage.MATCHED]: [DatingStage.TEXT_PHASE],
      [DatingStage.TEXT_PHASE]: [DatingStage.CHECKPOINT],
      [DatingStage.CHECKPOINT]: [DatingStage.VOICE_UNLOCKED],
      [DatingStage.VOICE_UNLOCKED]: [DatingStage.MEET_SUGGESTED],
      [DatingStage.MEET_SUGGESTED]: [DatingStage.POST_DATE],
      [DatingStage.POST_DATE]: [DatingStage.CLOSED],
    };

    if (!validTransitions[match.stage]?.includes(newStage)) {
      throw new BadRequestException(`Cannot transition from ${match.stage} to ${newStage}`);
    }

    return this.prisma.datingMatch.update({
      where: { id: matchId },
      data: { stage: newStage, lastActivityAt: new Date() },
    });
  }

  async closeMatch(userId: string, matchId: string, reason: DatingCloseReason = DatingCloseReason.USER_INITIATED) {
    const match = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match || !match.isActive) throw new NotFoundException('Match not found');

    const cooldownHours = 24; // 24h cooldown before new match
    return this.prisma.datingMatch.update({
      where: { id: matchId },
      data: {
        isActive: false,
        stage: DatingStage.CLOSED,
        closeReason: reason,
        closedBy: userId,
        closedAt: new Date(),
        cooldownUntil: new Date(Date.now() + cooldownHours * 60 * 60 * 1000),
      },
    });
  }

  async submitFeedback(userId: string, matchId: string, data: {
    rating: number;
    safetyRating?: number;
    feedback?: string;
    flags?: string[];
  }) {
    const match = await this.prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const receiverId = match.userAId === userId ? match.userBId : match.userAId;

    const feedback = await this.prisma.datingFeedback.create({
      data: {
        matchId,
        giverId: userId,
        receiverId,
        rating: data.rating,
        safetyRating: data.safetyRating,
        feedback: data.feedback,
        flags: data.flags || [],
      },
    });

    // Low safety rating triggers trust score reduction
    if (data.safetyRating && data.safetyRating <= 2) {
      await this.prisma.userScore.update({
        where: { userId: receiverId },
        data: { trustScore: { decrement: 5 } },
      });
    }

    return feedback;
  }
}
