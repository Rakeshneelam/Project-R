import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { FriendshipStatus, BuddyType } from '@bondbridge/database';
import { PaginatedResponse } from '@/common/dto';
import { NotificationService } from '@/modules/notification/notification.service';

@Injectable()
export class FriendshipService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  /** Matchmaking engine: find compatible users based on multi-factor scoring */
  async discoverFriends(userId: string, buddyType?: BuddyType, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, scores: true },
    });
    if (!user?.profile) throw new NotFoundException('Profile not found');

    // Get blocked users
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const blockedIds = blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);

    // Get existing friends/pending requests
    const existingConnections = await this.prisma.friendRequest.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    const connectedIds = existingConnections.map(c =>
      c.senderId === userId ? c.receiverId : c.senderId,
    );

    const excludeIds = [...new Set([userId, ...blockedIds, ...connectedIds])];

    // Get the requesting user's community memberships for overlap scoring
    const userCommunities = await this.prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const userCommunityIds = new Set(userCommunities.map(c => c.communityId));

    // Fetch candidate users with their community memberships
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        isActive: true,
        isBanned: false,
        settings: { allowFriendRequests: true },
      },
      include: {
        profile: true,
        scores: true,
        communityMembers: { select: { communityId: true } },
      },
      take: 100,
    });

    // Score and rank candidates
    const scored = candidates
      .filter(c => c.profile)
      .map(candidate => {
        let score = 0;

        // Interest overlap (0-30 points)
        const sharedInterests = user.profile!.interests.filter(i =>
          candidate.profile!.interests.includes(i),
        ).length;
        score += Math.min(sharedInterests * 5, 30);

        // Vibe tag overlap (0-20 points)
        const sharedVibes = user.profile!.vibeTags.filter(v =>
          candidate.profile!.vibeTags.includes(v),
        ).length;
        score += Math.min(sharedVibes * 5, 20);

        // Communication style match (0-10 points)
        if (user.profile!.communicationStyle === candidate.profile!.communicationStyle) {
          score += 10;
        }

        // Social type compatibility (0-10 points)
        if (user.profile!.socialType === candidate.profile!.socialType) {
          score += 5;
        } else if (user.profile!.socialType === 'AMBIVERT' || candidate.profile!.socialType === 'AMBIVERT') {
          score += 7; // Ambiverts match well with everyone
        }

        // City match (0-15 points)
        if (user.profile!.city && candidate.profile!.city &&
            user.profile!.city.toLowerCase() === candidate.profile!.city.toLowerCase()) {
          score += 15;
        }

        // Trust score bonus (0-10 points)
        if (candidate.scores && candidate.scores.trustScore >= 70) {
          score += 10;
        } else if (candidate.scores && candidate.scores.trustScore >= 50) {
          score += 5;
        }

        // Community overlap — strongest social signal (0-20 points)
        const candidateCommunityIds = new Set(candidate.communityMembers.map((cm: any) => cm.communityId));
        const sharedCommunities = [...userCommunityIds].filter(id => candidateCommunityIds.has(id)).length;
        score += Math.min(sharedCommunities * 7, 20);

        // FriendIntent overlap (0-5 points)
        const sharedIntents = user.profile!.friendIntents.filter(i =>
          candidate.profile!.friendIntents.includes(i),
        ).length;
        score += Math.min(sharedIntents * 2, 5);

        // Normalize to 0-100
        const maxRaw = 100;
        const normalizedScore = Math.round(Math.min((score / maxRaw) * 100, 100));

        return { user: candidate, matchScore: normalizedScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    const skip = (page - 1) * limit;
    const paginated = scored.slice(skip, skip + limit);

    return new PaginatedResponse(
      paginated.map(s => ({
        matchScore: s.matchScore,
        user: {
          id: s.user.id,
          profile: {
            displayName: s.user.profile!.displayName,
            avatarUrl: s.user.profile!.avatarUrl,
            socialType: s.user.profile!.socialType,
            city: s.user.profile!.city,
            interests: s.user.profile!.interests,
            vibeTags: s.user.profile!.vibeTags,
          },
          level: s.user.scores?.overallLevel,
          trustScore: s.user.scores?.trustScore,
        },
      })),
      scored.length, page, limit,
    );
  }

  async sendFriendRequest(senderId: string, receiverId: string, buddyType: BuddyType = BuddyType.FRIEND, message?: string) {
    if (senderId === receiverId) throw new BadRequestException('Cannot send request to yourself');

    // Check blocks
    const block = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: senderId, blockedId: receiverId }, { blockerId: receiverId, blockedId: senderId }] },
    });
    if (block) throw new NotFoundException('User not found');

    const existing = await this.prisma.friendRequest.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] },
    });
    if (existing) throw new ConflictException('Friend request already exists');

    const result = await this.prisma.friendRequest.create({
      data: { senderId, receiverId, buddyType, message },
      include: {
        sender: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });

    // Push notification to receiver (fire and forget)
    const senderName = result.sender.profile?.displayName ?? 'Someone';
    this.notifications.sendPushNotification(
      receiverId,
      '👋 New Friend Request',
      `${senderName} wants to connect with you on BondBridge!`,
    ).catch(() => {});

    return result;

  }

  async respondToRequest(requestId: string, userId: string, accept: boolean) {
    const request = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== userId) throw new NotFoundException('Request not found');

    return this.prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED,
        respondedAt: new Date(),
      },
    });
  }

  async getFriends(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [friends, total] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where: {
          status: FriendshipStatus.ACCEPTED,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
          sender: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true, socialType: true } } } },
          receiver: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true, socialType: true } } } },
        },
        skip,
        take: limit,
      }),
      this.prisma.friendRequest.count({
        where: { status: FriendshipStatus.ACCEPTED, OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
    ]);

    const enriched = friends.map(f => ({
      id: f.id,
      buddyType: f.buddyType,
      friend: f.senderId === userId ? f.receiver : f.sender,
      since: f.respondedAt,
    }));

    return new PaginatedResponse(enriched, total, page, limit);
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
      include: {
        sender: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
