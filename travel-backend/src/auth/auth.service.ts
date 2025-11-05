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
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: UserResponse }> {
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

    return { accessToken, user };
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
