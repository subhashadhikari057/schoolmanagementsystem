import { z } from 'zod';

/**
 * Schema for validating staff import CSV rows - SIMPLIFIED (Mandatory fields only)
 */
export const StaffImportRowSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  emergencyContact: z.string().optional(),
  basicSalary: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Basic salary must be a number')
    .optional(),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
});

export type StaffImportRow = z.infer<typeof StaffImportRowSchema>;
