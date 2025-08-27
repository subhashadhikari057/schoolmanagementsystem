import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class TeacherLeaveRequestAttachmentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  teacherLeaveRequestId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsDateString()
  uploadedAt: string;
}
