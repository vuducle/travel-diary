import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: '/notifications', cors: true })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Notifications gateway initialized');
  }

  handleConnection(client: Socket) {
    // Clients should emit a 'register' event after connect to join their private room
    // Prefer secure register with JWT. Payloads supported:
    // - { token: string } -> verify and join room for token.sub
    // - { userId: string } -> join room directly (legacy/unsafe; keep for dev convenience)
    client.on('register', (payload: { token?: string; userId?: string }) => {
      if (payload?.token) {
        try {
          const decoded = this.jwtService.verify<{ sub?: string }>(
            payload.token,
            {
              secret: process.env.JWT_SECRET ?? 'change_this_secret',
            },
          );
          if (decoded?.sub) {
            void client.join(this.userRoom(decoded.sub));
            this.logger.debug(
              `Client joined room via JWT: ${this.userRoom(decoded.sub)}`,
            );
            return;
          }
          this.logger.warn('JWT provided but missing sub');
        } catch (err) {
          this.logger.warn(`Invalid JWT on register: ${String(err)}`);
        }
      }

      // Fallback: allow explicit userId (useful for local dev / quick tests)
      if (payload?.userId) {
        void client.join(this.userRoom(payload.userId));
        this.logger.debug(
          `Client joined room (fallback): ${this.userRoom(payload.userId)}`,
        );
      }
    });
  }

  handleDisconnect() {
    // No-op; Socket.IO handles room cleanup
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(this.userRoom(userId)).emit(event, data);
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
