import { Controller, Post, Get, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import { CurrentUser } from '@/common/decorators';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('initiate')
  @UseGuards(AuthGuard('firebase-jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate identity verification' })
  async initiate(@CurrentUser('id') userId: string) {
    return this.verificationService.initiateVerification(userId);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle verification provider callback' })
  async callback(
    @Query('session') sessionId: string,
    @Body() callbackData: Record<string, any>,
  ) {
    return this.verificationService.handleCallback(sessionId, callbackData || {});
  }

  @Get('mock-callback')
  @ApiOperation({ summary: 'Mock verification callback for development' })
  async mockCallback(@Query('session') sessionId: string) {
    return this.verificationService.handleCallback(sessionId, { name: 'Test User', age: 25 });
  }

  @Get('status')
  @UseGuards(AuthGuard('firebase-jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current verification status' })
  async getStatus(@CurrentUser('id') userId: string) {
    return this.verificationService.getVerificationStatus(userId);
  }
}
