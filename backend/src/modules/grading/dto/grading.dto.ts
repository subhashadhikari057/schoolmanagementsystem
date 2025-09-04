import { z } from 'zod';

// Define the enum locally since it's new
export enum ExamResultStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
}

// Base validation schemas
export const GradeDefinitionSchema = z.object({
  grade: z.string().min(1, 'Grade is required'),
  minMarks: z.number().min(0, 'Min marks cannot be negative'),
  maxMarks: z.number().min(0, 'Max marks cannot be negative'),
  gradePoint: z.number().min(0).max(10).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const CreateGradingScaleDto = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  name: z.string().min(1, 'Grading scale name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  gradeDefinitions: z
    .array(GradeDefinitionSchema)
    .min(1, 'At least one grade definition is required'),
});

export const UpdateGradingScaleDto = CreateGradingScaleDto.partial();

// Grid Grading DTOs
export const GridGradeEntryDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  marksObtained: z.number().min(0).optional(),
  gradeId: z.string().uuid().optional(),
  remarks: z.string().optional(),
  isAbsent: z.boolean().default(false),
  modificationReason: z.string().optional(),
});

export const BulkGridGradingDto = z.object({
  classId: z.string().uuid('Invalid class ID'),
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  grades: z
    .array(GridGradeEntryDto)
    .min(1, 'At least one grade entry is required'),
});

export const GetGridGradingDataDto = z.object({
  classId: z.string().uuid('Invalid class ID'),
  examScheduleId: z.string().uuid('Invalid exam schedule ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
});

// Individual result DTOs (existing)
export const CreateExamResultDto = z.object({
  examSlotId: z.string().uuid('Invalid exam slot ID'),
  studentId: z.string().uuid('Invalid student ID'),
  marksObtained: z.number().min(0).optional(),
  gradeId: z.string().uuid().optional(),
  remarks: z.string().optional(),
  isAbsent: z.boolean().default(false),
});

export const UpdateExamResultDto = z.object({
  marksObtained: z.number().min(0).optional(),
  gradeId: z.string().uuid().optional(),
  remarks: z.string().optional(),
  isAbsent: z.boolean().optional(),
  modificationReason: z.string().min(1, 'Modification reason is required'),
});

export const BulkGradeStudentsDto = z.object({
  examSlotId: z.string().uuid('Invalid exam slot ID'),
  results: z
    .array(
      z.object({
        studentId: z.string().uuid('Invalid student ID'),
        marksObtained: z.number().min(0).optional(),
        gradeId: z.string().uuid().optional(),
        remarks: z.string().optional(),
        isAbsent: z.boolean().default(false),
      }),
    )
    .min(1, 'At least one result is required'),
});

// Query DTOs
export const GetClassGradingDto = z.object({
  classId: z.string().uuid('Invalid class ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  examScheduleId: z.string().uuid().optional(),
});

export const GetSubjectGradingDto = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  classIds: z.array(z.string().uuid()).optional(),
});

export const PublishResultsDto = z.object({
  calendarEntryId: z.string().uuid('Invalid calendar entry ID'),
  publishRemarks: z.string().optional(),
});

export const GradingPermissionDto = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  classId: z.string().uuid('Invalid class ID'),
  canGrade: z.boolean().default(true),
  canModify: z.boolean().default(true),
});

// Grade History DTOs
export const GetStudentGradeHistoryDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  academicYear: z.string().optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  examType: z.string().optional(),
});

// Response DTOs
export interface GradeDefinitionResponseDto {
  id: string;
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoint?: number;
  description?: string;
  color?: string;
}

