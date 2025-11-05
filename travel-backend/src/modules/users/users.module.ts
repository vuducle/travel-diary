import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  imports: [AuthModule],
  controllers: [UsersController],
})
export class UsersModule {}
