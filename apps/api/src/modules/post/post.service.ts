import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginatedResponse } from '@/common/dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, communityId: string, data: {
    title?: string;
    content: string;
    mediaUrls?: string[];
    isAnonymous?: boolean;
  }) {
    // Verify membership
    const member = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (!member) throw new ForbiddenException('Must be a community member to post');

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        communityId,
        ...data,
        mediaUrls: data.mediaUrls || [],
      },
      include: {
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    // Update community post count and user participation score
    await this.prisma.userScore.update({
      where: { userId },
      data: { participationScore: { increment: 2 }, totalXp: { increment: 5 } },
    });

    return post;
  }

  async findByCommunity(communityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { communityId, isDeleted: false },
        include: {
          author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where: { communityId, isDeleted: false } }),
    ]);
    return new PaginatedResponse(posts, total, page, limit);
  }

  async findById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        comments: {
          where: { parentId: null, isDeleted: false },
          include: {
            author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
            children: {
              where: { isDeleted: false },
              include: {
                author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
                _count: { select: { reactions: true } },
              },
              orderBy: { createdAt: 'asc' },
              take: 10,
            },
            _count: { select: { reactions: true, children: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { comments: true, reactions: true } },
      },
    });
    if (!post || post.isDeleted) throw new NotFoundException('Post not found');
    return post;
  }

  async addComment(userId: string, postId: string, content: string, parentId?: string, isAnonymous = false) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    // Verify membership
    const member = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId: post.communityId } },
    });
    if (!member) throw new ForbiddenException('Must be a community member to comment');

    const comment = await this.prisma.comment.create({
      data: { authorId: userId, postId, content, parentId, isAnonymous },
      include: {
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    await this.prisma.userScore.update({
      where: { userId },
      data: { participationScore: { increment: 1 }, supportScore: { increment: 1 }, totalXp: { increment: 2 } },
    });

    return comment;
  }

  async addReaction(userId: string, postId: string, type: string) {
    const existing = await this.prisma.reaction.findFirst({
      where: { userId, postId, type: type as any },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      if (type === 'UPVOTE') {
        await this.prisma.post.update({
          where: { id: postId },
          data: { upvoteCount: { decrement: 1 } },
        });
      }
      return { removed: true };
    }

    await this.prisma.reaction.create({
      data: { userId, postId, type: type as any },
    });

    if (type === 'UPVOTE') {
      await this.prisma.post.update({
        where: { id: postId },
        data: { upvoteCount: { increment: 1 } },
      });
    }

    return { added: true };
  }
}
