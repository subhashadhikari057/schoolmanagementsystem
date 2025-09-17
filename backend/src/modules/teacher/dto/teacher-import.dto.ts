import { z } from 'zod';

/**
 * Schema for validating teacher import Excel rows
 */
export const TeacherImportRowSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  employeeId: z.string().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  experienceYears: z
    .string()
    .regex(/^\d+$/, 'Experience years must be a number')
    .optional(),
  highestQualification: z.string().min(1, 'Highest qualification is required'),
  specialization: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  basicSalary: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Basic salary must be a number')
    .optional(),
  allowances: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Allowances must be a number')
    .optional(),
  totalSalary: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Total salary must be a number')
    .optional(),
  // Bank Account Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  // Additional fields
  citizenshipNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  // Assignment fields
  subjects: z.string().optional(), // Comma-separated subject codes
  classes: z.string().optional(), // Comma-separated class sections (e.g., "10-A,11-B")
});

export type TeacherImportRow = z.infer<typeof TeacherImportRowSchema>;
