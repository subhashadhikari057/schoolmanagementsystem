import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from '../application/attendance.service';
import { ClassTeacherService } from '../application/class-teacher.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/decorators/roles.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import {
  MarkAttendanceRequestDtoType,
  GetAttendanceQueryDtoType,
  UpdateAttendanceDtoType,
} from '@sms/shared-types';

@Controller('api/v1/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly classTeacherService: ClassTeacherService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mark attendance for a class
   * Only class teacher or admin can mark attendance
   */
  @Post('mark')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async markAttendance(
    @Body() data: MarkAttendanceRequestDtoType,
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher
    if (req.user.role === 'TEACHER') {
      const isClassTeacher = await this.classTeacherService.isClassTeacher(
        req.user.teacherId,
        data.class_id,
      );

      if (!isClassTeacher) {
        throw new ForbiddenException(
          'Only class teacher can mark attendance for their class',
        );
      }
    }

    return this.attendanceService.markAttendance(data, req.user.id);
  }

  /**
   * Mark today's attendance for a class
   * Only class teacher or admin can mark attendance
   */
  @Post('mark/today')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async markTodayAttendance(
    @Body() data: { class_id: string; entries: any[] },
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher
    if (req.user.role === 'TEACHER') {
      const isClassTeacher = await this.classTeacherService.isClassTeacher(
        req.user.teacherId,
        data.class_id,
      );

      if (!isClassTeacher) {
        throw new ForbiddenException(
          'Only class teacher can mark attendance for their class',
        );
      }
    }

    // Add today's date to the request
    const todayData: MarkAttendanceRequestDtoType = {
      ...data,
      date: new Date(),
    };

    return this.attendanceService.markAttendance(todayData, req.user.id);
  }

  /**
   * Bulk update attendance records
   * Only class teacher or admin can update attendance
   */
  @Patch('bulk-update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async bulkUpdateAttendance(
    @Body()
    data: {
      updates: Array<{ attendance_id: string; status: any; remarks: string }>;
    },
    @Req() req: any,
  ) {
    const results: any[] = [];

    for (const update of data.updates) {
      try {
        const result = await this.attendanceService.updateAttendance(
          update.attendance_id,
          {
            status: update.status,
            remarks: update.remarks,
          },
          req.user.id,
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          attendance_id: update.attendance_id,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: 'Bulk update completed',
      results,
    };
  }

  /**
   * Get attendance records
   * Teachers can only view their class attendance
   * Admin can view all attendance
   * Students can only view their own attendance
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT)
  async getAttendance(
    @Query() query: GetAttendanceQueryDtoType,
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher if class_id is provided
    if (req.user.role === 'TEACHER') {
      // If no class_id is provided, get the teacher's class teacher class
      if (!query.class_id) {
        const teacherClass =
          await this.classTeacherService.getClassTeacherClass(
            req.user.teacherId,
          );
        if (teacherClass) {
          query.class_id = teacherClass.id;
        } else {
          throw new ForbiddenException(
            'You are not assigned as a class teacher to any class',
          );
        }
      } else {
        // Verify the teacher is the class teacher for the provided class_id
        const isClassTeacher = await this.classTeacherService.isClassTeacher(
          req.user.teacherId,
          query.class_id,
        );

        if (!isClassTeacher) {
          throw new ForbiddenException(
            'Teachers can only view attendance for their own class',
          );
        }
      }
    }

    // If student, they can only view their own attendance
    if (req.user.role === 'STUDENT') {
      if (query.student_id && query.student_id !== req.user.studentId) {
        throw new ForbiddenException(
          'Students can only view their own attendance',
        );
      }
      query.student_id = req.user.studentId;
    }

    return this.attendanceService.getAttendance(query);
  }

  /**
   * Get attendance summary for a class
   * Only accessible by class teacher and admin
   */
  @Get('summary/class/:classId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getClassSummary(
    @Query('date') date: string,
    @Query('classId') classId: string,
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher
    if (req.user.role === 'TEACHER') {
      const isClassTeacher = await this.classTeacherService.isClassTeacher(
        req.user.teacherId,
        classId,
      );

      if (!isClassTeacher) {
        throw new ForbiddenException(
          'Only class teacher can view attendance summary for their class',
        );
      }
    }

    return this.attendanceService.getClassAttendanceSummary(classId, date);
  }

  /**
   * Get attendance summary for a student
   * Accessible by admin, class teacher, and the student themselves
   */
  @Get('summary/student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT)
  async getStudentSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('studentId') studentId: string,
    @Req() req: any,
  ) {
    // If student, they can only view their own summary
    if (req.user.role === 'STUDENT' && studentId !== req.user.studentId) {
      throw new ForbiddenException(
        'Students can only view their own attendance summary',
      );
    }

    // If teacher, verify they are the class teacher of the student
    if (req.user.role === 'TEACHER') {
      const isStudentInClass =
        await this.classTeacherService.isStudentInTeacherClass(
          req.user.teacherId,
          studentId,
        );

      if (!isStudentInClass) {
        throw new ForbiddenException(
          'Teachers can only view attendance summary for students in their class',
        );
      }
    }

    return this.attendanceService.getStudentAttendanceSummary(
      studentId,
      startDate,
      endDate,
    );
  }

  /**
   * Update attendance for a single student
   * Only class teacher or admin can update attendance
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async updateAttendance(
    @Param('id') id: string,
    @Body() data: UpdateAttendanceDtoType,
    @Req() req: any,
  ) {
    console.log('Update attendance request:', {
      id,
      data,
      userId: req.user.id,
    });

    try {
      // First, find the attendance record
      const record = await this.prisma.attendanceRecord.findUnique({
        where: { id },
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
          class: true,
        },
      });

      console.log('Found attendance record:', record);

      if (!record) {
        console.log('Attendance record not found for ID:', id);
        throw new NotFoundException('Attendance record not found');
      }

      // Check if record is deleted
      if (record.deletedAt !== null) {
        console.log('Attendance record is deleted:', record.deletedAt);
        throw new NotFoundException('Attendance record has been deleted');
      }

      // If teacher, verify they are the class teacher of the student
      if (req.user.role === 'TEACHER') {
        const isClassTeacher = await this.classTeacherService.isClassTeacher(
          req.user.teacherId,
          record.classId,
        );

        console.log('Is class teacher:', isClassTeacher);

        if (!isClassTeacher) {
          throw new ForbiddenException(
            'Only class teacher can update attendance for their class',
          );
        }
      }

      // Validate required fields
      if (!data.status) {
        throw new BadRequestException('Status is required');
      }

      if (!data.remarks || data.remarks.trim() === '') {
        throw new BadRequestException(
          'Remarks are required when updating attendance',
        );
      }

      // Update the record
      const updated = await this.prisma.attendanceRecord.update({
        where: { id },
        data: {
          status: data.status === 'present' ? 'PRESENT' : 'ABSENT',
          remarks: data.remarks.trim(),
          updatedById: req.user.id,
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
        },
      });

      console.log('Updated attendance record:', updated);

      // Log audit
      await this.auditService.log({
        action: 'UPDATE_ATTENDANCE',
        module: 'ATTENDANCE',
        userId: req.user.id,
        details: {
          attendanceId: id,
          oldStatus: record.status,
          newStatus: data.status,
          remarks: data.remarks,
          studentName: record.student.user.fullName,
          className:
            record.class.name ||
            `Grade ${record.class.grade} Section ${record.class.section}`,
        },
      });

      return {
        success: true,
        message: 'Attendance updated successfully',
        data: {
          id: updated.id,
          student_id: updated.studentId,
          class_id: updated.classId,
          date: updated.date,
          status: updated.status.toLowerCase(),
          remarks: updated.remarks,
          created_at: updated.createdAt,
          updated_at: updated.updatedAt,
          created_by: updated.createdById,
          updated_by: updated.updatedById,
          student_name: updated.student.user.fullName,
          student_email: updated.student.user.email,
        },
      };
    } catch (error) {
      console.error('Error updating attendance:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new Error('Failed to update attendance. Please try again.');
    }
  }

  /**
   * Get attendance records for a specific class and date
   * Only accessible by class teacher and admin
   */
  @Get('class/:classId/date/:date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getAttendanceForClassAndDate(
    @Param('classId') classId: string,
    @Param('date') date: string,
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher
    if (req.user.role === 'TEACHER') {
      const isClassTeacher = await this.classTeacherService.isClassTeacher(
        req.user.teacherId,
        classId,
      );

      if (!isClassTeacher) {
        throw new ForbiddenException(
          'Only class teacher can view attendance for their class',
        );
      }
    }

    return this.attendanceService.getAttendanceForClassAndDate(classId, date);
  }

  /**
   * Get attendance statistics for a class over a date range
   * Only accessible by class teacher and admin
   */
  @Get('stats/class/:classId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getClassAttendanceStats(
    @Param('classId') classId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    // If teacher, verify they are the class teacher
    if (req.user.role === 'TEACHER') {
      const isClassTeacher = await this.classTeacherService.isClassTeacher(
        req.user.teacherId,
        classId,
      );

      if (!isClassTeacher) {
        throw new ForbiddenException(
          'Only class teacher can view attendance statistics for their class',
        );
      }
    }

    return this.attendanceService.getClassAttendanceStats(
      classId,
      startDate,
      endDate,
    );
  }

  /**
   * Get attendance statistics for a student over a date range
   * Accessible by admin, class teacher, and the student themselves
   */
  @Get('stats/student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT)
  async getStudentAttendanceStats(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    // If student, they can only view their own statistics
    if (req.user.role === 'STUDENT' && studentId !== req.user.studentId) {
      throw new ForbiddenException(
        'Students can only view their own attendance statistics',
      );
    }

    // If teacher, verify they are the class teacher of the student
    if (req.user.role === 'TEACHER') {
      const isStudentInClass =
        await this.classTeacherService.isStudentInTeacherClass(
          req.user.teacherId,
          studentId,
        );

      if (!isStudentInClass) {
        throw new ForbiddenException(
          'Teachers can only view attendance statistics for students in their class',
        );
      }
    }

    return this.attendanceService.getStudentAttendanceStats(
      studentId,
      startDate,
      endDate,
    );
  }

  /**
   * Get attendance records for a specific student
   * Accessible by admin, class teacher, and the student themselves
   */
  @Get('student/:studentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT)
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // If student, they can only view their own attendance
    if (req.user.role === 'STUDENT' && studentId !== req.user.studentId) {
      throw new ForbiddenException(
        'Students can only view their own attendance',
      );
    }

    // If teacher, verify they are the class teacher of the student
    if (req.user.role === 'TEACHER') {
      const isStudentInClass =
        await this.classTeacherService.isStudentInTeacherClass(
          req.user.teacherId,
          studentId,
        );

      if (!isStudentInClass) {
        throw new ForbiddenException(
          'Teachers can only view attendance for students in their class',
        );
      }
    }

    return this.attendanceService.getStudentAttendance(
      studentId,
      startDate,
      endDate,
    );
  }

  /**
   * Delete attendance record (soft delete)
   * Only admin can delete attendance records
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteAttendance(@Param('id') id: string, @Req() req: any) {
    await this.attendanceService.deleteAttendance(id, req.user.id);

    return {
      success: true,
      message: 'Attendance record deleted successfully',
    };
  }

  /**
   * Debug endpoint to check attendance records
   * Accessible by admin and teachers for debugging purposes
   */
  @Get('debug/records')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async debugAttendanceRecords(
    @Query('classId') classId: string,
    @Query('date') date: string,
    @Req() req: any,
  ) {
    console.log('Debug attendance records request:', {
      classId,
      date,
      userId: req.user.id,
    });

    try {
      // Test date parsing
      const parsedDate = new Date(date);
      console.log(
        'Parsed date:',
        parsedDate,
        'isValid:',
        !isNaN(parsedDate.getTime()),
      );

      // Find records
      const records = await this.prisma.attendanceRecord.findMany({
        where: {
          classId,
          date: parsedDate,
          deletedAt: null,
        },
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        date: date,
        parsedDate: parsedDate,
        isValidDate: !isNaN(parsedDate.getTime()),
        recordCount: records.length,
        records: records,
      };
    } catch (error) {
      console.error('Debug attendance records error:', error);
      return {
        success: false,
        error: error.message,
        date: date,
      };
    }
  }
}
