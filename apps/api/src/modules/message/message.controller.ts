import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from './message.service';
import { CurrentUser } from '@/common/decorators';

@ApiTags('messages')
@Controller('messages')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  async getConversations(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.messageService.getConversations(userId, page);
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Create or get a direct conversation' })
  async createDirect(@CurrentUser('id') userId: string, @Body('userId') otherUserId: string) {
    return this.messageService.createOrGetDirectConversation(userId, otherUserId);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('page') page?: number,
  ) { return this.messageService.getMessages(userId, conversationId, page); }

  @Post('conversations/:conversationId')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Body('content') content: string,
    @Body('mediaUrls') mediaUrls?: string[],
  ) { return this.messageService.sendMessage(userId, conversationId, content, mediaUrls); }
}
