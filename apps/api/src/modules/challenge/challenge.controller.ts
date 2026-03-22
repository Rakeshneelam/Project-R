import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChallengeService } from './challenge.service';
import { CurrentUser } from '@/common/decorators';
import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeType, SubmissionType } from '@bondbridge/database';

class CreateChallengeDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ enum: ChallengeType }) @IsEnum(ChallengeType) type: ChallengeType;
  @ApiPropertyOptional() @IsOptional() @IsString() communityId?: string;
  @ApiProperty({ enum: SubmissionType, isArray: true }) @IsArray() submissionTypes: SubmissionType[];
  @ApiProperty() @IsDateString() startsAt: Date;
  @ApiProperty() @IsDateString() endsAt: Date;
  @ApiPropertyOptional() @IsOptional() @IsDateString() lateEntryUntil?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() rules?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rewardDescription?: string;
}

class SubmitChallengeDto {
  @ApiProperty({ enum: SubmissionType }) @IsEnum(SubmissionType) type: SubmissionType;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() mediaUrls?: string[];
}

@ApiTags('challenges')
@Controller('challenges')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a challenge' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateChallengeDto) {
    return this.challengeService.create(userId, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active challenges' })
  async getActive(
    @Query('type') type?: ChallengeType,
    @Query('communityId') communityId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.challengeService.getActive(type, communityId, page, limit);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s platform-wide daily challenge' })
  async getToday() {
    return this.challengeService.getTodaysPlatformChallenge();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details with submissions' })
  async getById(@Param('id') id: string) {
    return this.challengeService.getById(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an entry to a challenge' })
  async submit(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SubmitChallengeDto) {
    return this.challengeService.submit(userId, id, dto);
  }

  @Post('submissions/:submissionId/vote')
  @ApiOperation({ summary: 'Vote on a challenge submission' })
  async vote(
    @CurrentUser('id') userId: string,
    @Param('submissionId') submissionId: string,
    @Body('type') type: string,
  ) {
    return this.challengeService.voteOnSubmission(userId, submissionId, type);
  }
}
