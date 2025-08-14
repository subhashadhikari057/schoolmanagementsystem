import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  MarkAttendanceDtoType,
  BulkMarkAttendanceDtoType,
  UpdateAttendanceDtoType,
  AttendanceQueryDtoType,
  ClassAttendanceQueryDtoType,
  AttendanceResponseDtoType,
  AttendanceSummaryDtoType,
  StudentAttendanceReportDtoType,
} from '../dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Validates if the current user is the class teacher for the given class
   */
  private async validateClassTeacherPermission(
    userId: string,
    classId: string,
  ): Promise<void> {
    // First, check if user is a teacher
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        userId,
        deletedAt: null,
        isClassTeacher: true,
      },
      include: {
        classesAsTeacher: {
          where: {
            id: classId,
            deletedAt: null,
          },
        },
        classAssignments: {
          where: {
            classId,
            deletedAt: null,
          },
        },
      },
    });

    if (!teacher) {
      throw new ForbiddenException('Only teachers can mark attendance');
    }

    // Check if teacher is assigned to this class (either as class teacher or through assignments)
    const isClassTeacher = teacher.classesAsTeacher.length > 0;
    const isAssignedToClass = teacher.classAssignments.length > 0;

    if (!isClassTeacher && !isAssignedToClass) {
      throw new ForbiddenException(
        'You can only mark attendance for classes you are assigned to',
      );
    }
  }

  /**
   * Mark attendance for a single student
   */
  async markAttendance(
    dto: MarkAttendanceDtoType,
    markedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Validate class teacher permission
    await this.validateClassTeacherPermission(markedBy, dto.classId);

    // Validate student belongs to the class
    const student = await this.prisma.student.findFirst({
      where: {
        id: dto.studentId,
        classId: dto.classId,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found in this class');
    }

    // Check if attendance already exists for this date
    const existingAttendance = await this.prisma.attendanceRecord.findUnique({
      where: {
        studentId_attendanceDate: {
          studentId: dto.studentId,
          attendanceDate: new Date(dto.attendanceDate),
        },
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'Attendance already marked for this student on this date',
      );
    }

    // Create attendance record
    const attendance = await this.prisma.attendanceRecord.create({
      data: {
        studentId: dto.studentId,
        classId: dto.classId,
        attendanceDate: new Date(dto.attendanceDate),
        status: dto.status,
        remarks: dto.remarks,
        additionalMetadata: dto.additionalMetadata || {},
        createdById: markedBy,
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    await this.audit.record({
      userId: markedBy,
      action: 'MARK_ATTENDANCE',
      module: 'attendance',
      status: 'SUCCESS',
      details: {
        attendanceId: attendance.id,
        studentId: dto.studentId,
        classId: dto.classId,
        status: dto.status,
        date: dto.attendanceDate,
      },
      ipAddress: ip,
      userAgent,
    });

    return this.formatAttendanceResponse(attendance);
  }

  /**
   * Mark attendance for multiple students in bulk
   */
  async bulkMarkAttendance(
    dto: BulkMarkAttendanceDtoType,
    markedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Validate class teacher permission
    await this.validateClassTeacherPermission(markedBy, dto.classId);

    // Validate all students belong to the class
    const studentIds = dto.attendanceRecords.map(record => record.studentId);
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: dto.classId,
        deletedAt: null,
      },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException(
        'Some students do not belong to this class',
      );
    }

    // Check for existing attendance records
    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        attendanceDate: new Date(dto.attendanceDate),
      },
    });

    if (existingRecords.length > 0) {
      const existingStudentIds = existingRecords.map(
        record => record.studentId,
      );
      throw new ConflictException(
        `Attendance already marked for students: ${existingStudentIds.join(', ')}`,
      );
    }

    // Prepare attendance records for bulk insert
    const attendanceData = dto.attendanceRecords.map(record => ({
      studentId: record.studentId,
      classId: dto.classId,
      attendanceDate: new Date(dto.attendanceDate),
      status: record.status,
      remarks: record.remarks,
      additionalMetadata: record.additionalMetadata || {},
      createdById: markedBy,
    }));

    // Create attendance records in transaction
    const result = await this.prisma.$transaction(async tx => {
      const createdRecords = await Promise.all(
        attendanceData.map(data =>
          tx.attendanceRecord.create({
            data,
            include: {
              student: {
                include: { user: true },
              },
            },
          }),
        ),
      );
      return createdRecords;
    });

    await this.audit.record({
      userId: markedBy,
      action: 'BULK_MARK_ATTENDANCE',
      module: 'attendance',
      status: 'SUCCESS',
      details: {
        classId: dto.classId,
        date: dto.attendanceDate,
        studentsCount: dto.attendanceRecords.length,
        studentIds,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Attendance marked successfully for all students',
      recordsCreated: result.length,
      attendance: result.map(this.formatAttendanceResponse),
    };
  }

  /**
   * Update existing attendance record
   */
  async updateAttendance(
    attendanceId: string,
    dto: UpdateAttendanceDtoType,
    updatedBy: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Find existing attendance record
    const existingRecord = await this.prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: {
        student: { include: { user: true } },
      },
    });

    if (!existingRecord) {
      throw new NotFoundException('Attendance record not found');
    }

    // Validate class teacher permission
    await this.validateClassTeacherPermission(
      updatedBy,
      existingRecord.classId,
    );

    // Update attendance record
    const updatedRecord = await this.prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        status: dto.status,
        remarks: dto.remarks, // Mandatory for updates as per validation
        additionalMetadata: dto.additionalMetadata,
        updatedById: updatedBy,
        updatedAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
      },
    });

    await this.audit.record({
      userId: updatedBy,
      action: 'UPDATE_ATTENDANCE',
      module: 'attendance',
      status: 'SUCCESS',
      details: {
        attendanceId,
        previousStatus: existingRecord.status,
        newStatus: dto.status,
        studentId: existingRecord.studentId,
        classId: existingRecord.classId,
      },
      ipAddress: ip,
      userAgent,
    });

    return this.formatAttendanceResponse(updatedRecord);
  }

  /**
   * Get attendance records with filtering
   */
  async getAttendanceRecords(query: AttendanceQueryDtoType) {
    const { limit, page, studentId, classId, status, startDate, endDate } =
      query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) where.attendanceDate.gte = new Date(startDate);
      if (endDate) where.attendanceDate.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        include: {
          student: { include: { user: true } },
        },
        orderBy: { attendanceDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      data: records.map(this.formatAttendanceResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get attendance for a specific class and date
   */
  async getClassAttendance(query: ClassAttendanceQueryDtoType) {
    const { classId, attendanceDate } = query;

    // Get all students in the class
    const students = await this.prisma.student.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      include: { user: true },
      orderBy: { rollNumber: 'asc' },
    });

    // Get attendance records for the date
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        classId,
        attendanceDate: new Date(attendanceDate),
      },
      include: {
        student: { include: { user: true } },
      },
    });

    // Create attendance map for quick lookup
    const attendanceMap = new Map(
      attendanceRecords.map(record => [record.studentId, record]),
    );

    // Combine student data with attendance status
    const classAttendance = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      return {
        student: {
          id: student.id,
          userId: student.userId,
          rollNumber: student.rollNumber,
          user: {
            fullName: student.user.fullName,
            email: student.user.email,
          },
        },
        attendance: attendanceRecord
          ? this.formatAttendanceResponse(attendanceRecord)
          : null,
        status: attendanceRecord?.status || 'UNKNOWN',
      };
    });

    return {
      classId,
      attendanceDate,
      students: classAttendance,
      summary: this.calculateAttendanceSummary(
        attendanceRecords,
        students.length,
      ),
    };
  }

  /**
   * Get attendance summary for a class and date
   */
  async getAttendanceSummary(
    classId: string,
    attendanceDate: string,
  ): Promise<AttendanceSummaryDtoType> {
    const [totalStudents, attendanceRecords] = await Promise.all([
      this.prisma.student.count({
        where: { classId, deletedAt: null },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          classId,
          attendanceDate: new Date(attendanceDate),
        },
      }),
    ]);

    return this.calculateAttendanceSummary(attendanceRecords, totalStudents);
  }

  /**
   * Get student attendance report
   */
  async getStudentAttendanceReport(
    studentId: string,
    startDate: string,
    endDate: string,
  ): Promise<StudentAttendanceReportDtoType> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        attendanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        student: { include: { user: true } },
      },
      orderBy: { attendanceDate: 'asc' },
    });

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const excusedDays = records.filter(r => r.status === 'EXCUSED').length;

    const attendancePercentage =
      totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      studentId,
      startDate,
      endDate,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      attendanceRecords: records.map(this.formatAttendanceResponse),
    };
  }

  /**
   * Calculate attendance summary from records
   */
  private calculateAttendanceSummary(
    records: any[],
    totalStudents: number,
  ): AttendanceSummaryDtoType {
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const excusedCount = records.filter(r => r.status === 'EXCUSED').length;
    const unknownCount = totalStudents - records.length;

    const attendancePercentage =
      totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return {
      classId: records[0]?.classId || '',
      attendanceDate:
        records[0]?.attendanceDate?.toISOString().split('T')[0] || '',
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      unknownCount,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
    };
  }

  /**
   * Format attendance record for response
   */
  private formatAttendanceResponse(record: any): AttendanceResponseDtoType {
    return {
      id: record.id,
      studentId: record.studentId,
      classId: record.classId,
      attendanceDate: record.attendanceDate.toISOString().split('T')[0],
      status: record.status,
      remarks: record.remarks,
      additionalMetadata: record.additionalMetadata,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt?.toISOString() || null,
      createdById: record.createdById,
      updatedById: record.updatedById,
      student: record.student
        ? {
            id: record.student.id,
            userId: record.student.userId,
            rollNumber: record.student.rollNumber,
            user: {
              fullName: record.student.user.fullName,
              email: record.student.user.email,
            },
          }
        : undefined,
    };
  }
}
