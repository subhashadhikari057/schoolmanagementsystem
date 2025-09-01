import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PersonType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  STAFF = 'staff',
}

export class PersonSearchDto {
  @IsEnum(PersonType)
  type: PersonType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface PersonSearchResult {
  id: string;
  name: string;
  type: PersonType;
  info: string; // Class/Department/Position info
  rollNumber?: string; // For students
  employeeId?: string; // For teachers/staff
  email?: string;
  avatar?: string;
}

export interface PersonSearchResponse {
  persons: PersonSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
