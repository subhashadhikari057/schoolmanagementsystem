/**
 * =============================================================================
 * Staff Attendance Service
 * =============================================================================
 * Service for staff attendance management operations
 * =============================================================================
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { WorkingDaysService } from './working-days.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  MarkStaffAttendanceDto,
  GetStaffAttendanceQueryDto,
  StaffAttendanceResponseDto,
  StaffAttendanceStatsDto,
  StaffForAttendanceDto,
  StaffAttendanceSessionResponseDto,
} from '../dto/staff-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class StaffAttendanceService {
  private readonly logger = new Logger(StaffAttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workingDaysService: WorkingDaysService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mark attendance for staff
   */
  async markAttendance(dto: MarkStaffAttendanceDto, markedBy: string) {
    const { date, sessionType, staff, notes } = dto;

    try {
      // Validate date
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      this.logger.log(
        `Marking staff attendance for ${date}, session: ${sessionType}`,
      );

      const attendanceRecords: any[] = [];

      // Use transaction for data consistency
      const result = await this.prisma.$transaction(async tx => {
        // Check if attendance session already exists
        let attendanceSession = await tx.staffAttendanceSession.findUnique({
          where: {
            date_sessionType: {
              date: attendanceDate,
              sessionType,
            },
          },
          include: {
            records: true,
          },
        });

        // Create session if it doesn't exist
        if (!attendanceSession) {
          attendanceSession = await tx.staffAttendanceSession.create({
            data: {
              date: attendanceDate,
              sessionType,
              markedBy,
              notes:
                notes ||
                `Staff attendance marked for ${staff.length} staff members`,
            },
            include: {
              records: true,
            },
          });

          this.logger.debug(
            `Created new staff attendance session: ${attendanceSession.id}`,
          );
        }

        let newRecordsCount = 0;
        let updatedRecordsCount = 0;

        for (const staffMember of staff) {
          // Validate staff exists
          const staffExists = await tx.staff.findFirst({
            where: {
              id: staffMember.staffId,
              deletedAt: null,
            },
          });

          if (!staffExists) {
            throw new BadRequestException(
              `Staff member ${staffMember.staffId} not found`,
            );
          }

          // Check if record already exists for this staff member in this session
          const existingRecord = attendanceSession.records.find(
            record => record.staffId === staffMember.staffId,
          );

          if (existingRecord) {
            // Update existing record
            const updatedRecord = await tx.staffAttendanceRecord.update({
              where: { id: existingRecord.id },
              data: {
                status: staffMember.status,
                remarks: staffMember.remarks,
                updatedAt: new Date(),
              },
            });
            attendanceRecords.push(updatedRecord);
            updatedRecordsCount++;
            this.logger.debug(
              `Updated attendance record for staff ${staffMember.staffId}: ${staffMember.status}`,
            );
          } else {
            // Create new record
            const newRecord = await tx.staffAttendanceRecord.create({
              data: {
                sessionId: attendanceSession.id,
                staffId: staffMember.staffId,
                status: staffMember.status,
                remarks: staffMember.remarks,
              },
            });
            attendanceRecords.push(newRecord);
            newRecordsCount++;
            this.logger.debug(
              `Created new attendance record for staff ${staffMember.staffId}: ${staffMember.status}`,
            );
          }
        }

        // Log audit entry with detailed information
        await this.auditService.log({
          userId: markedBy,
          action: 'MARK_STAFF_ATTENDANCE',
          module: 'STAFF_ATTENDANCE',
          details: {
            sessionId: attendanceSession.id,
            date: date,
            sessionType: sessionType,
            totalStaff: staff.length,
            newRecords: newRecordsCount,
            updatedRecords: updatedRecordsCount,
            attendanceBreakdown: {
              present: staff.filter(s => s.status === 'PRESENT').length,
              absent: staff.filter(s => s.status === 'ABSENT').length,
              late: staff.filter(s => s.status === 'LATE').length,
              excused: staff.filter(s => s.status === 'EXCUSED').length,
            },
          },
        });

        // Mark session as completed
        await tx.staffAttendanceSession.update({
          where: { id: attendanceSession.id },
          data: { isCompleted: true },
        });

        return {
          sessionId: attendanceSession.id,
          recordsCreated: newRecordsCount,
          recordsUpdated: updatedRecordsCount,
          totalRecords: attendanceRecords.length,
        };
      });

      this.logger.log(
        `Staff attendance marked successfully: ${result.recordsCreated} new, ${result.recordsUpdated} updated`,
      );

      return {
        success: true,
        message: 'Staff attendance marked successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error marking staff attendance:', error);
      throw error;
    }
  }

  /**
   * Get all staff for attendance marking
   */
  async getStaffForAttendance(date?: string): Promise<StaffForAttendanceDto[]> {
    try {
      const attendanceDate = date ? new Date(date) : new Date();

      // Get all active staff
      const staffMembers = await this.prisma.staff.findMany({
        where: {
          deletedAt: null,
          employmentStatus: 'active',
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          profile: {
            select: {
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
      });

      // Get today's attendance records for all staff
      const todaysAttendance = await this.prisma.staffAttendanceRecord.findMany(
        {
          where: {
            session: {
              date: attendanceDate,
            },
          },
          include: {
            session: true,
          },
          orderBy: {
            markedAt: 'desc',
          },
        },
      );

      return staffMembers.map(staff => {
        // Find the latest attendance record for this staff member
        const latestAttendance = todaysAttendance.find(
          record => record.staffId === staff.id,
        );

        return {
          id: staff.id,
          name: staff.fullName,
          employeeId: staff.employeeId || undefined,
          department: staff.department || undefined,
          designation: staff.designation || undefined,
          email: staff.email,
          phone: staff.phone || undefined,
          imageUrl: staff.profile?.profilePhotoUrl || undefined,
          status: latestAttendance?.status || undefined,
          lastAttendance:
            latestAttendance?.session.date.toISOString().split('T')[0] ||
            undefined,
          hasUserAccount: !!staff.userId, // True if staff has login access
        };
      });
    } catch (error) {
      this.logger.error('Error fetching staff for attendance:', error);
      throw error;
    }
  }

  /**
   * Get staff attendance for a specific date
   */
  async getStaffAttendanceForDate(
    date: string,
    sessionType: string = 'daily',
  ): Promise<StaffAttendanceSessionResponseDto | null> {
    try {
      const attendanceDate = new Date(date);

      const session = await this.prisma.staffAttendanceSession.findUnique({
        where: {
          date_sessionType: {
            date: attendanceDate,
            sessionType,
          },
        },
        include: {
          records: {
            include: {
              staff: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                  profile: {
                    select: {
                      profilePhotoUrl: true,
                    },
                  },
                },
              },
            },
          },
          marker: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      const staff = session.records.map(record => ({
        id: record.staff.id,
        name: record.staff.fullName,
        employeeId: record.staff.employeeId || undefined,
        department: record.staff.department || undefined,
        designation: record.staff.designation || undefined,
        email: record.staff.email,
        phone: record.staff.phone || undefined,
        imageUrl: record.staff.profile?.profilePhotoUrl || undefined,
        status: record.status,
        lastAttendance: session.date.toISOString().split('T')[0],
        hasUserAccount: !!record.staff.userId,
      }));

      const presentCount = session.records.filter(
        r => r.status === 'PRESENT',
      ).length;
      const absentCount = session.records.filter(
        r => r.status === 'ABSENT',
      ).length;
      const lateCount = session.records.filter(r => r.status === 'LATE').length;
      const excusedCount = session.records.filter(
        r => r.status === 'EXCUSED',
      ).length;

      return {
        sessionId: session.id,
        date: session.date.toISOString().split('T')[0],
        sessionType: session.sessionType,
        isCompleted: session.isCompleted,
        markedAt: session.markedAt.toISOString(),
        markedBy: session.marker.fullName,
        totalStaff: session.records.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        staff,
      };
    } catch (error) {
      this.logger.error('Error fetching staff attendance for date:', error);
      throw error;
    }
  }

  /**
   * Get staff attendance statistics
   */
  async getStaffAttendanceStats(
    staffId: string,
    month?: number,
    year?: number,
  ): Promise<StaffAttendanceStatsDto> {
    try {
      const currentDate = new Date();
      const targetMonth = month || currentDate.getMonth() + 1;
      const targetYear = year || currentDate.getFullYear();

      // Get working days for the month
      const workingDays = await this.workingDaysService.getWorkingDaysTracker(
        targetMonth,
        targetYear,
      );

      if (!workingDays) {
        throw new NotFoundException(
          'Working days data not found for this month',
        );
      }

      // Get attendance records for the staff member in the specified month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const attendanceRecords =
        await this.prisma.staffAttendanceRecord.findMany({
          where: {
            staffId,
            session: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            session: true,
          },
        });

      const presentDays = attendanceRecords.filter(
        r => r.status === 'PRESENT',
      ).length;
      const absentDays = attendanceRecords.filter(
        r => r.status === 'ABSENT',
      ).length;
      const lateDays = attendanceRecords.filter(
        r => r.status === 'LATE',
      ).length;
      const excusedDays = attendanceRecords.filter(
        r => r.status === 'EXCUSED',
      ).length;

      const totalWorkingDays = workingDays.availableDays;
      const attendancePercentage =
        totalWorkingDays > 0
          ? Math.round(((presentDays + lateDays) / totalWorkingDays) * 100)
          : 0;

      return {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage,
      };
    } catch (error) {
      this.logger.error('Error calculating staff attendance stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed staff attendance
   */
  async getStaffAttendance(
    query: GetStaffAttendanceQueryDto,
  ): Promise<StaffAttendanceResponseDto> {
    const { staffId, startDate, endDate, month, year, page, limit } = query;

    if (!staffId) {
      throw new BadRequestException('Staff ID is required');
    }

    try {
      // Validate staff exists
      const staff = await this.prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      // Build date filter
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (month && year) {
        const start = new Date(parseInt(year), parseInt(month) - 1, 1);
        const end = new Date(parseInt(year), parseInt(month), 0);
        dateFilter = {
          gte: start,
          lte: end,
        };
      }

      // Get attendance records
      const records = await this.prisma.staffAttendanceRecord.findMany({
        where: {
          staffId,
          ...(Object.keys(dateFilter).length > 0 && {
            session: {
              date: dateFilter,
            },
          }),
        },
        include: {
          session: true,
        },
        orderBy: {
          session: {
            date: 'desc',
          },
        },
        skip: (parseInt(page || '1') - 1) * parseInt(limit || '10'),
        take: parseInt(limit || '10'),
      });

      // Get stats for the same period
      const stats = await this.getStaffAttendanceStats(
        staffId,
        month ? parseInt(month) : undefined,
        year ? parseInt(year) : undefined,
      );

      const attendanceRecords = records.map(record => ({
        date: record.session.date.toISOString().split('T')[0],
        status: record.status,
        remarks: record.remarks || undefined,
        sessionType: record.session.sessionType,
      }));

      return {
        staffId: staff.id,
        staffName: staff.fullName,
        employeeId: staff.employeeId || undefined,
        department: staff.department || undefined,
        designation: staff.designation || undefined,
        hasUserAccount: !!staff.userId,
        stats,
        records: attendanceRecords,
      };
    } catch (error) {
      this.logger.error('Error fetching staff attendance:', error);
      throw error;
    }
  }
}
