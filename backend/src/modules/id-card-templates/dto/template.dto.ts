import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum IDCardTemplateType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
  STAFF_NO_LOGIN = 'STAFF_NO_LOGIN',
}

export enum TemplateOrientation {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

export enum TemplateFieldType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  QR_CODE = 'QR_CODE',
  BARCODE = 'BARCODE',
  LOGO = 'LOGO',
  PHOTO = 'PHOTO',
  DATE = 'DATE',
  TIME = 'TIME',
  SIGNATURE = 'SIGNATURE',
}

export enum TextAlignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
  JUSTIFY = 'JUSTIFY',
}

export class CreateTemplateFieldDto {
  @IsEnum(TemplateFieldType)
  fieldType: TemplateFieldType;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  databaseField?: string;

  @IsNumber()
  @Min(0)
  x: number;

  @IsNumber()
  @Min(0)
  y: number;

  @IsNumber()
  @Min(1)
  width: number;

  @IsNumber()
  @Min(1)
  height: number;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(72)
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  fontWeight?: string;

  @IsOptional()
  @IsEnum(TextAlignment)
  textAlign?: TextAlignment;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  borderWidth?: number;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  borderRadius?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  opacity?: number;

  @IsOptional()
  @IsNumber()
  zIndex?: number;

  @IsOptional()
  @IsString()
  dataSource?: string; // 'static' | 'database'

  @IsOptional()
  @IsString()
  staticText?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  qrData?: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsEnum(IDCardTemplateType)
  type: IDCardTemplateType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  dimensions: string;

  @IsOptional()
  @IsNumber()
  customWidth?: number;

  @IsOptional()
  @IsNumber()
  customHeight?: number;

  @IsOptional()
  @IsEnum(TemplateOrientation)
  orientation?: TemplateOrientation;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  borderWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  borderRadius?: number;

  @IsOptional()
  @IsBoolean()
  logoRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  photoRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  qrCodeRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  barcodeRequired?: boolean;

  @IsOptional()
  @IsString()
  watermark?: string;

  @IsOptional()
  @IsNumber()
  printMargin?: number;

  @IsOptional()
  @IsNumber()
  bleedArea?: number;

  @IsOptional()
  @IsNumber()
  safeArea?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  fields?: CreateTemplateFieldDto[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(IDCardTemplateType)
  type?: IDCardTemplateType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsNumber()
  customWidth?: number;

  @IsOptional()
  @IsNumber()
  customHeight?: number;

  @IsOptional()
  @IsEnum(TemplateOrientation)
  orientation?: TemplateOrientation;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  borderWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  borderRadius?: number;

  @IsOptional()
  @IsBoolean()
  logoRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  photoRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  qrCodeRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  barcodeRequired?: boolean;

  @IsOptional()
  @IsString()
  watermark?: string;

  @IsOptional()
  @IsNumber()
  printMargin?: number;

  @IsOptional()
  @IsNumber()
  bleedArea?: number;

  @IsOptional()
  @IsNumber()
  safeArea?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  fields?: CreateTemplateFieldDto[];
}

export class TemplateFilterDto {
  @IsOptional()
  @IsEnum(IDCardTemplateType)
  type?: IDCardTemplateType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TemplateOrientation)
  orientation?: TemplateOrientation;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt', 'usageCount'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
