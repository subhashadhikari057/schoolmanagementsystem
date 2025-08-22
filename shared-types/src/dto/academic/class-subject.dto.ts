import { z } from 'zod';

// Base schema for class subject
export const classSubjectBaseSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  teacherId: z.string().uuid('Invalid teacher ID').optional(),
});

// Schema for creating class subject assignment
export const createClassSubjectSchema = classSubjectBaseSchema;

// Schema for updating class subject assignment
export const updateClassSubjectSchema = z.object({
  id: z.string().uuid('Invalid assignment ID'),
}).merge(classSubjectBaseSchema.partial());

// Schema for class subject response with relations
export const classSubjectResponseSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    maxMarks: z.number(),
    passMarks: z.number(),
  }).optional(),
  teacher: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    employeeId: z.string().nullable(),
    designation: z.string(),
    user: z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      email: z.string(),
    }),
  }).nullable().optional(),
});

// Schema for getting class subjects
export const getClassSubjectsSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  includeTeacher: z.boolean().default(true),
  includeSubjectDetails: z.boolean().default(true),
});

// Bulk assignment schema
export const bulkAssignClassSubjectsSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  assignments: z.array(z.object({
    subjectId: z.string().uuid('Invalid subject ID'),
    teacherId: z.string().uuid('Invalid teacher ID').optional(),
  })),
});

// Types
export type ClassSubjectBase = z.infer<typeof classSubjectBaseSchema>;
export type CreateClassSubjectDto = z.infer<typeof createClassSubjectSchema>;
export type UpdateClassSubjectDto = z.infer<typeof updateClassSubjectSchema>;
export type ClassSubjectResponseDto = z.infer<typeof classSubjectResponseSchema>;
export type GetClassSubjectsDto = z.infer<typeof getClassSubjectsSchema>;
export type BulkAssignClassSubjectsDto = z.infer<typeof bulkAssignClassSubjectsSchema>;
