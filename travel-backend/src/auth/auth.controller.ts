import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Headers,
  UnauthorizedException,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response, Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body(new ValidationPipe()) registerDto: RegisterDto,
  ): Promise<any> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token + refresh cookie' })
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    // Set refresh token as HttpOnly cookie (14 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      path: '/auth', // Only send cookie to /auth routes
    });

    return { accessToken, user };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    // Set new refresh token cookie (rotation)
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @Headers('authorization') authorization: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Revoke refresh token if present
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { path: '/auth' });

    // Optional: still blacklist access token for immediate invalidation
    if (authorization) {
      const token = authorization.replace('Bearer ', '');
      return this.authService.logout(token);
    }

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Logout from all devices (revoke all refresh tokens)',
  })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Get user ID from JWT (attached by JwtAuthGuard)
    // The JwtAuthGuard attaches user payload to request
    const user = (req as { user?: { sub: string } }).user;
    const userId = user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    // Revoke all refresh tokens for this user
    await this.authService.revokeAllRefreshTokens(userId);

    // Clear cookie
    res.clearCookie('refreshToken', { path: '/auth' });

    return { message: 'Logged out from all devices successfully' };
  }
}
