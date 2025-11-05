import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  location: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // Define our own safe extractor to avoid any/unknown issues in strict mode
    const bearerExtractor = (req: Request): string | null => {
      const authHeader = req.headers?.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
      }
      return null;
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: bearerExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change_this_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extract token from request header safely
    const authHeader = req.headers?.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Return user payload (will be attached to request.user)
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      avatarUrl: payload.avatarUrl,
      bio: payload.bio,
      location: payload.location,
    };
  }
}
