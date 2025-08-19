import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  MarkAttendanceRequestDtoType,
  AttendanceResponseDtoType,
  GetAttendanceQueryDtoType,
  UpdateAttendanceDtoType,
  AttendanceStatus,
} from '@sms/shared-types';
import { AttendanceStatus as PrismaAttendanceStatus } from '@prisma/client';
import { AttendanceRecord } from '@prisma/client';

/**
 * Helper function to parse and normalize date values
 */
function parseDate(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === 'string') {
    // Remove extra quotes if present
    const cleanDate = dateValue.replace(/^"|"$/g, '');

    // Handle ISO date strings (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      const parsed = new Date(cleanDate + 'T00:00:00.000Z');
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date format: ${dateValue}`);
      }
      return parsed;
    }

    // Handle other date formats
    const parsed = new Date(cleanDate);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${dateValue}`);
    }

    // Validate the parsed date is reasonable (not negative year, etc.)
    if (parsed.getFullYear() < 1900 || parsed.getFullYear() > 2100) {
      throw new Error(
        `Date year out of reasonable range: ${parsed.getFullYear()}`,
      );
    }

    return parsed;
  }

  throw new Error(`Invalid date value: ${dateValue}`);
}

/**
 * Normalize date to start of day (00:00:00)
 */
function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Maps Prisma's AttendanceStatus to the shared-types AttendanceStatus enum
 */
function mapPrismaStatusToEnum(
  status: PrismaAttendanceStatus,
): AttendanceStatus {
  switch (status) {
    case 'PRESENT':
      return AttendanceStatus.PRESENT;
    case 'ABSENT':
      return AttendanceStatus.ABSENT;
    case 'LATE':
    case 'EXCUSED':
    case 'UNKNOWN':
      // Map additional statuses to ABSENT for now since shared-types only has PRESENT/ABSENT
      return AttendanceStatus.ABSENT;
    default:
      return AttendanceStatus.ABSENT;
  }
}

/**
 * Maps the shared-types AttendanceStatus enum to Prisma's AttendanceStatus
 */
function mapEnumToPrismaStatus(
  status: AttendanceStatus,
): PrismaAttendanceStatus {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 'PRESENT' as PrismaAttendanceStatus;
    case AttendanceStatus.ABSENT:
      return 'ABSENT' as PrismaAttendanceStatus;
    default:
      return 'ABSENT' as PrismaAttendanceStatus;
  }
}

/**
 * Maps a Prisma AttendanceRecord to an AttendanceResponseDtoType
 */
