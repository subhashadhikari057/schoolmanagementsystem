import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '../auth/jwt.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class IsAuthenticated implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId || !decoded?.sessionId) {
      throw new UnauthorizedException('Invalid token');
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      !session.user ||
      !session.user.isActive ||
      session.user.deletedAt
    ) {
      throw new UnauthorizedException('Session invalid or user revoked');
    }

    // ✅ Transform roles to match structure expected by guards
    const transformedRoles = session.user.roles.map((r) => ({
      id: r.id,
      role: { name: r.role.name },
    }));

    // ✅ Attach to request
    req.user = {
      ...session.user,
      roles: transformedRoles,
    };

    req.session = session;

    return true;
  }
}
