import { z } from 'zod';
import { DisabilityType, MotherTongue } from '@prisma/client';

// Schema for a single student import row
export const StudentImportRowSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  studentIemisCode: z.string().min(1, 'Student IEMIS code is required'),
  classGrade: z
    .number()
    .min(1, 'Class grade must be at least 1')
    .max(12, 'Class grade cannot exceed 12'),
  classSection: z.string().min(1, 'Class section is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  motherTongue: z.nativeEnum(MotherTongue).optional(),
  disabilityType: z.nativeEnum(DisabilityType).optional(),
  address: z.string().optional(),
  // Parent information
  primaryParentName: z.string().min(1, 'Primary parent name is required'),
  primaryParentPhone: z.string().min(1, 'Primary parent phone is required'),
  primaryParentEmail: z.string().email('Invalid primary parent email format'),
  primaryParentRelation: z
    .string()
    .min(1, 'Primary parent relation is required'),
  secondaryParentName: z.string().optional(),
  secondaryParentPhone: z.string().optional(),
  secondaryParentEmail: z
    .string()
    .email('Invalid secondary parent email format')
    .optional(),
  secondaryParentRelation: z.string().optional(),
});

// Schema for bulk import request
export const StudentBulkImportSchema = z.object({
  students: z
    .array(StudentImportRowSchema)
    .min(1, 'At least one student is required'),
  skipDuplicates: z.boolean().default(false),
  updateExisting: z.boolean().default(false),
});

// Response schema for import results
export const StudentImportResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  totalProcessed: z.number(),
  successfulImports: z.number(),
  failedImports: z.number(),
  errors: z
    .array(
      z.object({
        row: z.number(),
        student: z.string(),
        error: z.string(),
      }),
    )
    .optional(),
  importedStudents: z
    .array(
      z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
        rollNumber: z.string(),
        className: z.string(),
      }),
    )
    .optional(),
});

// Type exports
export type StudentImportRow = z.infer<typeof StudentImportRowSchema>;
export type StudentBulkImport = z.infer<typeof StudentBulkImportSchema>;
export type StudentImportResult = z.infer<typeof StudentImportResultSchema>;
