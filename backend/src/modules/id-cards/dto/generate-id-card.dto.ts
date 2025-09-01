import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class GenerateIndividualIDCardDto {
  @IsUUID()
  personId: string;

  @IsString()
  personType: 'student' | 'teacher' | 'staff';

  @IsUUID()
  templateId: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateBulkIDCardsDto {
  @IsString()
  type: 'class' | 'all-teachers' | 'all-staff';

  @IsOptional()
  @IsUUID()
  classId?: string; // Required when type is 'class'

  @IsUUID()
  templateId: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface IDCardGenerationResult {
  id: string;
  personId: string;
  personName: string;
  templateName: string;
  pdfUrl: string;
  qrCode: string;
  expiryDate: string;
  generatedAt: string;
}

export interface BulkIDCardGenerationResult {
  successful: IDCardGenerationResult[];
  failed: Array<{
    personId: string;
    personName: string;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}
