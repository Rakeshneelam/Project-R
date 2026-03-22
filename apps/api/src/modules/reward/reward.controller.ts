import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RewardService } from './reward.service';
import { CurrentUser } from '@/common/decorators';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get('badges')
  @ApiOperation({ summary: 'List all available badges' })
  async getBadges() { return this.rewardService.getAllBadges(); }

  @Get('badges/me')
  @ApiOperation({ summary: 'Get my earned badges' })
  async getMyBadges(@CurrentUser('id') userId: string) { return this.rewardService.getUserBadges(userId); }

  @Get()
  @ApiOperation({ summary: 'List available rewards' })
  async getRewards(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.rewardService.getAvailableRewards(page, limit);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim a reward' })
  async claimReward(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.rewardService.claimReward(userId, id);
  }
}
