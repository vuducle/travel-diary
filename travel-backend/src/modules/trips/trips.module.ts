import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PrismaModule } from '../../database/prisma.module';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { UsersTripsController } from './users-trips.controller';
import { TripsResolver } from '../../graphql/trips.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    TripsController,
    UsersTripsController,
    LikesController,
    CommentsController,
  ],
  providers: [TripsService, LikesService, CommentsService, TripsResolver],
  exports: [TripsService, LikesService, CommentsService],
})
export class TripsModule {}
