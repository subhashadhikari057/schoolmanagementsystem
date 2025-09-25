import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTeacherLeaveRequestByAdminDto {
  @IsUUID('4', { message: 'Teacher ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Teacher ID is required' })
  teacherId: string;

  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsUUID('4', { message: 'Leave type ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Leave type ID is required' })
  leaveTypeId: string;

  @IsDateString(
    {},
    { message: 'Start date must be a valid date in YYYY-MM-DD format' },
  )
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsDateString(
    {},
    { message: 'End date must be a valid date in YYYY-MM-DD format' },
  )
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber({}, { message: 'Days must be a number' })
  @Min(1, { message: 'Days must be at least 1' })
  @Max(365, { message: 'Days cannot exceed 365' })
  @IsNotEmpty({ message: 'Days is required' })
  days: number;

  @IsString({ message: 'Admin creation reason must be a string' })
  @IsNotEmpty({ message: 'Admin creation reason is required' })
  @MaxLength(500, {
    message: 'Admin creation reason cannot exceed 500 characters',
  })
  adminCreationReason: string;

  @IsOptional()
  attachments?: Express.Multer.File[];
}
