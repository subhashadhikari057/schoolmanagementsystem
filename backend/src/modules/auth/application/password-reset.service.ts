import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { hashPassword } from '../../../shared/auth/hash.util';
import { UserRole } from '@sms/shared-types';
import { randomBytes } from 'crypto';

export interface RequestPasswordResetDto {
  identifier: string; // email or phone
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  requiresAdminContact?: boolean;
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Request password reset - role-based logic
   */
  async requestPasswordReset(
    data: RequestPasswordResetDto,
    ip: string,
    userAgent: string,
  ): Promise<PasswordResetResponse> {
    // Find user by email or phone
    const isEmail = data.identifier.includes('@');
    const whereClause = isEmail
      ? { email: data.identifier }
      : { phone: data.identifier };

    const user = await this.prisma.user.findUnique({
      where: whereClause,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      // Log failed attempt but don't reveal if user exists
      await this.auditService.record({
        action: 'PASSWORD_RESET_REQUEST',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: {
          identifier: data.identifier,
          reason: 'User not found or inactive',
        },
      });

      // Return generic message for security
      return {
        success: true,
        message: 'If the account exists, you will receive reset instructions.',
      };
    }

    // Get user's primary role
    const primaryRole = user.roles[0]?.role?.name as UserRole;

    // Check if user can reset password based on role
    if (primaryRole === UserRole.STUDENT || primaryRole === UserRole.PARENT) {
      await this.auditService.record({
        action: 'PASSWORD_RESET_REQUEST',
        status: 'BLOCKED',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        userId: user.id,
        details: {
          identifier: data.identifier,
          role: primaryRole,
          reason: 'Role not allowed to reset password',
        },
      });

      return {
        success: false,
        message:
          'Please contact your school administrator to reset your password.',
        requiresAdminContact: true,
      };
    }

    // Generate reset token for admins/teachers
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        ipAddress: ip,
        userAgent,
      },
    });

    // Log successful request
    await this.auditService.record({
      action: 'PASSWORD_RESET_REQUEST',
      status: 'SUCCESS',
      module: 'AUTH',
      ipAddress: ip,
      userAgent,
      userId: user.id,
      details: {
        identifier: data.identifier,
        role: primaryRole,
        tokenExpiresAt: expiresAt,
      },
    });

    // TODO: In production, send email/SMS with reset token
    // For now, return token in response for testing
    return {
      success: true,
      message: `Password reset instructions sent. Your reset code is: ${resetToken}`,
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    data: ResetPasswordDto,
    ip: string,
    userAgent: string,
  ): Promise<PasswordResetResponse> {
    // Find valid reset token
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: data.token,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
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

    if (!resetToken) {
      await this.auditService.record({
        action: 'PASSWORD_RESET',
        status: 'FAIL',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: {
          token: data.token,
          reason: 'Invalid or expired token',
        },
      });

      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = resetToken.user;

    // Hash new password
    const passwordHash = await hashPassword(data.newPassword);

    // Update user password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          lastPasswordChange: new Date(),
          needPasswordChange: false,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
      // Revoke all existing sessions
      this.prisma.userSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'Password reset',
        },
      }),
    ]);

    // Log successful password reset
    await this.auditService.record({
      action: 'PASSWORD_RESET',
      status: 'SUCCESS',
      module: 'AUTH',
      ipAddress: ip,
      userAgent,
      userId: user.id,
      details: {
        tokenId: resetToken.id,
        sessionsRevoked: true,
      },
    });

    return {
      success: true,
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  /**
   * Generate secure reset token (6-digit OTP for demo)
   */
  private generateResetToken(): string {
    // Generate 6-digit OTP for demo purposes
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired tokens (can be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
