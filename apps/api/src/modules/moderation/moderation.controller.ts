import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ModerationService } from './moderation.service';
import { CurrentUser, Roles } from '@/common/decorators';
import { RolesGuard } from '@/common/guards';
import { UserRole, ReportTargetType } from '@bondbridge/shared';
import { ReportReason, ReportStatus } from '@bondbridge/database';

@ApiTags('moderation')
@Controller('moderation')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a user, post, or message' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() data: {
      targetType: ReportTargetType;
      targetId: string;
      targetUserId?: string;
      reason: ReportReason;
      description?: string;
    },
  ) { return this.moderationService.createReport(userId, data as any); }

  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List reports (admin/mod only)' })
  async getReports(@Query('status') status?: ReportStatus, @Query('page') page?: number) {
    return this.moderationService.getReports(status as any, page);
  }

  @Post('reports/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Resolve a report with optional moderation action' })
  async resolveReport(
    @CurrentUser('id') moderatorId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) { return this.moderationService.resolveReport(id, moderatorId, data); }

  @Post('block/:userId')
  @ApiOperation({ summary: 'Block a user' })
  async block(@CurrentUser('id') userId: string, @Param('userId') blockedId: string) {
    return this.moderationService.blockUser(userId, blockedId);
  }

  @Post('unblock/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblock(@CurrentUser('id') userId: string, @Param('userId') blockedId: string) {
    return this.moderationService.unblockUser(userId, blockedId);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlocked(@CurrentUser('id') userId: string) {
    return this.moderationService.getBlockedUsers(userId);
  }
}
