import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@/common/decorators';

class RegisterPushTokenDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications with unread count' })
  async getNotifications(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.notificationService.getNotifications(userId, page);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register device push token' })
  @ApiBody({ type: RegisterPushTokenDto })
  async registerPushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    await this.notificationService.registerPushToken(userId, dto.token, dto.platform);
    return { success: true };
  }
}
