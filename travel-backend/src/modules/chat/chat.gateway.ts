import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const authToken: unknown = client.handshake.auth?.token;
      const headerAuth = client.handshake.headers?.authorization;
      let rawToken: string | undefined;
      if (typeof authToken === 'string' && authToken) {
        rawToken = authToken;
      } else if (
        Array.isArray(authToken) &&
        authToken.length > 0 &&
        typeof authToken[0] === 'string'
      ) {
        rawToken = authToken[0];
      } else if (typeof headerAuth === 'string' && headerAuth) {
        rawToken = headerAuth;
      } else if (
        Array.isArray(headerAuth) &&
        headerAuth.length > 0 &&
        typeof headerAuth[0] === 'string'
      ) {
        rawToken = headerAuth[0];
      }

      if (!rawToken) {
        client.disconnect();
        return;
      }

      // Normalize token value (support 'Bearer <token>' or raw token)
      const cleanedToken = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7).trim()
        : rawToken.trim();

      // Verify JWT token
      interface CommonJwtPayload {
        sub?: string;
        id?: string;
        userId?: string;
        email?: string;
        role?: string;
        name?: string;
        avatarUrl?: string;
        bio?: string;
        location?: string;
      }
      const payload = this.jwtService.verify<CommonJwtPayload>(cleanedToken);
      const userId: string | undefined =
        payload.id ?? payload.sub ?? payload.userId;

      if (!userId) {
        console.error(
          'Connection error: JWT payload missing user identifier (id/sub)',
        );
        client.disconnect();
        return;
      }

      client.userId = userId;

      // Store connected user
      this.connectedUsers.set(userId, client.id);

      console.log(`User ${userId} connected to chat`);

      // Emit user online status
      this.server.emit('user:online', { userId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Connection error:', message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected from chat`);

      // Emit user offline status
      this.server.emit('user:offline', { userId: client.userId });
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      // Runtime validation for WebSocket payload (DTO validation may not run in WS by default)
      if (!data || typeof data !== 'object') {
        return { error: 'Invalid payload' };
      }
      const receiverId: string = data.receiverId;
      let content: string = data.content;

      if (!receiverId || typeof receiverId !== 'string') {
        return { error: 'receiverId is required' };
      }

      if (typeof content !== 'string') {
        content = String(content ?? '');
      }
      content = content.trim();
      if (!content) {
        return { error: 'content is required' };
      }

      // Save message to database
      const message = await this.chatService.sendMessage(
        client.userId,
        receiverId,
        content,
      );

      // Send message to receiver if online
      const receiverSocketId = this.connectedUsers.get(receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message:receive', message);
      }

      // Send confirmation to sender
      return { success: true, message };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      return { error: message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      if (!data?.messageId || typeof data.messageId !== 'string') {
        return { error: 'messageId is required' };
      }

      // Mark once
      await this.chatService.markAsRead(data.messageId, client.userId);

      return { success: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to mark as read';
      return { error: message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:start', {
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:stop', {
        userId: client.userId,
      });
    }
  }
}
