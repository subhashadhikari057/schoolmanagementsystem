/**
 * =============================================================================
 * Attendance Service
 * =============================================================================
 * Main service for attendance management operations
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
  MarkAttendanceDto,
  GetAttendanceQueryDto,
  WorkingDaysCalculationDto,
  StudentAttendanceResponseDto,
  AttendanceStatsDto,
} from '../dto/attendance.dto';
import { AttendanceStatus, AttendanceRecord } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workingDaysService: WorkingDaysService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mark attendance for students in a class
   */
  async markAttendance(dto: MarkAttendanceDto, markedBy: string) {
    const { classId, date, sessionType, students, notes } = dto;

    try {
      // Validate class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }

      // Validate date is not in the future
      const attendanceDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (attendanceDate > today) {
        throw new BadRequestException(
          'Cannot mark attendance for future dates',
        );
      }

      // Check if attendance session already exists
      let attendanceSession = await this.prisma.attendanceSession.findUnique({
        where: {
          classId_date_sessionType: {
            classId,
            date: attendanceDate,
            sessionType,
          },
        },
        include: {
          records: true,
        },
      });

      let isNewSession = false;

      // Create or update attendance session
      if (!attendanceSession) {
        // Create new session
        attendanceSession = await this.prisma.attendanceSession.create({
          data: {
            classId,
            date: attendanceDate,
            sessionType,
            markedBy,
            notes,
            isCompleted: true,
          },
          include: {
            records: true,
          },
        });
        isNewSession = true;
        this.logger.log(
          `New attendance session created for class ${classId} on ${date}`,
        );
      } else {
        // Update existing session metadata
        attendanceSession = await this.prisma.attendanceSession.update({
          where: { id: attendanceSession.id },
          data: {
            markedBy,
            markedAt: new Date(),
            notes,
            isCompleted: true,
          },
          include: {
            records: true,
          },
        });
        this.logger.log(
          `Existing attendance session updated for class ${classId} on ${date}`,
        );
      }

      // Process attendance records - upsert individual student records
      const attendanceRecords: AttendanceRecord[] = [];
      let newRecordsCount = 0;
      let updatedRecordsCount = 0;

      for (const student of students) {
        // Validate student exists and belongs to the class
        const studentExists = await this.prisma.student.findFirst({
          where: {
            id: student.studentId,
            classId,
            deletedAt: null,
          },
        });

        if (!studentExists) {
          throw new BadRequestException(
            `Student ${student.studentId} not found in class`,
          );
        }

        // Check if record already exists for this student in this session
        const existingRecord = attendanceSession.records.find(
          record => record.studentId === student.studentId,
        );

        if (existingRecord) {
          // Update existing record
          const updatedRecord = await this.prisma.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: {
              status: student.status,
              remarks: student.remarks,
              updatedAt: new Date(),
            },
          });
          attendanceRecords.push(updatedRecord);
          updatedRecordsCount++;
          this.logger.debug(
            `Updated attendance record for student ${student.studentId}: ${student.status}`,
          );
        } else {
          // Create new record
          const newRecord = await this.prisma.attendanceRecord.create({
            data: {
              sessionId: attendanceSession.id,
              studentId: student.studentId,
              status: student.status,
              remarks: student.remarks,
            },
          });
          attendanceRecords.push(newRecord);
          newRecordsCount++;
          this.logger.debug(
            `Created new attendance record for student ${student.studentId}: ${student.status}`,
          );
        }
      }

      // Log audit entry with detailed information
      await this.auditService.log({
        userId: markedBy,
        action: isNewSession ? 'ATTENDANCE_CREATED' : 'ATTENDANCE_UPDATED',
        module: 'ATTENDANCE',
        details: {
          classId,
          date: date,
          sessionType,
          totalStudents: students.length,
          newRecords: newRecordsCount,
          updatedRecords: updatedRecordsCount,
          sessionId: attendanceSession.id,
          isNewSession,
        },
      });

      const operationType = isNewSession ? 'created' : 'updated';
      this.logger.log(
        `Attendance ${operationType} for class ${classId} on ${date} by ${markedBy} - ${newRecordsCount} new, ${updatedRecordsCount} updated`,
      );

      return {
        success: true,
        message: `Attendance ${operationType} successfully`,
        sessionId: attendanceSession.id,
        recordsCount: attendanceRecords.length,
        operationDetails: {
          isNewSession,
          newRecords: newRecordsCount,
          updatedRecords: updatedRecordsCount,
          totalRecords: attendanceRecords.length,
        },
        data: {
          session: attendanceSession,
          records: attendanceRecords,
        },
      };
    } catch (error) {
      this.logger.error('Error marking attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a student
   */
  async getStudentAttendanceStats(
    studentId: string,
    month?: number,
    year?: number,
  ): Promise<AttendanceStatsDto> {
    try {
      // Default to current month/year if not provided
      const now = new Date();
      const targetMonth = month || now.getMonth() + 1;
      const targetYear = year || now.getFullYear();

      // Get working days for the period
      const totalWorkingDays =
        await this.workingDaysService.calculateWorkingDays(
          targetMonth,
          targetYear,
        );

      // Build date range for the month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      // Get attendance records for the student in the period
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          studentId,
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

      // Calculate statistics
      const presentDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.PRESENT,
      ).length;
      const absentDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.ABSENT,
      ).length;
      const lateDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.LATE,
      ).length;
      const excusedDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.EXCUSED,
      ).length;

      // Calculate attendance percentage
      // Present, Late, and Excused count as positive attendance (+1)
      // Absent counts as negative attendance (-1)
      const positiveAttendance = presentDays + lateDays + excusedDays;
      const attendancePercentage =
        totalWorkingDays > 0
          ? Math.round((positiveAttendance / totalWorkingDays) * 100)
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
      this.logger.error(
        `Error getting attendance stats for student ${studentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get detailed attendance for a student
   */
  async getStudentAttendance(
    studentId: string,
    query: GetAttendanceQueryDto,
  ): Promise<StudentAttendanceResponseDto> {
    try {
      // Get student details
      const student = await this.prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
          class: {
            select: {
              grade: true,
              section: true,
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // Build date filter
      let dateFilter: { gte?: Date; lte?: Date } = {};
      if (query.startDate && query.endDate) {
        dateFilter = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate),
        };
      } else if (query.month && query.year) {
        const startDate = new Date(query.year, query.month - 1, 1);
        const endDate = new Date(query.year, query.month, 0);
        dateFilter = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Get attendance records
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          studentId,
          ...(Object.keys(dateFilter).length > 0 && {
            session: {
              date: dateFilter,
            },
          }),
        },
        include: {
          session: {
            select: {
              date: true,
              sessionType: true,
            },
          },
        },
        orderBy: {
          session: {
            date: 'desc',
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });

      // Get statistics for the same period
      const stats = await this.getStudentAttendanceStats(
        studentId,
        query.month,
        query.year,
      );

      return {
        studentId: student.id,
        studentName: student.user?.fullName || 'Unknown',
        rollNumber: student.rollNumber,
        className: `Grade ${student.class?.grade} ${student.class?.section}`,
        stats,
        records: attendanceRecords.map(record => ({
          date: record.session.date.toISOString().split('T')[0],
          status: record.status,
          remarks: record.remarks || undefined,
          sessionType: record.session.sessionType,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting attendance for student ${studentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get class attendance for a specific date
   */
  async getClassAttendance(
    classId: string,
    date: string,
    sessionType: string = 'daily',
  ) {
    try {
      const attendanceDate = new Date(date);

      // Check if the date is a holiday/event
      const dateStatus = await this.workingDaysService.checkDateStatus(date);

      const attendanceSession = await this.prisma.attendanceSession.findUnique({
        where: {
          classId_date_sessionType: {
            classId,
            date: attendanceDate,
            sessionType,
          },
        },
        include: {
          records: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Return both attendance data and date status with new format
      return {
        ...attendanceSession,
        dateStatus: {
          isWorkingDay: dateStatus.isWorkingDay,
          isHoliday: dateStatus.isHoliday,
          isEmergencyClosure: dateStatus.isEmergencyClosure,
          message: dateStatus.message,
          eventDetails: dateStatus.eventDetails,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting class attendance:`, error);
      throw error;
    }
  }

  /**
   * Calculate working days for a month
   */
  async calculateWorkingDays(dto: WorkingDaysCalculationDto) {
    return this.workingDaysService.calculateWorkingDays(dto.month, dto.year);
  }

  /**
   * Check if a date is a holiday, event, or working day
   */
  async checkDateStatus(date: string) {
    try {
      return await this.workingDaysService.checkDateStatus(date);
    } catch (error) {
      this.logger.error(`Error checking date status:`, error);
      throw error;
    }
  }

  /**
   * Get class-wise attendance statistics for today
   */
  async getClassWiseAttendanceStats(date?: string) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      // Set to start of day for accurate comparison
      targetDate.setHours(0, 0, 0, 0);

      // Get all classes with their student counts
      const classes = await this.prisma.class.findMany({
        select: {
          id: true,
          grade: true,
          section: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      });

      // Get attendance sessions for today
      const attendanceSessions = await this.prisma.attendanceSession.findMany({
        where: {
          date: targetDate,
          sessionType: 'daily',
        },
        include: {
          records: {
            select: {
              status: true,
            },
          },
        },
      });

      // Create a map for quick lookup of attendance data
      const attendanceMap = new Map();
      attendanceSessions.forEach(session => {
        const present = session.records.filter(
          r => r.status === AttendanceStatus.PRESENT,
        ).length;
        const absent = session.records.filter(
          r => r.status === AttendanceStatus.ABSENT,
        ).length;
        const late = session.records.filter(
          r => r.status === AttendanceStatus.LATE,
        ).length;
        const excused = session.records.filter(
          r => r.status === AttendanceStatus.EXCUSED,
        ).length;

        attendanceMap.set(session.classId, {
          present,
          absent,
          late,
          excused,
          total: session.records.length,
          isCompleted: session.isCompleted,
        });
      });

      // Combine class data with attendance stats
      const classStats = classes.map(classItem => {
        const attendanceData = attendanceMap.get(classItem.id);
        const totalStudents = classItem._count.students;

        if (attendanceData) {
          const attendancePercentage =
            totalStudents > 0
              ? Math.round((attendanceData.present / totalStudents) * 100)
              : 0;

          return {
            id: classItem.id,
            grade: classItem.grade,
            section: classItem.section,
            totalStudents,
            present: attendanceData.present,
            absent: attendanceData.absent,
            late: attendanceData.late,
            excused: attendanceData.excused,
            attendancePercentage,
            status: attendanceData.isCompleted ? 'completed' : 'partial',
          };
        } else {
          return {
            id: classItem.id,
            grade: classItem.grade,
            section: classItem.section,
            totalStudents,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            attendancePercentage: 0,
            status: 'pending',
          };
        }
      });

      // Calculate overall statistics
      const overallStats = {
        totalStudents: classStats.reduce(
          (sum, cls) => sum + cls.totalStudents,
          0,
        ),
        totalPresent: classStats.reduce((sum, cls) => sum + cls.present, 0),
        totalAbsent: classStats.reduce((sum, cls) => sum + cls.absent, 0),
        totalLate: classStats.reduce((sum, cls) => sum + cls.late, 0),
        totalExcused: classStats.reduce((sum, cls) => sum + cls.excused, 0),
        completedClasses: classStats.filter(cls => cls.status === 'completed')
          .length,
        pendingClasses: classStats.filter(cls => cls.status === 'pending')
          .length,
        partialClasses: classStats.filter(cls => cls.status === 'partial')
          .length,
      };

      overallStats['overallAttendanceRate'] =
        overallStats.totalStudents > 0
          ? Math.round(
              (overallStats.totalPresent / overallStats.totalStudents) * 100,
            )
          : 0;

      return {
        date: targetDate.toISOString().split('T')[0],
        classes: classStats,
        overall: overallStats,
      };
    } catch (error) {
      this.logger.error(`Error getting class-wise attendance stats:`, error);
      throw error;
    }
  }
}
