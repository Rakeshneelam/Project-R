import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { CurrentUser } from '@/common/decorators';
import { LeaderboardPeriod, LeaderboardCategory } from '@bondbridge/database';

@ApiTags('leaderboards')
@Controller('leaderboards')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard by period, category, and optional community' })
  async getLeaderboard(
    @Query('period') period: LeaderboardPeriod,
    @Query('category') category: LeaderboardCategory,
    @Query('communityId') communityId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaderboardService.getLeaderboard(period, category, communityId, page, limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user leaderboard summary across all categories' })
  async getMyRanks(@CurrentUser('id') userId: string) {
    return this.leaderboardService.getUserLeaderboardSummary(userId);
  }

  @Get('rank/:userId')
  @ApiOperation({ summary: 'Get a specific user rank in a category' })
  async getUserRank(
    @Param('userId') userId: string,
    @Query('period') period: LeaderboardPeriod,
    @Query('category') category: LeaderboardCategory,
    @Query('communityId') communityId?: string,
  ) {
    return this.leaderboardService.getUserRank(userId, period, category, communityId);
  }
}
