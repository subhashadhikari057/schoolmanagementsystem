import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { TeacherLeaveRequestType } from '../enums/teacher-leave-request-type.enum';

export class CreateTeacherLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TeacherLeaveRequestType)
  type: TeacherLeaveRequestType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @IsArray()
  @IsOptional()
  attachments?: Express.Multer.File[];
}
