import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { LoginDtoType } from '../dto/auth.dto';
import { verifyPassword } from '../../../shared/auth/hash.util';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../../../shared/auth/jwt.util';
import { hashToken, verifyTokenHash } from '../../../shared/auth/token.util';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService, // ✅ Injected
  ) {}

  async login(
    data: LoginDtoType,
    ip: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      await this.auditService.record({
        action: 'LOGIN_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: { email: data.email },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await verifyPassword(data.password, user.passwordHash);
    if (!match) {
      await this.auditService.record({
        action: 'LOGIN_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        userId: user.id,
        details: { reason: 'Incorrect password' },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId: string = randomUUID();
    const refreshToken: string = signRefreshToken({
      userId: user.id,
      sessionId,
    });
    const accessToken: string = signAccessToken({ userId: user.id, sessionId });
    const tokenHash: string = await hashToken(refreshToken);

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash,
        userAgent,
        ipAddress: ip,
      },
    });

    await this.auditService.record({
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      details: { sessionId },
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = verifyToken(refreshToken) as any;
    if (!decoded?.userId || !decoded?.sessionId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.revokedAt) {
      throw new ForbiddenException('Session not found or revoked');
    }

    const isValid: boolean = await verifyTokenHash(
      refreshToken,
      session.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token does not match session');
    }

    const newRefreshToken = signRefreshToken({
      userId: decoded.userId,
      sessionId: session.id,
    });
    const newAccessToken = signAccessToken({
      userId: decoded.userId,
      sessionId: session.id,
    });
    const newTokenHash: string = await hashToken(newRefreshToken);

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        tokenHash: newTokenHash,
        ipAddress: ip,
        userAgent,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(
    sessionId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) {
      throw new BadRequestException('Session not found or already revoked');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      action: 'LOGOUT',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: session.userId, // Already present in session
      ipAddress: ip,
      userAgent,
      details: { sessionId },
    });
  }
}
