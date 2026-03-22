import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('AppGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove from user map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    this.userSockets.set(data.userId, client.id);
    client.join(`user:${data.userId}`);
    this.logger.log(`User ${data.userId} authenticated on socket ${client.id}`);
    return { event: 'authenticated', data: { success: true } };
  }

  @SubscribeMessage('join_community')
  handleJoinCommunity(@ConnectedSocket() client: Socket, @MessageBody() data: { communityId: string }) {
    client.join(`community:${data.communityId}`);
    return { event: 'joined_community', data: { communityId: data.communityId } };
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`);
    return { event: 'joined_conversation', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; userId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', { userId: data.userId });
  }

  // ─── Server-side event emitters ─────────────────────

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToCommunity(communityId: string, event: string, data: any) {
    this.server.to(`community:${communityId}`).emit(event, data);
  }

  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
