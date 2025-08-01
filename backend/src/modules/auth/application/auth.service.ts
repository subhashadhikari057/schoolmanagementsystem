import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { LoginDtoType, ForceChangePasswordDtoType } from '../dto/auth.dto';
import { verifyPassword, hashPassword } from '../../../shared/auth/hash.util';
import {
  signAccessToken,
  signRefreshToken,
  signTempToken,
  verifyToken,
  verifyTempToken,
} from '../../../shared/auth/jwt.util';
import { hashToken, verifyTokenHash } from '../../../shared/auth/token.util';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService, // ✅ Injected
  ) {}

  async login(data: LoginDtoType, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { 
        roles: { 
          include: { role: true } 
        } 
      },
    });
  
    // ❌ Block login if user not found, inactive, or soft-deleted
    if (!user || !user.isActive || user.deletedAt) {
      await this.auditService.record({
        action: 'LOGIN_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: {
          email: data.email,
          reason: user ? 'User is inactive or soft-deleted' : 'User not found',
        },
      });
  
      throw new UnauthorizedException('Invalid credentials or account disabled');
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

    // ✅ NEW: Check if password change is required
    if (user.needPasswordChange) {
      // Issue special token that only allows password change
      const tempToken = signTempToken({ userId: user.id, purpose: 'PASSWORD_CHANGE' });
      
      await this.auditService.record({
        action: 'LOGIN_PASSWORD_CHANGE_REQUIRED',
        status: 'SUCCESS',
        module: 'AUTH',
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });

      return {
        message: 'Password change required',
        requirePasswordChange: true,
        tempToken,
        userInfo: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }
      };
    }
  
    const sessionId = randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, sessionId });
    const accessToken = signAccessToken({ userId: user.id, sessionId });
    const tokenHash = await hashToken(refreshToken);
  
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
  

  async refresh(refreshToken: string, ip: string, userAgent: string) {
    const decoded = verifyToken(refreshToken);
    if (!decoded?.userId || !decoded?.sessionId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.revokedAt) {
      throw new ForbiddenException('Session not found or revoked');
    }

    const isValid = await verifyTokenHash(refreshToken, session.tokenHash);
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
    const newTokenHash = await hashToken(newRefreshToken);

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

  async logout(sessionId: string, ip?: string, userAgent?: string) {
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

  // ✅ Force password change method
  async forceChangePassword(
    data: ForceChangePasswordDtoType,
    ip: string,
    userAgent: string,
  ) {
    // Verify temp token
    const decoded = verifyTempToken(data.tempToken);
    if (!decoded || decoded.purpose !== 'PASSWORD_CHANGE') {
      await this.auditService.record({
        action: 'FORCE_PASSWORD_CHANGE_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: { reason: 'Invalid or expired temp token' },
      });

      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.needPasswordChange || !user.isActive || user.deletedAt) {
      await this.auditService.record({
        action: 'FORCE_PASSWORD_CHANGE_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        userId: decoded.userId,
        ipAddress: ip,
        userAgent,
        details: { 
          reason: !user ? 'User not found' : 
                  !user.needPasswordChange ? 'Password change not required' :
                  !user.isActive || user.deletedAt ? 'User inactive or deleted' : 'Unknown'
        },
      });

      throw new BadRequestException('Password change not required or user not found');
    }

    // Validate new password (different from current)
    const isSamePassword = await verifyPassword(data.newPassword, user.passwordHash);
    if (isSamePassword) {
      await this.auditService.record({
        action: 'FORCE_PASSWORD_CHANGE_ATTEMPT',
        status: 'FAIL',
        module: 'AUTH',
        userId: user.id,
        ipAddress: ip,
        userAgent,
        details: { reason: 'New password same as current password' },
      });

      throw new BadRequestException('New password must be different from current password');
    }

    // Update password and clear force flag
    const newPasswordHash = await hashPassword(data.newPassword);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        needPasswordChange: false,           // ✅ Clear the flag
        lastPasswordChange: new Date(),
        updatedAt: new Date(),
      },
    });

    // Revoke all existing sessions (security)
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      action: 'FORCE_PASSWORD_CHANGE',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Password changed successfully. Please login with your new password.',
      success: true,
    };
  }
}
