import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { hashPassword, verifyPassword } from '../../../shared/auth/hash.util';
import { signTempToken, verifyTempToken } from '../../../shared/auth/jwt.util';
import { AuditService } from '../../../shared/logger/audit.service';

@Injectable()
export class OtpService {
  private readonly recentRequests = new Map<string, number>();
  private readonly requestCooldown = 2000; // 2 seconds cooldown between requests

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate and send OTP for password reset
   * Only allows non-student/non-parent users to reset password
   */
  async requestOtp(
    identifier: string,
    deliveryMethod: 'email' | 'sms',
    ip: string,
    userAgent: string,
  ): Promise<{ message: string; success: boolean }> {
    // Find user by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        student: true,
        parent: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists for security
      await this.auditService.record({
        action: 'PASSWORD_RESET_REQUEST',
        status: 'FAIL',
        module: 'AUTH',
        userId: undefined,
        ipAddress: ip,
        userAgent,
        details: { identifier, reason: 'User not found' },
      });

      return {
        message: 'If an account exists, an OTP will be sent.',
        success: true,
      };
    }

    // Check if user is student or parent
    const userRoles = user.roles.map(ur => ur.role.name.toLowerCase());
    const isStudentOrParent =
      user.student ||
      user.parent ||
      userRoles.includes('student') ||
      userRoles.includes('parent');

    if (isStudentOrParent) {
      await this.auditService.record({
        action: 'PASSWORD_RESET_REQUEST',
        status: 'FAIL',
        module: 'AUTH',
        userId: user.id,
        ipAddress: ip,
        userAgent,
        details: { identifier, reason: 'Student/Parent not allowed' },
      });

      throw new BadRequestException(
        'Students and parents must contact the administrator to reset their password.',
      );
    }

    // Generate 6-digit OTP (Argon2 will handle salting internally)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);

    // Set expiry to 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing OTPs for this user (including by identifier to handle edge cases)
    await this.prisma.passwordResetOtp.deleteMany({
      where: {
        OR: [{ userId: user.id }, { identifier }],
      },
    });

