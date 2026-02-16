import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import { LeaveTypeGenderRule } from '../../leave-type/enums';

@Injectable()
export class TeacherLeaveUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private normalizeGenderValue(
    gender?: string | null,
  ): LeaveTypeGenderRule | 'UNKNOWN' {
    if (!gender) return 'UNKNOWN';
    const normalized = gender.toString().trim().toLowerCase();
    if (['male', 'm'].includes(normalized)) return LeaveTypeGenderRule.MALE;
    if (['female', 'f'].includes(normalized)) return LeaveTypeGenderRule.FEMALE;
    return 'UNKNOWN';
  }

  private isLeaveTypeEligibleForTeacher(leaveType: any, teacher: any): boolean {
    if (!leaveType?.eligibilityGender) return true;
    if (leaveType.eligibilityGender === LeaveTypeGenderRule.ANY) return true;

    const teacherGender = this.normalizeGenderValue(teacher?.gender);
    if (teacherGender === 'UNKNOWN') return false;

    return teacherGender === leaveType.eligibilityGender;
  }

  private getWeekKey(date: Date): string {
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayIndex = utcDate.getUTCDay();
    const weekStart = new Date(utcDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - dayIndex);
    return weekStart.toISOString().slice(0, 10);
  }

  private buildDayCountByWeek(startDate: Date, endDate: Date) {
    const map = new Map<string, number>();
    const cursor = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
    );

    while (cursor <= end) {
      if (cursor.getUTCDay() !== 6) {
        const key = this.getWeekKey(cursor);
        map.set(key, (map.get(key) || 0) + 1);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return map;
  }

  private buildDayCountByYear(startDate: Date, endDate: Date) {
    const map = new Map<number, number>();
    const cursor = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
    );

    while (cursor <= end) {
      if (cursor.getUTCDay() !== 6) {
        const year = cursor.getUTCFullYear();
        map.set(year, (map.get(year) || 0) + 1);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return map;
  }

  private calculateTenureMonths(joiningDate: Date, asOfDate: Date) {
    const start = new Date(
      Date.UTC(
        joiningDate.getUTCFullYear(),
        joiningDate.getUTCMonth(),
        joiningDate.getUTCDate(),
      ),
    );
    const end = new Date(
      Date.UTC(
        asOfDate.getUTCFullYear(),
        asOfDate.getUTCMonth(),
        asOfDate.getUTCDate(),
      ),
    );

    if (end < start) return 0;

    let months =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth());

    if (end.getUTCDate() < start.getUTCDate()) {
      months -= 1;
    }

    return Math.max(months, 0);
  }

  private calculateEntitlementForYear(
    leaveType: any,
    teacher: any,
    asOfDate: Date,
  ) {
    if (!leaveType.prorateOnTenure) {
      return leaveType.maxDays;
    }

    const prorationMonths = leaveType.proratePeriodMonths || 12;
    const tenureMonths = this.calculateTenureMonths(
      teacher.joiningDate,
      asOfDate,
    );

    if (tenureMonths >= prorationMonths) {
      return leaveType.maxDays;
    }

    const prorated = Math.floor(
      (tenureMonths / prorationMonths) * leaveType.maxDays,
    );

    return Math.max(prorated, 0);
  }

  private async calculateCarryForwardDays(
    leaveType: any,
    teacher: any,
    requestYear: number,
  ) {
    const carryLimits = [
      leaveType.carryForwardLimit,
      leaveType.encashAfterLimit,
    ].filter(
      (value: number | null | undefined) => typeof value === 'number',
    ) as number[];
    const carryLimit = carryLimits.length > 0 ? Math.min(...carryLimits) : 0;

    if (!carryLimit || carryLimit <= 0) {
      return 0;
    }

    const joiningYear = teacher.joiningDate
      ? teacher.joiningDate.getUTCFullYear()
      : requestYear;
    const leaveTypeCreatedYear = leaveType.createdAt
      ? new Date(leaveType.createdAt).getUTCFullYear()
      : requestYear;
    const startYear = Math.max(joiningYear, leaveTypeCreatedYear);
    let carryForward = 0;

    for (let year = startYear; year < requestYear; year += 1) {
      const yearEnd = new Date(Date.UTC(year, 11, 31));
      const entitlement = this.calculateEntitlementForYear(
        leaveType,
        teacher,
        yearEnd,
      );

      const requests = await this.prisma.teacherLeaveRequest.findMany({
        where: {
          teacherId: teacher.id,
          leaveTypeId: leaveType.id,
          status: 'APPROVED',
          deletedAt: null,
          startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
          endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
        },
        select: { startDate: true, endDate: true },
      });

      let usedDays = 0;
      requests.forEach(request => {
        const counts = this.buildDayCountByYear(
          request.startDate,
          request.endDate,
        );
        usedDays += counts.get(year) || 0;
      });

      const unused = Math.max(entitlement - usedDays, 0);
      carryForward = Math.min(carryLimit, carryForward + unused);
    }

    return carryForward;
  }

  private async getUsedDaysForYear(
    teacherId: string,
    leaveTypeId: string,
    year: number,
  ) {
    const requests = await this.prisma.teacherLeaveRequest.findMany({
      where: {
        teacherId,
        leaveTypeId,
        status: 'APPROVED',
        deletedAt: null,
        startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
        endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
      },
      select: { startDate: true, endDate: true },
    });

    let usedDays = 0;
    requests.forEach(request => {
      const counts = this.buildDayCountByYear(
        request.startDate,
        request.endDate,
      );
      usedDays += counts.get(year) || 0;
    });

    return usedDays;
  }

  private async getUsedDaysForWeek(
    teacherId: string,
    leaveTypeId: string,
    weekKey: string,
    startDate: Date,
    endDate: Date,
  ) {
    const requests = await this.prisma.teacherLeaveRequest.findMany({
      where: {
        teacherId,
        leaveTypeId,
        status: 'APPROVED',
        deletedAt: null,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { startDate: true, endDate: true },
    });

    let usedDays = 0;
    requests.forEach(request => {
      const counts = this.buildDayCountByWeek(
        request.startDate,
        request.endDate,
      );
      usedDays += counts.get(weekKey) || 0;
    });

    return usedDays;
  }

  private async getUsedDaysAllTime(teacherId: string, leaveTypeId: string) {
    const aggregate = await this.prisma.teacherLeaveRequest.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        status: 'APPROVED',
        deletedAt: null,
      },
      _sum: { days: true },
    });

    return aggregate._sum.days || 0;
  }

  private async getAvailableCredits(teacherId: string, leaveTypeId: string) {
    const now = new Date();
    const creditSum = await this.prisma.teacherLeaveCredit.aggregate({
      where: {
        teacherId,
        leaveTypeId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { days: true },
    });

    const used = await this.getUsedDaysAllTime(teacherId, leaveTypeId);
    return (creditSum._sum.days || 0) - used;
  }

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

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, deletedAt: null },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherGender = this.normalizeGenderValue(teacher.gender);
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: {
        deletedAt: null,
        OR:
          teacherGender === 'UNKNOWN'
            ? [{ eligibilityGender: LeaveTypeGenderRule.ANY }]
            : [
                { eligibilityGender: LeaveTypeGenderRule.ANY },
                { eligibilityGender: teacherGender },
              ],
      },
      orderBy: { name: 'asc' },
    });

    // Get usage for each leave type
    const usageData = await Promise.all(
      leaveTypes.map(async leaveType => {
        const currentUsage = await this.getCurrentUsage(
          teacherId,
          leaveType.id,
        );
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const weekKey = this.getWeekKey(now);
        const weekStart = new Date(weekKey + 'T00:00:00.000Z');
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

        let entitlementDays = leaveType.maxDays;
        let usedDays = 0;
        let remainingDays = 0;
        let carryForwardDays = 0;
        let creditAvailable: number | null = null;
        let periodLabel = '';

        if (leaveType.limitPeriod === 'YEAR') {
          entitlementDays = this.calculateEntitlementForYear(
            leaveType,
            teacher,
            now,
          );
          carryForwardDays = await this.calculateCarryForwardDays(
            leaveType,
            teacher,
            currentYear,
          );
          usedDays = await this.getUsedDaysForYear(
            teacherId,
            leaveType.id,
            currentYear,
          );
          remainingDays = Math.max(
            entitlementDays + carryForwardDays - usedDays,
            0,
          );
          periodLabel = `${currentYear}`;
        } else if (leaveType.limitPeriod === 'WEEK') {
          entitlementDays = leaveType.maxDays;
          usedDays = await this.getUsedDaysForWeek(
            teacherId,
            leaveType.id,
            weekKey,
            weekStart,
            weekEnd,
          );
          remainingDays = Math.max(entitlementDays - usedDays, 0);
          periodLabel = `Week of ${weekKey}`;
        } else {
          entitlementDays = leaveType.maxDays;
          usedDays = await this.getUsedDaysAllTime(teacherId, leaveType.id);
          remainingDays = Math.max(entitlementDays - usedDays, 0);
          periodLabel = 'Lifetime';
        }

        if (leaveType.requiresSubstituteCredit) {
          creditAvailable = await this.getAvailableCredits(
            teacherId,
            leaveType.id,
          );
        }

        return {
          leaveType: {
            id: leaveType.id,
            name: leaveType.name,
            description: leaveType.description,
            isPaid: leaveType.isPaid,
            maxDays: leaveType.maxDays, // Add entitlement information
            paidDays: leaveType.paidDays,
            limitPeriod: leaveType.limitPeriod,
            eligibilityGender: leaveType.eligibilityGender,
            prorateOnTenure: leaveType.prorateOnTenure,
            proratePeriodMonths: leaveType.proratePeriodMonths,
            carryForwardLimit: leaveType.carryForwardLimit,
            encashAfterLimit: leaveType.encashAfterLimit,
            requiresSubstituteCredit: leaveType.requiresSubstituteCredit,
          },
          usage: currentUsage,
          balance: {
            entitlementDays,
            usedDays,
            remainingDays,
            carryForwardDays,
            periodLabel,
            creditAvailable,
          },
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
        const eligibleLeaveTypes = leaveTypes.filter(leaveType =>
          this.isLeaveTypeEligibleForTeacher(leaveType, teacher),
        );

        const teacherUsage = await Promise.all(
          eligibleLeaveTypes.map(async leaveType => {
            const currentUsage = await this.getCurrentUsage(
              teacher.id,
              leaveType.id,
            );

            const now = new Date();
            const currentYear = now.getUTCFullYear();
            const weekKey = this.getWeekKey(now);
            const weekStart = new Date(weekKey + 'T00:00:00.000Z');
            const weekEnd = new Date(weekStart);
            weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

            let entitlementDays = leaveType.maxDays;
            let usedDays = 0;
            let remainingDays = 0;
            let carryForwardDays = 0;
            let creditAvailable: number | null = null;
            let periodLabel = '';

            if (leaveType.limitPeriod === 'YEAR') {
              entitlementDays = this.calculateEntitlementForYear(
                leaveType,
                teacher,
                now,
              );
              carryForwardDays = await this.calculateCarryForwardDays(
                leaveType,
                teacher,
                currentYear,
              );
              usedDays = await this.getUsedDaysForYear(
                teacher.id,
                leaveType.id,
                currentYear,
              );
              remainingDays = Math.max(
                entitlementDays + carryForwardDays - usedDays,
                0,
              );
              periodLabel = `${currentYear}`;
            } else if (leaveType.limitPeriod === 'WEEK') {
              entitlementDays = leaveType.maxDays;
              usedDays = await this.getUsedDaysForWeek(
                teacher.id,
                leaveType.id,
                weekKey,
                weekStart,
                weekEnd,
              );
              remainingDays = Math.max(entitlementDays - usedDays, 0);
              periodLabel = `Week of ${weekKey}`;
            } else {
              entitlementDays = leaveType.maxDays;
              usedDays = await this.getUsedDaysAllTime(
                teacher.id,
                leaveType.id,
              );
              remainingDays = Math.max(entitlementDays - usedDays, 0);
              periodLabel = 'Lifetime';
            }

            if (leaveType.requiresSubstituteCredit) {
              creditAvailable = await this.getAvailableCredits(
                teacher.id,
                leaveType.id,
              );
            }

            return {
              leaveType: {
                id: leaveType.id,
                name: leaveType.name,
              },
              usage: currentUsage,
              balance: {
                entitlementDays,
                usedDays,
                remainingDays,
                carryForwardDays,
                periodLabel,
                creditAvailable,
              },
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
