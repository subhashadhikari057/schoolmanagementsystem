import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TeacherLeaveRequestStatus } from '../enums/teacher-leave-request-status.enum';

export class AdminLeaveRequestActionDto {
  @IsEnum(TeacherLeaveRequestStatus)
  status: TeacherLeaveRequestStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
