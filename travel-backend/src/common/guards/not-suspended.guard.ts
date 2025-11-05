import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { Request } from 'express';

@Injectable()
export class NotSuspendedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();
    const userId: string | undefined = req.user?.id;
    if (!userId) return true; // JwtAuthGuard should handle auth; if missing, let it fail there

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { suspendedAt: true, suspendedReason: true },
    });
    if (user?.suspendedAt) {
      throw new ForbiddenException(
        user.suspendedReason || 'Your account is suspended.',
      );
    }
    return true;
  }
}
