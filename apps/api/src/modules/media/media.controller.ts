import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';
import { CurrentUser } from '@/common/decorators';

@ApiTags('media')
@Controller('media')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL' })
  async getUploadUrl(
    @CurrentUser('id') userId: string,
    @Query('purpose') purpose: string,
    @Query('mimeType') mimeType: string,
  ) { return this.mediaService.getUploadUrl(userId, purpose, mimeType); }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed upload' })
  async recordUpload(
    @CurrentUser('id') userId: string,
    @Body() data: { url: string; key: string; mimeType: string; sizeBytes: number; purpose: string },
  ) { return this.mediaService.recordUpload(userId, data.url, data.key, data.mimeType, data.sizeBytes, data.purpose); }
}