export interface GradingScaleResponseDto {
  id: string;
  academicYear: string;
  name: string;
  description?: string;
  isDefault: boolean;
  gradeDefinitions: GradeDefinitionResponseDto[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExamResultResponseDto {
  id: string;
  examSlotId: string;
  studentId: string;
  marksObtained?: number;
  grade?: GradeDefinitionResponseDto;
  remarks?: string;
  isAbsent: boolean;
  isPassed: boolean;
  status: ExamResultStatus;
  gradedAt?: Date;
  gradedBy?: {
    id: string;
    fullName: string;
  };
  lastModifiedAt?: Date;
  lastModifiedBy?: {
    id: string;
    fullName: string;
  };
  modificationHistory?: any;
  student: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
    };
  };
  examSlot: {
    id: string;
    subject?: {
      id: string;
      name: string;
      code: string;
      maxMarks: number;
      passMarks: number;
    };
    dateslot: {
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  };
}

// Grid Grading Response DTOs
export interface GridGradingStudentDto {
  id: string;
  rollNumber: string;
  user: {
    fullName: string;
  };
  subjects: {
    [subjectId: string]: {
      examSlotId: string;
      marksObtained?: number;
      maxMarks: number;
      passMarks: number;
      grade?: GradeDefinitionResponseDto;
      remarks?: string;
      isAbsent: boolean;
      isPassed: boolean;
      status: ExamResultStatus;
      resultId?: string;
      gradedAt?: Date;
      gradedBy?: {
        id: string;
        fullName: string;
      };
    };
  };
}

export interface GridGradingDataResponseDto {
  class: {
    id: string;
    grade: number;
    section: string;
  };
  examSchedule: {
    id: string;
    name: string;
    academicYear: string;
  };
  calendarEntry: {
    id: string;
    name: string;
    examType: string;
    startDate: Date;
    endDate: Date;
  };
  subjects: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    examSlot: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  }[];
  students: GridGradingStudentDto[];
  gradingScale?: GradingScaleResponseDto;
  statistics: {
    totalStudents: number;
    totalSubjects: number;
    gradedEntries: number;
    pendingEntries: number;
    absentEntries: number;
  };
}

export interface StudentGradeHistoryDto {
  id: string;
  studentId: string;
  examResultId: string;
  classId: string;
  subjectId: string;
  examSlotId: string;
  academicYear: string;
  examType: string;
  examName: string;
  examDate: Date;
  marksObtained?: number;
  maxMarks: number;
  passMarks: number;
  percentage?: number;
  gradeObtained?: string;
  gradePoint?: number;
  isPassed: boolean;
  isAbsent: boolean;
  remarks?: string;
  gradedAt?: Date;
  gradedBy?: {
    id: string;
    fullName: string;
  };
  class: {
    grade: number;
    section: string;
  };
  subject: {
    name: string;
    code: string;
  };
}

export interface ClassGradingDataResponseDto {
  class: {
    id: string;
    grade: number;
    section: string;
  };
  examSchedule: {
    id: string;
    name: string;
    academicYear: string;
  };
  subjects: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    examSlot?: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  }[];
  students: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
    };
    results: ExamResultResponseDto[];
  }[];
  gradingScale?: GradingScaleResponseDto;
}

export interface SubjectGradingDataResponseDto {
  subject: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
  };
  classes: {
    id: string;
    grade: number;
    section: string;
    examSlot?: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
    students: {
      id: string;
      rollNumber: string;
      user: {
        fullName: string;
      };
      result?: ExamResultResponseDto;
    }[];
  }[];
  gradingScale?: GradingScaleResponseDto;
}

// Type exports
export type CreateGradingScaleDtoType = z.infer<typeof CreateGradingScaleDto>;
export type UpdateGradingScaleDtoType = z.infer<typeof UpdateGradingScaleDto>;
export type CreateExamResultDtoType = z.infer<typeof CreateExamResultDto>;
export type UpdateExamResultDtoType = z.infer<typeof UpdateExamResultDto>;
export type BulkGradeStudentsDtoType = z.infer<typeof BulkGradeStudentsDto>;
export type GridGradeEntryDtoType = z.infer<typeof GridGradeEntryDto>;
export type BulkGridGradingDtoType = z.infer<typeof BulkGridGradingDto>;
export type GetGridGradingDataDtoType = z.infer<typeof GetGridGradingDataDto>;
export type GetClassGradingDtoType = z.infer<typeof GetClassGradingDto>;
export type GetSubjectGradingDtoType = z.infer<typeof GetSubjectGradingDto>;
export type PublishResultsDtoType = z.infer<typeof PublishResultsDto>;
export type GradingPermissionDtoType = z.infer<typeof GradingPermissionDto>;
export type GetStudentGradeHistoryDtoType = z.infer<
  typeof GetStudentGradeHistoryDto
>;
