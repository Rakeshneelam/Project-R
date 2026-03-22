import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CommunityType, CommunityRole } from '@bondbridge/database';
import { PaginatedResponse } from '@/common/dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    name: string;
    slug: string;
    description?: string;
    type?: CommunityType;
    isLocal?: boolean;
    city?: string;
    rules?: string;
  }) {
    const existing = await this.prisma.community.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Community slug already taken');

    return this.prisma.community.create({
      data: {
        ...data,
        type: data.type || CommunityType.PUBLIC,
        ownerId: userId,
        members: {
          create: { userId, role: CommunityRole.OWNER },
        },
        memberCount: 1,
      },
      include: { members: { take: 5, include: { user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } } } } },
    });
  }

  async findAll(filters: {
    type?: CommunityType;
    isLocal?: boolean;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, isLocal, city, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (isLocal !== undefined) where.isLocal = isLocal;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        include: {
          owner: { select: { id: true, profile: { select: { displayName: true } } } },
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { memberCount: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    return new PaginatedResponse(communities, total, page, limit);
  }

  async findById(communityId: string, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        _count: { select: { members: true, posts: true, challenges: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');

    let membership = null;
    if (userId) {
      membership = await this.prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });
    }

    return { ...community, membership };
  }

  async join(userId: string, communityId: string, isAnonymous = false) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');
    if (community.type === CommunityType.INVITE_ONLY) {
      throw new ForbiddenException('This community is invite-only');
    }

    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (existing) throw new ConflictException('Already a member');

    const [member] = await this.prisma.$transaction([
      this.prisma.communityMember.create({
        data: { userId, communityId, isAnonymous },
      }),
      this.prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return member;
  }

  async leave(userId: string, communityId: string) {
    const member = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (!member) throw new NotFoundException('Not a member');
    if (member.role === CommunityRole.OWNER) {
      throw new ForbiddenException('Owner cannot leave. Transfer ownership first.');
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.delete({
        where: { userId_communityId: { userId, communityId } },
      }),
      this.prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
  }

  async getMembers(communityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true, socialType: true } },
              scores: { select: { overallLevel: true, trustScore: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.communityMember.count({ where: { communityId } }),
    ]);
    return new PaginatedResponse(members, total, page, limit);
  }

  async updateMemberRole(communityId: string, targetUserId: string, role: CommunityRole, actorId: string) {
    const actor = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: actorId, communityId } },
    });
    if (!actor || (actor.role !== CommunityRole.OWNER && actor.role !== CommunityRole.ADMIN)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.communityMember.update({
      where: { userId_communityId: { userId: targetUserId, communityId } },
      data: { role },
    });
  }
}
