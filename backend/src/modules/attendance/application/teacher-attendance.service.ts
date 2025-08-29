/**
 * =============================================================================
 * Teacher Attendance Service
 * =============================================================================
 * Service for teacher attendance management operations
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
  MarkTeacherAttendanceDto,
  GetTeacherAttendanceQueryDto,
  TeacherAttendanceResponseDto,
  TeacherAttendanceStatsDto,
  TeacherForAttendanceDto,
  TeacherAttendanceSessionResponseDto,
} from '../dto/teacher-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class TeacherAttendanceService {
  private readonly logger = new Logger(TeacherAttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workingDaysService: WorkingDaysService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mark attendance for teachers
   */
  async markAttendance(dto: MarkTeacherAttendanceDto, markedBy: string) {
    const { date, sessionType, teachers, notes } = dto;

    try {
      // Validate date
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      this.logger.log(
        `Marking teacher attendance for ${date}, session: ${sessionType}`,
      );

      const attendanceRecords: any[] = [];

      // Use transaction for data consistency
      const result = await this.prisma.$transaction(async tx => {
        // Check if attendance session already exists
        let attendanceSession = await tx.teacherAttendanceSession.findUnique({
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
          attendanceSession = await tx.teacherAttendanceSession.create({
            data: {
              date: attendanceDate,
              sessionType,
              markedBy,
              notes:
                notes ||
                `Teacher attendance marked for ${teachers.length} teachers`,
            },
            include: {
              records: true,
            },
          });

          this.logger.debug(
            `Created new teacher attendance session: ${attendanceSession.id}`,
          );
        }

        let newRecordsCount = 0;
        let updatedRecordsCount = 0;

        for (const teacher of teachers) {
          // Validate teacher exists
          const teacherExists = await tx.teacher.findFirst({
            where: {
              id: teacher.teacherId,
              deletedAt: null,
            },
          });

          if (!teacherExists) {
            throw new BadRequestException(
              `Teacher ${teacher.teacherId} not found`,
            );
          }

          // Check if record already exists for this teacher in this session
          const existingRecord = attendanceSession.records.find(
            record => record.teacherId === teacher.teacherId,
          );

          if (existingRecord) {
            // Update existing record
            const updatedRecord = await tx.teacherAttendanceRecord.update({
              where: { id: existingRecord.id },
              data: {
                status: teacher.status,
                remarks: teacher.remarks,
                updatedAt: new Date(),
              },
            });
            attendanceRecords.push(updatedRecord);
            updatedRecordsCount++;
            this.logger.debug(
              `Updated attendance record for teacher ${teacher.teacherId}: ${teacher.status}`,
            );
          } else {
            // Create new record
            const newRecord = await tx.teacherAttendanceRecord.create({
              data: {
                sessionId: attendanceSession.id,
                teacherId: teacher.teacherId,
                status: teacher.status,
                remarks: teacher.remarks,
              },
            });
            attendanceRecords.push(newRecord);
            newRecordsCount++;
            this.logger.debug(
              `Created new attendance record for teacher ${teacher.teacherId}: ${teacher.status}`,
            );
          }
        }

        // Log audit entry with detailed information
        await this.auditService.log({
          userId: markedBy,
          action: 'MARK_TEACHER_ATTENDANCE',
          module: 'TEACHER_ATTENDANCE',
          details: {
            sessionId: attendanceSession.id,
            date: date,
            sessionType: sessionType,
            totalTeachers: teachers.length,
            newRecords: newRecordsCount,
            updatedRecords: updatedRecordsCount,
            attendanceBreakdown: {
              present: teachers.filter(t => t.status === 'PRESENT').length,
              absent: teachers.filter(t => t.status === 'ABSENT').length,
              late: teachers.filter(t => t.status === 'LATE').length,
              excused: teachers.filter(t => t.status === 'EXCUSED').length,
            },
          },
        });

        // Mark session as completed
        await tx.teacherAttendanceSession.update({
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
        `Teacher attendance marked successfully: ${result.recordsCreated} new, ${result.recordsUpdated} updated`,
      );

      return {
        success: true,
        message: 'Teacher attendance marked successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error marking teacher attendance:', error);
      throw error;
    }
  }

  /**
   * Get all teachers for attendance marking
   */
  async getTeachersForAttendance(
    date?: string,
  ): Promise<TeacherForAttendanceDto[]> {
    try {
      this.logger.log(`Getting teachers for attendance, date: ${date}`);

      // Simple query first - just get all active teachers with user data
      const teachers = await this.prisma.teacher.findMany({
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
        },
        orderBy: { designation: 'asc' }, // Simplified ordering
      });

      this.logger.log(`Found ${teachers.length} teachers`);

      // Get attendance records for the specified date (if provided)
      let todaysAttendance: any[] = [];
      if (date) {
        // Validate and parse date
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) {
          throw new BadRequestException('Invalid date format');
        }

        todaysAttendance = await this.prisma.teacherAttendanceRecord.findMany({
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
        });
      }

      // Return teacher data with attendance information
      return teachers
        .filter(teacher => teacher.user) // Only include teachers with user accounts
        .map(teacher => {
          // Find the latest attendance record for this teacher
          const latestAttendance = todaysAttendance.find(
            record => record.teacherId === teacher.id,
          );

          return {
            id: teacher.id,
            name: teacher.user!.fullName,
            employeeId: teacher.employeeId || undefined,
            department: teacher.department || undefined,
            designation: teacher.designation,
            email: teacher.user!.email,
            phone: teacher.user!.phone || undefined,
            imageUrl: teacher.imageUrl || undefined,
            status: latestAttendance?.status || undefined,
            lastAttendance:
              latestAttendance?.session.date.toISOString().split('T')[0] ||
              undefined,
          };
        });
    } catch (error) {
      this.logger.error('Error fetching teachers for attendance:', error);
      throw error;
    }
  }

  /**
   * Get teacher attendance for a specific date
   */
  async getTeacherAttendanceForDate(
    date: string,
    sessionType: string = 'daily',
  ): Promise<TeacherAttendanceSessionResponseDto | null> {
    try {
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      const session = await this.prisma.teacherAttendanceSession.findUnique({
        where: {
          date_sessionType: {
            date: attendanceDate,
            sessionType,
          },
        },
        include: {
          records: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                      phone: true,
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

      const teachers = session.records
        .filter(record => record.teacher.user) // Only include teachers with user accounts
        .map(record => ({
          id: record.teacher.id,
          name: record.teacher.user!.fullName,
          employeeId: record.teacher.employeeId || undefined,
          department: record.teacher.department || undefined,
          designation: record.teacher.designation,
          email: record.teacher.user!.email,
          phone: record.teacher.user!.phone || undefined,
          imageUrl: record.teacher.imageUrl || undefined,
          status: record.status,
          lastAttendance: session.date.toISOString().split('T')[0],
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
        totalTeachers: session.records.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        teachers,
      };
    } catch (error) {
      this.logger.error('Error fetching teacher attendance for date:', error);
      throw error;
    }
  }

  /**
   * Get teacher attendance statistics
   */
  async getTeacherAttendanceStats(
    teacherId: string,
    month?: number,
    year?: number,
  ): Promise<TeacherAttendanceStatsDto> {
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

      // Get attendance records for the teacher in the specified month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const attendanceRecords =
        await this.prisma.teacherAttendanceRecord.findMany({
          where: {
            teacherId,
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
      this.logger.error('Error calculating teacher attendance stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed teacher attendance
   */
  async getTeacherAttendance(
    query: GetTeacherAttendanceQueryDto,
  ): Promise<TeacherAttendanceResponseDto> {
    const { teacherId, startDate, endDate, month, year, page, limit } = query;

    if (!teacherId) {
      throw new BadRequestException('Teacher ID is required');
    }

    try {
      // Validate teacher exists
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Build date filter
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        dateFilter = {
          gte: start,
          lte: end,
        };
      }

      // Get attendance records
      const records = await this.prisma.teacherAttendanceRecord.findMany({
        where: {
          teacherId,
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
        skip: (page - 1) * limit,
        take: limit,
      });

      // Get stats for the same period
      const stats = await this.getTeacherAttendanceStats(
        teacherId,
        month,
        year,
      );

      const attendanceRecords = records.map(record => ({
        date: record.session.date.toISOString().split('T')[0],
        status: record.status,
        remarks: record.remarks || undefined,
        sessionType: record.session.sessionType,
      }));

      return {
        teacherId: teacher.id,
        teacherName: teacher.user.fullName,
        employeeId: teacher.employeeId || undefined,
        department: teacher.department || undefined,
        designation: teacher.designation,
        stats,
        records: attendanceRecords,
      };
    } catch (error) {
      this.logger.error('Error fetching teacher attendance:', error);
      throw error;
    }
  }
}
