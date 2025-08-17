import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserRole } from '@sms/shared-types';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  // Role-specific data
  teacherData?: {
    employeeId: string;
    designation: string;
    department: string;
    joiningDate: Date;
    qualification: string;
    experienceYears: number;
    basicSalary: number;
    profile?: any;
  };
  studentData?: {
    studentId: string;
    rollNumber: string;
    classId: string;
    admissionDate: Date;
    academicStatus: string;
    profile?: any;
  };
  parentData?: {
    occupation: string;
    workPlace: string;
    profile?: any;
  };
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  // Role-specific fields
  teacherData?: {
    designation?: string;
    qualification?: string;
    address?: string;
  };
  studentData?: {
    address?: string;
    interests?: string;
  };
  parentData?: {
    occupation?: string;
    workPlace?: string;
    address?: string;
  };
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        teacher: {
          include: {
            profile: true,
          },
        },
        student: {
          include: {
            profile: true,
            class: true,
          },
        },
        parent: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const primaryRole = this.getPrimaryRole(user.roles);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || undefined,
      role: primaryRole,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || undefined,
    };

    // Add role-specific data
    if (user.teacher) {
      profile.teacherData = {
        employeeId: user.teacher.employeeId || '',
        designation: user.teacher.designation || '',
        department: user.teacher.department || '',
        joiningDate: user.teacher.joiningDate,
        qualification: user.teacher.qualification || '',
        experienceYears: user.teacher.experienceYears || 0,
        basicSalary: Number(user.teacher.basicSalary),
        profile: user.teacher.profile,
      };
    }

    if (user.student) {
      profile.studentData = {
        studentId: user.student.studentId || '',
        rollNumber: user.student.rollNumber || '',
        classId: user.student.classId,
        admissionDate: user.student.admissionDate,
        academicStatus: user.student.academicStatus || '',
        profile: user.student.profile,
      };
    }

    if (user.parent) {
      profile.parentData = {
        occupation: user.parent.occupation || '',
        workPlace: user.parent.workPlace || '',
        profile: user.parent.profile,
      };
    }

    return profile;
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserProfile> {
    // Start a transaction
    return await this.prisma.$transaction(async tx => {
      // Update basic user data
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: updateData.fullName,
          phone: updateData.phone,
          updatedAt: new Date(),
        },
      });

      // Get the user's primary role
      const userWithRoles = await tx.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!userWithRoles) {
        throw new NotFoundException('User not found');
      }

      const primaryRole = this.getPrimaryRole(userWithRoles.roles);

      // Update role-specific data
      if (primaryRole === UserRole.TEACHER && updateData.teacherData) {
        await tx.teacher.updateMany({
          where: { userId },
          data: {
            designation: updateData.teacherData.designation,
            qualification: updateData.teacherData.qualification,
            updatedAt: new Date(),
          },
        });
      }

      if (primaryRole === UserRole.STUDENT && updateData.studentData) {
        await tx.student.updateMany({
          where: { userId },
          data: {
            updatedAt: new Date(),
          },
        });
      }

      if (primaryRole === UserRole.PARENT && updateData.parentData) {
        await tx.parent.updateMany({
          where: { userId },
          data: {
            occupation: updateData.parentData.occupation,
            workPlace: updateData.parentData.workPlace,
            updatedAt: new Date(),
          },
        });
      }

      // Return updated profile
      return this.getUserProfile(userId);
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const { verifyPassword, hashPassword } = await import(
      '../../../shared/auth/hash.util'
    );
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
        needPasswordChange: false,
        updatedAt: new Date(),
      },
    });
  }

  async getAccountActivity(userId: string): Promise<any[]> {
    // Get audit logs for the user
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      module: log.module,
      status: log.status,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.timestamp,
    }));
  }

  private getPrimaryRole(userRoles: any[]): UserRole {
    const rolePriority = {
      SUPER_ADMIN: 1,
      ADMIN: 2,
      TEACHER: 3,
      PARENT: 4,
      STUDENT: 5,
    };

    if (!userRoles || userRoles.length === 0) {
      throw new BadRequestException('User has no roles');
    }

    const primaryRole = userRoles.reduce((prev, current) => {
      const prevPriority = rolePriority[prev.role.name] || 999;
      const currentPriority = rolePriority[current.role.name] || 999;
      return prevPriority < currentPriority ? prev : current;
    });

    return primaryRole.role.name as UserRole;
  }
}
