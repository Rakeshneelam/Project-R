import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '@/common/decorators';
import { RolesGuard } from '@/common/guards';
import { UserRole } from '@bondbridge/shared';
import { PrismaService } from '@/common/prisma/prisma.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('firebase-jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  async getDashboard() {
    const [
      totalUsers, activeUsers, bannedUsers,
      totalCommunities, totalPosts, totalChallenges,
      pendingReports, totalMatches,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true, isBanned: false } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.community.count(),
      this.prisma.post.count(),
      this.prisma.challenge.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.datingMatch.count(),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, banned: bannedUsers },
      content: { communities: totalCommunities, posts: totalPosts, challenges: totalChallenges },
      moderation: { pendingReports },
      dating: { totalMatches },
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with admin details' })
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true, email: true, phone: true, role: true, isActive: true, isBanned: true,
        createdAt: true, lastLoginAt: true,
        profile: { select: { displayName: true } },
        scores: { select: { trustScore: true, overallLevel: true } },
        verification: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get all pending reports for admin review' })
  async getReports() {
    return this.prisma.report.findMany({
      where: { status: { in: ['PENDING', 'REVIEWING'] } },
      include: {
        reporter: { select: { id: true, profile: { select: { displayName: true } } } },
        targetUser: { select: { id: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}