function mapToAttendanceResponse(
  record: AttendanceRecord,
): AttendanceResponseDtoType {
  return {
    id: record.id,
    student_id: record.studentId,
    class_id: record.classId,
    date: record.date,
    status: mapPrismaStatusToEnum(record.status),
    remarks: record.remarks || undefined,
    created_at: record.createdAt,
    updated_at: record.updatedAt || undefined,
    created_by: record.createdById || undefined,
    updated_by: record.updatedById || undefined,
  };
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mark attendance for students in a class
   * Only one attendance record per student per day per class
   */
  async markAttendance(
    data: MarkAttendanceRequestDtoType,
    userId: string,
  ): Promise<AttendanceResponseDtoType[]> {
    const attendanceDate = normalizeDate(parseDate(data.date));

    // Validate class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: data.class_id },
      include: { classTeacher: true },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    // Validate all students belong to the class
    const studentIds = data.entries.map(entry => entry.student_id);
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: data.class_id,
      },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException(
        'Some students do not belong to this class',
      );
    }

    // Check if attendance already exists for this date and class
    const existingAttendance = await this.prisma.attendanceRecord.findMany({
      where: {
        classId: data.class_id,
        date: attendanceDate,
        deletedAt: null,
      },
    });

    if (existingAttendance.length > 0) {
      throw new ConflictException(
        `Attendance for ${attendanceDate.toDateString()} has already been marked for this class`,
      );
    }

    // Create attendance records for all students
    const records = await Promise.all(
      data.entries.map(async entry => {
        // Validate student exists and belongs to the class
        const student = students.find(s => s.id === entry.student_id);
        if (!student) {
          throw new BadRequestException(
            `Student ${entry.student_id} not found in class ${data.class_id}`,
          );
        }

        // Create new attendance record
        return this.prisma.attendanceRecord.create({
          data: {
            studentId: entry.student_id,
            classId: data.class_id,
            date: attendanceDate,
            status: mapEnumToPrismaStatus(entry.status),
            remarks: entry.remarks || null, // Remarks are optional for initial marking
            createdById: userId,
          },
        });
      }),
    );

    // Log audit
    await this.auditService.log({
      action: 'MARK_ATTENDANCE',
      module: 'ATTENDANCE',
      userId,
      details: {
        classId: data.class_id,
        date: attendanceDate,
        studentCount: records.length,
      },
    });

    return records.map(mapToAttendanceResponse);
  }

  /**
   * Get attendance records by query parameters
   */
  async getAttendance(
    query: GetAttendanceQueryDtoType,
  ): Promise<AttendanceResponseDtoType[]> {
    const startDate = normalizeDate(parseDate(query.start_date));
    const endDate = normalizeDate(parseDate(query.end_date));

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    // Add class filter if provided
    if (query.class_id) {
      whereClause.classId = query.class_id;
    }

    // Add student filter if provided
    if (query.student_id) {
      whereClause.studentId = query.student_id;
    }

    // Add status filter if provided
    if (query.status) {
      whereClause.status = mapEnumToPrismaStatus(query.status);
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return records.map(mapToAttendanceResponse);
  }

  /**
   * Get attendance summary for a class on a specific date
   */
  async getClassAttendanceSummary(classId: string, date: Date | string) {
    const attendanceDate = normalizeDate(parseDate(date));

    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        classId,
        date: attendanceDate,
        deletedAt: null,
      },
      _count: true,
    });

    // Get total students in class
    const totalStudents = await this.prisma.student.count({
      where: {
        classId,
        deletedAt: null,
      },
    });

    // Get marked attendance count
    const markedCount = records.reduce((sum, record) => sum + record._count, 0);

    return {
      date: attendanceDate,
      classId,
      totalStudents,
      markedCount,
      unmarkedCount: totalStudents - markedCount,
      summary: records.map(record => ({
        status: mapPrismaStatusToEnum(record.status),
        count: record._count,
      })),
    };
  }

  /**
   * Get attendance summary for a student over a date range
   */
  async getStudentAttendanceSummary(
    studentId: string,
    startDate: Date | string,
    endDate: Date | string,
  ) {
    const parsedStartDate = normalizeDate(parseDate(startDate));
    const parsedEndDate = normalizeDate(parseDate(endDate));

    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        studentId,
        date: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        deletedAt: null,
      },
      _count: true,
    });

    const totalDays = records.reduce((sum, record) => sum + record._count, 0);
    const presentDays = records.find(r => r.status === 'PRESENT')?._count || 0;
    const absentDays = records.find(r => r.status === 'ABSENT')?._count || 0;
    const lateDays = records.find(r => r.status === 'LATE')?._count || 0;
    const excusedDays = records.find(r => r.status === 'EXCUSED')?._count || 0;

    return {
      studentId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage:
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      summary: records.map(record => ({
        status: mapPrismaStatusToEnum(record.status),
        count: record._count,
      })),
    };
  }

  /**
   * Update attendance for a single student
   */
  async updateAttendance(
    attendanceId: string,
    data: UpdateAttendanceDtoType,
    userId: string,
  ): Promise<AttendanceResponseDtoType> {
    // Find the attendance record
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    // Check if record is deleted
    if (record.deletedAt !== null) {
      throw new NotFoundException('Attendance record has been deleted');
    }

    // Validate required fields
    if (!data.remarks || data.remarks.trim() === '') {
      throw new BadRequestException(
        'Remarks are required when updating attendance',
      );
    }

    // Update the record
    const updated = await this.prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        status: mapEnumToPrismaStatus(data.status),
        remarks: data.remarks.trim(),
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    // Log audit
    await this.auditService.log({
      action: 'UPDATE_ATTENDANCE',
      module: 'ATTENDANCE',
      userId,
      details: {
        attendanceId,
        oldStatus: record.status,
        newStatus: data.status,
        remarks: data.remarks,
        studentName: record.student.user.fullName,
        className:
          record.class.name ||
          `Grade ${record.class.grade} Section ${record.class.section}`,
      },
    });

    return mapToAttendanceResponse(updated);
  }

  /**
   * Get attendance records for a specific class and date
   */
  async getAttendanceForClassAndDate(classId: string, date: Date | string) {
    const attendanceDate = normalizeDate(parseDate(date));

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        classId,
        date: attendanceDate,
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc',
          },
        },
      },
    });

    return records.map(mapToAttendanceResponse);
  }

  /**
   * Get attendance statistics for a class over a date range
   */
  async getClassAttendanceStats(
    classId: string,
    startDate: Date | string,
    endDate: Date | string,
  ) {
    const parsedStartDate = normalizeDate(parseDate(startDate));
    const parsedEndDate = normalizeDate(parseDate(endDate));

    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['date', 'status'],
      where: {
        classId,
        date: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        deletedAt: null,
      },
      _count: true,
    });

    // Group by date
    const attendanceByDate = records.reduce(
      (acc, record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: record.date,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          };
        }

        acc[dateKey][record.status.toLowerCase()] = record._count;
        acc[dateKey].total += record._count;

        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(attendanceByDate);
  }

  /**
   * Get attendance statistics for a student over a date range
   */
  async getStudentAttendanceStats(
    studentId: string,
    startDate: Date | string,
    endDate: Date | string,
  ) {
    const parsedStartDate = normalizeDate(parseDate(startDate));
    const parsedEndDate = normalizeDate(parseDate(endDate));

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        deletedAt: null,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return records.map(mapToAttendanceResponse);
  }

  /**
   * Delete attendance record (soft delete)
   */
  async deleteAttendance(attendanceId: string, userId: string): Promise<void> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
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
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    if (record.deletedAt !== null) {
      throw new NotFoundException('Attendance record has already been deleted');
    }

    await this.prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Log audit
    await this.auditService.log({
      action: 'DELETE_ATTENDANCE',
      module: 'ATTENDANCE',
      userId,
      details: {
        attendanceId,
        studentName: record.student.user.fullName,
        className:
          record.class.name ||
          `Grade ${record.class.grade} Section ${record.class.section}`,
        date: record.date,
      },
    });
  }

  /**
   * Get attendance records for a specific student
   */
  async getStudentAttendance(
    studentId: string,
    startDate?: Date | string,
    endDate?: Date | string,
  ) {
    const whereClause: any = {
      studentId,
      deletedAt: null,
    };

    if (startDate && endDate) {
      const parsedStartDate = normalizeDate(parseDate(startDate));
      const parsedEndDate = normalizeDate(parseDate(endDate));

      whereClause.date = {
        gte: parsedStartDate,
        lte: parsedEndDate,
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return records.map(mapToAttendanceResponse);
  }
}
