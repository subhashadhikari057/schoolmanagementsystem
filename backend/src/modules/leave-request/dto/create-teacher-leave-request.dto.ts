import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTeacherLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @IsArray()
  @IsOptional()
  attachments?: Express.Multer.File[];
}
