/**
 * =============================================================================
 * Staff Attendance DTOs
 * =============================================================================
 * Data Transfer Objects for staff attendance operations
 * =============================================================================
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class StaffAttendanceRecord {
  @IsString()
  staffId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkStaffAttendanceDto {
  @IsDateString()
  date: string;

  @IsString()
  sessionType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAttendanceRecord)
  staff: StaffAttendanceRecord[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetStaffAttendanceQueryDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class StaffForAttendanceDto {
  id: string;
  name: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  status?: AttendanceStatus;
  lastAttendance?: string;
  hasUserAccount: boolean; // Indicates if staff has login access
}

export class StaffAttendanceSessionResponseDto {
  sessionId: string;
  date: string;
  sessionType: string;
  isCompleted: boolean;
  markedAt: string;
  markedBy: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  staff: StaffForAttendanceDto[];
}

export class StaffAttendanceStatsDto {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export class StaffAttendanceResponseDto {
  staffId: string;
  staffName: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  hasUserAccount: boolean;
  stats: StaffAttendanceStatsDto;
  records: {
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    sessionType: string;
  }[];
}
