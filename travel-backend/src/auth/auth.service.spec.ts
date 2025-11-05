import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.module';
import { RedisService } from '../modules/redis/redis.service';

describe('AuthService - blacklist/logout', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let redis: { blacklistToken: jest.Mock; isTokenBlacklisted: jest.Mock };

  beforeEach(async () => {
    redis = {
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: RedisService, useValue: redis },
        {
          provide: JwtService,
          useFactory: () => new JwtService({ secret: 'testsecret' }),
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  it('logout should add token to blacklist when not expired', async () => {
    const token = jwtService.sign({ sub: 'user-1' }, { expiresIn: 60 });
    await authService.logout(token);

    expect(redis.blacklistToken).toHaveBeenCalledTimes(1);
    const args = redis.blacklistToken.mock.calls[0] as [string, number];
    const [calledToken, ttl] = args;
    expect(calledToken).toBe(token);
    // TTL should be positive and not exceed 60 by much (accounting for execution time)
    expect(typeof ttl).toBe('number');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('logout should throw UnauthorizedException for invalid token', async () => {
    await expect(authService.logout('invalid.token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('isTokenBlacklisted should delegate to RedisService', async () => {
    redis.isTokenBlacklisted.mockResolvedValueOnce(true);
    await expect(authService.isTokenBlacklisted('t')).resolves.toBe(true);
    expect(redis.isTokenBlacklisted).toHaveBeenCalledWith('t');
  });
});
