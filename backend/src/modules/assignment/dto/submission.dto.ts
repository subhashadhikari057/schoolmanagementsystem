import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsUUID,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  assignmentId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  submittedAt?: Date;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean = false;

  @IsString()
  @IsOptional()
  feedback?: string; // Teacher's grading remarks

  @IsString()
  @IsOptional()
  studentNotes?: string; // Student's submission comments

  @IsArray()
  @IsOptional()
  fileLinks?: string[];
}

export class UpdateSubmissionDto {
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsString()
  @IsOptional()
  feedback?: string; // Teacher's grading remarks

  @IsString()
  @IsOptional()
  studentNotes?: string; // Student's submission comments

  @IsArray()
  @IsOptional()
  fileLinks?: string[];
}
