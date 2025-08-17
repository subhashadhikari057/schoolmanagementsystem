import {
  IsString,
  IsOptional,
  IsDate,
  IsObject,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsObject()
  @IsOptional()
  additionalMetadata?: Record<string, any>;
}

export class UpdateAssignmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsObject()
  @IsOptional()
  additionalMetadata?: Record<string, any>;
}

export class AssignmentFiltersDto {
  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
