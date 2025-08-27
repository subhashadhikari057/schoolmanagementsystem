import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';

@Injectable()
export class TeacherLeaveUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Update teacher leave usage when a leave request is approved
   */
  async updateUsageOnApproval(
    teacherId: string,
    leaveTypeId: string,
    days: number,
    leaveRequestId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify teacher and leave type exist
    const [teacher, leaveType] = await Promise.all([
      this.prisma.teacher.findUnique({
        where: { id: teacherId, deletedAt: null },
      }),
      this.prisma.leaveType.findUnique({
        where: { id: leaveTypeId, deletedAt: null },
      }),
    ]);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    // Update or create usage record
    const existingUsage = await this.prisma.teacherLeaveUsage.findFirst({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
      },
    });

    let usageRecord;
    if (existingUsage) {
      // Update existing record
      usageRecord = await this.prisma.teacherLeaveUsage.update({
        where: { id: existingUsage.id },
        data: {
          totalDaysUsed: {
            increment: days,
          },
          lastUpdated: new Date(),
          updatedById: adminId,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new record
      usageRecord = await this.prisma.teacherLeaveUsage.create({
        data: {
          teacherId,
          leaveTypeId,
          totalDaysUsed: days,
          createdById: adminId,
          updatedById: adminId,
        },
      });
    }

    // Log the usage update
    await this.auditService.log({
      userId: adminId,
      action: 'TEACHER_LEAVE_USAGE_UPDATED',
      module: 'TEACHER_LEAVE_USAGE',
      details: {
        teacherId,
        leaveTypeId,
        daysAdded: days,
        totalDaysUsed: usageRecord.totalDaysUsed,
        leaveRequestId,
      },
      ipAddress,
      userAgent,
    });

    return usageRecord;
  }

  /**
   * Decrease usage when a leave request is cancelled or rejected after approval
   */
  async decreaseUsageOnCancellation(
    teacherId: string,
    leaveTypeId: string,
    days: number,
    leaveRequestId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const usageRecord = await this.prisma.teacherLeaveUsage.findFirst({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
      },
    });

    if (!usageRecord) {
      // No usage record exists, nothing to decrease
      return null;
    }

    if (usageRecord.totalDaysUsed < days) {
      throw new BadRequestException(
        'Cannot decrease usage by more days than currently used',
      );
    }

    const updatedUsage = await this.prisma.teacherLeaveUsage.update({
      where: { id: usageRecord.id },
      data: {
        totalDaysUsed: {
          decrement: days,
        },
        lastUpdated: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    // Log the usage decrease
    await this.auditService.log({
      userId,
      action: 'TEACHER_LEAVE_USAGE_DECREASED',
      module: 'TEACHER_LEAVE_USAGE',
      details: {
        teacherId,
        leaveTypeId,
        daysRemoved: days,
        totalDaysUsed: updatedUsage.totalDaysUsed,
        leaveRequestId,
      },
      ipAddress,
      userAgent,
    });

    return updatedUsage;
  }

  /**
   * Get current usage for a teacher and leave type
   */
  async getCurrentUsage(teacherId: string, leaveTypeId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get total usage
    const totalUsage = await this.prisma.teacherLeaveUsage.findFirst({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
      },
    });

    // Get yearly usage (approved leave requests in current year)
    const yearlyUsage = await this.prisma.teacherLeaveRequest.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        status: 'APPROVED',
        startDate: {
          gte: new Date(currentYear, 0, 1), // January 1st of current year
          lt: new Date(currentYear + 1, 0, 1), // January 1st of next year
        },
        deletedAt: null,
      },
      _sum: {
        days: true,
      },
    });

    // Get monthly usage (approved leave requests in current month)
    const monthlyUsage = await this.prisma.teacherLeaveRequest.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        status: 'APPROVED',
        startDate: {
          gte: new Date(currentYear, currentMonth - 1, 1), // First day of current month
          lt: new Date(currentYear, currentMonth, 1), // First day of next month
        },
        deletedAt: null,
      },
      _sum: {
        days: true,
      },
    });

    return {
      totalUsage: totalUsage?.totalDaysUsed || 0,
      yearlyUsage: yearlyUsage._sum.days || 0,
      monthlyUsage: monthlyUsage._sum.days || 0,
    };
  }

  /**
   * Get teacher's complete leave usage summary
   */
  async getTeacherLeaveUsage(
    teacherId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Check permissions
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!teacher || teacher.id !== teacherId) {
        throw new ForbiddenException('You can only view your own leave usage');
      }
    } else if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Get all leave types
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    // Get usage for each leave type
    const usageData = await Promise.all(
      leaveTypes.map(async leaveType => {
        const currentUsage = await this.getCurrentUsage(
          teacherId,
          leaveType.id,
        );

        return {
          leaveType: {
            id: leaveType.id,
            name: leaveType.name,
            description: leaveType.description,
            isPaid: leaveType.isPaid,
            maxDays: leaveType.maxDays, // Add entitlement information
          },
          usage: currentUsage,
        };
      }),
    );

    return {
      teacherId,
      usageData,
    };
  }

  /**
   * Get all teachers' leave usage (admin view)
   */
  async getAllTeachersLeaveUsage(userId: string, userRole: UserRole) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can view all teachers leave usage',
      );
    }

    // Get all active teachers
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    // Get all leave types
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    // Get usage for each teacher
    const teachersUsage = await Promise.all(
      teachers.map(async teacher => {
        const teacherUsage = await Promise.all(
          leaveTypes.map(async leaveType => {
            const currentUsage = await this.getCurrentUsage(
              teacher.id,
              leaveType.id,
            );

            return {
              leaveType: {
                id: leaveType.id,
                name: leaveType.name,
              },
              usage: currentUsage,
            };
          }),
        );

        return {
          teacher: {
            id: teacher.id,
            fullName: teacher.user.fullName,
            email: teacher.user.email,
          },
          usageData: teacherUsage,
        };
      }),
    );

    return {
      teachersUsage,
      leaveTypes: leaveTypes.map(lt => ({
        id: lt.id,
        name: lt.name,
      })),
    };
  }

  /**
   * Reset teacher's leave usage (admin only)
   */
  async resetTeacherLeaveUsage(
    teacherId: string,
    leaveTypeId: string,
    resetType: 'YEARLY' | 'MONTHLY' | 'ALL',
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reset leave usage');
    }

    const usageRecord = await this.prisma.teacherLeaveUsage.findFirst({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
      },
    });

    if (!usageRecord) {
      throw new NotFoundException(
        'No usage record found for this teacher and leave type',
      );
    }

    const resetData: any = {
      lastUpdated: new Date(),
      updatedById: userId,
      updatedAt: new Date(),
    };

    if (resetType === 'ALL') {
      resetData.totalDaysUsed = 0;
    }
    // For YEARLY and MONTHLY, we keep the total but reset the tracking
    // The actual reset logic would depend on your business requirements

    const updatedUsage = await this.prisma.teacherLeaveUsage.update({
      where: { id: usageRecord.id },
      data: resetData,
    });

    // Log the reset action
    await this.auditService.log({
      userId,
      action: 'TEACHER_LEAVE_USAGE_RESET',
      module: 'TEACHER_LEAVE_USAGE',
      details: {
        teacherId,
        leaveTypeId,
        resetType,
        previousUsage: usageRecord.totalDaysUsed,
        newUsage: updatedUsage.totalDaysUsed,
      },
      ipAddress,
      userAgent,
    });

    return updatedUsage;
  }

  /**
   * Get leave usage statistics
   */
  async getLeaveUsageStatistics(userId: string, userRole: UserRole) {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view usage statistics');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get total teachers
    const totalTeachers = await this.prisma.teacher.count({
      where: { deletedAt: null },
    });

    // Get total leave requests this year
    const yearlyLeaveRequests = await this.prisma.teacherLeaveRequest.aggregate(
      {
        where: {
          startDate: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
        _sum: {
          days: true,
        },
      },
    );

    // Get monthly leave requests
    const monthlyLeaveRequests =
      await this.prisma.teacherLeaveRequest.aggregate({
        where: {
          startDate: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
        _sum: {
          days: true,
        },
      });

    // Get leave requests by status
    const statusStats = await this.prisma.teacherLeaveRequest.groupBy({
      by: ['status'],
      where: {
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    // Get leave requests by type
    const typeStats = await this.prisma.teacherLeaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: {
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        days: true,
      },
    });

    // Get leave type names for type stats
    const leaveTypeIds = typeStats.map(stat => stat.leaveTypeId);
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: {
        id: { in: leaveTypeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const typeStatsWithNames = typeStats.map(stat => {
      const leaveType = leaveTypes.find(lt => lt.id === stat.leaveTypeId);
      return {
        leaveTypeName: leaveType?.name || 'Unknown',
        count: stat._count.id,
        totalDays: stat._sum.days || 0,
      };
    });

    return {
      overview: {
        totalTeachers,
        yearlyRequests: yearlyLeaveRequests._count.id,
        yearlyDays: yearlyLeaveRequests._sum.days || 0,
        monthlyRequests: monthlyLeaveRequests._count.id,
        monthlyDays: monthlyLeaveRequests._sum.days || 0,
      },
      statusBreakdown: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
      })),
      typeBreakdown: typeStatsWithNames,
    };
  }
}
