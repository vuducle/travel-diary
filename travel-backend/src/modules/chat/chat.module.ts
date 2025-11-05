import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change_this_secret',
      signOptions: {
        expiresIn: (() => {
          const raw = process.env.JWT_EXPIRES_IN;
          if (!raw) return 3600;
          const asNum = Number(raw);
          if (Number.isFinite(asNum)) return asNum;
          return raw as unknown as `${number}${'s' | 'm' | 'h' | 'd'}`;
        })(),
      },
    }),
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
