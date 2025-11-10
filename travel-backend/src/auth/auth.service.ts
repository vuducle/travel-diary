import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.module';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '../modules/redis/redis.service';
import { randomBytes, createHash } from 'crypto';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  bio?: string | null;
  location?: string | null;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
}

interface RegisterResponse {
  message: string;
  user: UserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, username, password, name, bio, location } = registerDto;

    // Check if user already exists

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    // Create user

    const user: UserResponse = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        bio,
        location,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  /**
   * Validate user credentials. Returns the user without password on success.
   */
  private async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponse | null> {
    // include password for comparison

    const userWithPassword = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userWithPassword) return null;

    const match = await bcrypt.compare(password, userWithPassword.password);
    if (!match) return null;

    // strip password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = userWithPassword;
    return safeUser as UserResponse;
  }

  /**
   * Login user and return JWT access token along with the user info.
   * Also generates a refresh token for session continuation.
   */
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
  }> {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
    };
    const accessToken = this.jwtService.sign(payload);

    // Generate a long-lived refresh token (opaque random token)
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }

  /**
   * Generate a new refresh token for a user.
   * Returns opaque token (raw value) to be sent as HttpOnly cookie.
   * Stores only SHA256 hash in database for security.
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    // Generate 64-byte random token
    const rawToken = randomBytes(64).toString('hex');

    // Hash it with SHA256 before storing (faster than bcrypt for lookup)
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Set expiry to 14 days from now
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Refresh access token using refresh token.
   * Implements rotation: invalidates old refresh token and issues new one.
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Hash the incoming token
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Find the token record with user
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if token has been revoked
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Revoke the current token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new access token
    const payload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      name: tokenRecord.user.name,
      avatarUrl: tokenRecord.user.avatarUrl,
      bio: tokenRecord.user.bio,
      location: tokenRecord.user.location,
    };
    const accessToken = this.jwtService.sign(payload);

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      tokenRecord.user.id,
    );

    // Optionally link the replacement for audit trail
    const newTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    
    const newTokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId: tokenRecord.user.id,
        tokenHash: newTokenHash,
      },
    });

    if (newTokenRecord) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          replacedById: newTokenRecord.id,
        },
      });
    }

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke a specific refresh token (for logout).
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (tokenRecord && !tokenRecord.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices).
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Logout user by adding token to blacklist (Redis)
   */
  async logout(token: string): Promise<{ message: string }> {
    // Decode token to get expiration time
    const decodedUnknown: unknown = this.jwtService.decode(token);

    // Type guard for payloads that include an exp field (in seconds since epoch)
    const hasExp = (val: unknown): val is { exp: number } => {
      if (typeof val !== 'object' || val === null) return false;
      const rec = val as Record<string, unknown>;
      return typeof rec.exp === 'number';
    };

    if (!hasExp(decodedUnknown)) {
      throw new UnauthorizedException('Invalid token');
    }

    // Calculate how many seconds until token expires
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = decodedUnknown.exp - now;

    // Only add to blacklist if token hasn't expired yet
    if (expiresInSeconds > 0) {
      await this.redisService.blacklistToken(token, expiresInSeconds);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Check if token is blacklisted (Redis)
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.redisService.isTokenBlacklisted(token);
  }
}