    // Create new OTP record
    await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        identifier,
        deliveryMethod,
        expiresAt,
      },
    });

    // Log the OTP for development (since no SMTP/SMS configured)
    console.log('🔐 PASSWORD RESET OTP GENERATED:');
    console.log('═'.repeat(50));
    console.log(`📧 User: ${user.fullName} (${identifier})`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
    console.log(`📱 Method: ${deliveryMethod}`);
    console.log('═'.repeat(50));

    await this.auditService.record({
      action: 'PASSWORD_RESET_OTP_GENERATED',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      details: { identifier, deliveryMethod },
    });

    return {
      message: `OTP sent to your ${deliveryMethod === 'email' ? 'email' : 'phone'}. Check the console for development.`,
      success: true,
    };
  }

  /**
   * Verify OTP and return reset token
   */
  async verifyOtp(
    identifier: string,
    otp: string,
    ip: string,
    userAgent: string,
  ): Promise<{ resetToken: string; message: string; success: boolean }> {
    // Prevent rapid duplicate requests
    const requestKey = `${identifier}:${otp}:${ip}`;
    const now = Date.now();
    const lastRequest = this.recentRequests.get(requestKey);

    if (lastRequest && now - lastRequest < this.requestCooldown) {
      console.log('🚫 Duplicate request blocked:', requestKey);
      throw new BadRequestException('Please wait before trying again');
    }

    this.recentRequests.set(requestKey, now);

    // Clean up old requests (older than 5 minutes)
    for (const [key, timestamp] of this.recentRequests.entries()) {
      if (now - timestamp > 300000) {
        // 5 minutes
        this.recentRequests.delete(key);
      }
    }

    console.log('🔍 OTP Verification Debug:');
    console.log('📧 Identifier:', identifier);
    console.log('🔢 OTP received:', otp);
    console.log('⏰ Current time:', new Date());

    // Clean up expired OTPs first
    await this.prisma.passwordResetOtp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Find the most recent valid OTP for this identifier
    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        identifier,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent OTP
      },
    });

    console.log('📋 OTP Record found:', otpRecord ? 'Yes' : 'No');
    if (otpRecord) {
      console.log('📊 OTP Record details:', {
        id: otpRecord.id,
        attempts: otpRecord.attempts,
        maxAttempts: otpRecord.maxAttempts,
        isUsed: otpRecord.isUsed,
        expiresAt: otpRecord.expiresAt,
        createdAt: otpRecord.createdAt,
      });
    }

    if (!otpRecord) {
      await this.auditService.record({
        action: 'PASSWORD_RESET_OTP_VERIFY',
        status: 'FAIL',
        module: 'AUTH',
        userId: undefined,
        ipAddress: ip,
        userAgent,
        details: { identifier, reason: 'OTP not found or expired' },
      });

      throw new BadRequestException(
        'Invalid or expired OTP. Please request a new OTP if needed.',
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await this.auditService.record({
        action: 'PASSWORD_RESET_OTP_VERIFY',
        status: 'FAIL',
        module: 'AUTH',
        userId: otpRecord.userId,
        ipAddress: ip,
        userAgent,
        details: { identifier, reason: 'Max attempts exceeded' },
      });

      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP (Argon2 handles salt verification internally)
    console.log(
      '🔍 Verifying OTP:',
      otp,
      'against hash for user:',
      otpRecord.userId,
    );
    const isOtpValid = await verifyPassword(otp, otpRecord.otpHash);
    console.log('✅ OTP verification result:', isOtpValid);

    if (!isOtpValid) {
      // Increment attempts ONLY on failed verification
      const newAttempts = otpRecord.attempts + 1;
      await this.prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts },
      });

      await this.auditService.record({
        action: 'PASSWORD_RESET_OTP_VERIFY',
        status: 'FAIL',
        module: 'AUTH',
        userId: otpRecord.userId,
        ipAddress: ip,
        userAgent,
        details: { identifier, reason: 'Invalid OTP', attempts: newAttempts },
      });

      const remainingAttempts = otpRecord.maxAttempts - newAttempts;
      throw new BadRequestException(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.',
      );
    }

    // Mark OTP as used
    await this.prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Generate reset token (valid for 15 minutes)
    const resetToken = signTempToken(
      { userId: otpRecord.userId, purpose: 'password_reset' },
      { expiresIn: '15m' },
    );

    await this.auditService.record({
      action: 'PASSWORD_RESET_OTP_VERIFIED',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: otpRecord.userId,
      ipAddress: ip,
      userAgent,
      details: { identifier },
    });

    return {
      resetToken,
      message: 'OTP verified successfully. You can now reset your password.',
      success: true,
    };
  }

  /**
   * Reset password using verified token
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
    ip: string,
    userAgent: string,
  ): Promise<{ message: string; success: boolean }> {
    const decoded = verifyTempToken(resetToken);

    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      await this.auditService.record({
        action: 'PASSWORD_RESET',
        status: 'FAIL',
        module: 'AUTH',
        userId: user.id,
        ipAddress: ip,
        userAgent,
        details: { reason: 'New password same as current password' },
      });

      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
        needPasswordChange: false,
        updatedAt: new Date(),
      },
    });

    // Revoke all existing sessions for security
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Clean up any remaining OTP records for this user
    await this.prisma.passwordResetOtp.deleteMany({
      where: { userId: user.id },
    });

    await this.auditService.record({
      action: 'PASSWORD_RESET',
      status: 'SUCCESS',
      module: 'AUTH',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      details: { method: 'OTP' },
    });

    return {
      message:
        'Password reset successfully. You can now login with your new password.',
      success: true,
    };
  }

  /**
   * Clean up expired OTPs (can be called periodically)
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.prisma.passwordResetOtp.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
      },
    });
  }
}
