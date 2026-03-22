import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with scores, badges, streaks' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Get('me/settings')
  @ApiOperation({ summary: 'Get current user settings' })
  async getSettings(@CurrentUser('id') userId: string) {
    return this.userService.getSettings(userId);
  }

  @Put('me/settings')
  @ApiOperation({ summary: 'Update current user settings' })
  async updateSettings(@CurrentUser('id') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.userService.updateSettings(userId, dto);
  }

  @Get('me/scores')
  @ApiOperation({ summary: 'Get current user scores breakdown' })
  async getMyScores(@CurrentUser('id') userId: string) {
    return this.userService.getScores(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name, nickname, or interests' })
  async searchUsers(
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.searchUsers(query, userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile of another user' })
  async getPublicProfile(
    @Param('id') id: string,
    @CurrentUser('id') viewerId: string,
  ) {
    return this.userService.getPublicProfile(id, viewerId);
  }
}
