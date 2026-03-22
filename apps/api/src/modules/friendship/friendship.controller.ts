import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FriendshipService } from './friendship.service';
import { CurrentUser } from '@/common/decorators';
import { BuddyType } from '@bondbridge/database';

@ApiTags('friendship')
@Controller('friendship')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Get('discover')
  @ApiOperation({ summary: 'Discover friend matches' })
  async discover(
    @CurrentUser('id') userId: string,
    @Query('buddyType') buddyType?: BuddyType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.friendshipService.discoverFriends(userId, buddyType, page, limit); }

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  async sendRequest(
    @CurrentUser('id') userId: string,
    @Body('receiverId') receiverId: string,
    @Body('buddyType') buddyType?: BuddyType,
    @Body('message') message?: string,
  ) { return this.friendshipService.sendFriendRequest(userId, receiverId, buddyType, message); }

  @Post('request/:id/respond')
  @ApiOperation({ summary: 'Accept or decline a friend request' })
  async respond(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
    @Body('accept') accept: boolean,
  ) { return this.friendshipService.respondToRequest(requestId, userId, accept); }

  @Get('friends')
  @ApiOperation({ summary: 'List friends' })
  async getFriends(@CurrentUser('id') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.friendshipService.getFriends(userId, page, limit);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending friend requests' })
  async getPending(@CurrentUser('id') userId: string) {
    return this.friendshipService.getPendingRequests(userId);
  }
}
