import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AttendanceService } from '../application/attendance.service';

// DTOs
import {
  MarkAttendanceDto,
  MarkAttendanceDtoType,
  BulkMarkAttendanceDto,
  BulkMarkAttendanceDtoType,
  UpdateAttendanceDto,
  UpdateAttendanceDtoType,
  AttendanceQueryDto,
  AttendanceQueryDtoType,
  ClassAttendanceQueryDto,
  ClassAttendanceQueryDtoType,
} from '../dto/attendance.dto';

@Controller('api/v1/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // 🔹 Mark attendance for a single student
  @Post('mark')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async markAttendance(
    @Body(new ZodValidationPipe(MarkAttendanceDto))
    body: MarkAttendanceDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.attendanceService.markAttendance(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Attendance marked successfully',
      attendance: result,
    };
  }

  // 🔹 Mark attendance for multiple students in bulk
  @Post('mark-bulk')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async bulkMarkAttendance(
    @Body(new ZodValidationPipe(BulkMarkAttendanceDto))
    body: BulkMarkAttendanceDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.attendanceService.bulkMarkAttendance(
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: result.message,
      recordsCreated: result.recordsCreated,
      attendance: result.attendance,
    };
  }

  // 🔹 Update existing attendance record
  @Patch(':id')
  @Roles(UserRole.TEACHER)
  async updateAttendance(
    @Param('id') attendanceId: string,
    @Body(new ZodValidationPipe(UpdateAttendanceDto))
    body: UpdateAttendanceDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.attendanceService.updateAttendance(
      attendanceId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    return {
      message: 'Attendance updated successfully',
      attendance: result,
    };
  }

  // 🔹 Get attendance records with filtering
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getAttendanceRecords(
    @Query(new ZodValidationPipe(AttendanceQueryDto))
    query: AttendanceQueryDtoType,
  ) {
    return this.attendanceService.getAttendanceRecords(query);
  }

  // 🔹 Get attendance for a specific class and date
  @Get('class')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getClassAttendance(
    @Query(new ZodValidationPipe(ClassAttendanceQueryDto))
    query: ClassAttendanceQueryDtoType,
  ) {
    return this.attendanceService.getClassAttendance(query);
  }

  // 🔹 Get attendance summary for a class and date
  @Get('summary/:classId/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getAttendanceSummary(
    @Param('classId') classId: string,
    @Param('date') attendanceDate: string,
  ) {
    return this.attendanceService.getAttendanceSummary(classId, attendanceDate);
  }

  // 🔹 Get student attendance report
  @Get('report/student/:studentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  async getStudentAttendanceReport(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    // TODO: Add permission validation for parent/student access to their own data only
    return this.attendanceService.getStudentAttendanceReport(
      studentId,
      startDate,
      endDate,
    );
  }

  // 🔹 Get my class attendance (for teachers)
  @Get('my-class/:classId/:date')
  @Roles(UserRole.TEACHER)
  async getMyClassAttendance(
    @Param('classId') classId: string,
    @Param('date') attendanceDate: string,
    @CurrentUser() user: any,
  ) {
    // The service will validate that the teacher is assigned to this class
    return this.attendanceService.getClassAttendance({
      classId,
      attendanceDate,
    });
  }

  // 🔹 Get my attendance (for students)
  @Get('me')
  @Roles(UserRole.STUDENT)
  async getMyAttendance(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // TODO: Get student ID from user and validate dates
    // For now, return placeholder - needs student service integration
    return {
      message: 'Student attendance endpoint - needs implementation',
      userId: user.id,
      startDate,
      endDate,
    };
  }

  // 🔹 Get my children's attendance (for parents)
  @Get('my-children')
  @Roles(UserRole.PARENT)
  async getMyChildrenAttendance(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // TODO: Get children IDs from user and return their attendance
    // For now, return placeholder - needs student service integration
    return {
      message: 'Parent children attendance endpoint - needs implementation',
      userId: user.id,
      startDate,
      endDate,
    };
  }
}
