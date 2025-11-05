import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: false,
      secret: process.env.JWT_SECRET ?? 'change_this_secret',
      // Resolve expiresIn from env; accept numeric seconds or ms-style strings like '1h'
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
