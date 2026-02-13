import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { LeaveCreditSource } from '../enums/leave-credit-source.enum';

export class CreateTeacherLeaveCreditDto {
  @IsUUID()
  teacherId: string;

  @IsUUID()
  leaveTypeId: string;

  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @IsOptional()
  @IsEnum(LeaveCreditSource)
  source?: LeaveCreditSource;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
