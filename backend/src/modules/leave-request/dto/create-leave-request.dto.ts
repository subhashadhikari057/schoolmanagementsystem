import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { LeaveRequestType } from '../enums/leave-request-type.enum';

export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LeaveRequestType)
  type: LeaveRequestType;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsArray()
  @IsOptional()
  attachments?: Express.Multer.File[];
}
