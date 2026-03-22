import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DatingService } from './dating.service';
import { CurrentUser } from '@/common/decorators';
import { DatingStage, DatingCloseReason } from '@bondbridge/database';

@ApiTags('dating')
@Controller('dating')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class DatingController {
  constructor(private readonly datingService: DatingService) {}

  @Post('find-match')
  @ApiOperation({ summary: 'Request a new dating match (auto-match, no swiping)' })
  async findMatch(@CurrentUser('id') userId: string) {
    return this.datingService.findMatch(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active dating match' })
  async getActive(@CurrentUser('id') userId: string) {
    return this.datingService.getActiveMatch(userId);
  }

  @Post(':matchId/prompt/:promptId/respond')
  @ApiOperation({ summary: 'Respond to a dating prompt' })
  async respondToPrompt(
    @CurrentUser('id') userId: string,
    @Param('matchId') matchId: string,
    @Param('promptId') promptId: string,
    @Body('response') response: string,
  ) { return this.datingService.respondToPrompt(userId, matchId, promptId, response); }

  @Post(':matchId/checkpoint')
  @ApiOperation({ summary: 'Approve the mutual checkpoint (both must approve to advance)' })
  async approveCheckpoint(@CurrentUser('id') userId: string, @Param('matchId') matchId: string) {
    return this.datingService.approveCheckpoint(userId, matchId);
  }

  @Post(':matchId/advance')
  @ApiOperation({ summary: 'Advance to the next dating stage' })
  async advance(
    @CurrentUser('id') userId: string,
    @Param('matchId') matchId: string,
    @Body('stage') stage: DatingStage,
  ) { return this.datingService.advanceStage(userId, matchId, stage); }

  @Post(':matchId/close')
  @ApiOperation({ summary: 'Close/end a dating match respectfully' })
  async close(
    @CurrentUser('id') userId: string,
    @Param('matchId') matchId: string,
    @Body('reason') reason?: DatingCloseReason,
  ) { return this.datingService.closeMatch(userId, matchId, reason); }

  @Post(':matchId/feedback')
  @ApiOperation({ summary: 'Submit private post-date feedback' })
  async feedback(
    @CurrentUser('id') userId: string,
    @Param('matchId') matchId: string,
    @Body() data: { rating: number; safetyRating?: number; feedback?: string; flags?: string[] },
  ) { return this.datingService.submitFeedback(userId, matchId, data); }
}
