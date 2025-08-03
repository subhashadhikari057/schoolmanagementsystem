import { z } from 'zod';

/**
 * 📥 Create Admin DTO Schema
 */
export const CreateAdminSchema = z.object({
  fullName: z.string({
    required_error: 'Full name is required',
    invalid_type_error: 'Full name must be a string',
  }).min(2, 'Full name must be at least 2 characters'),

  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email('Invalid email format'),

  phone: z.string().min(8).max(15).optional(),

  password: z
    .string({
      invalid_type_error: 'Password must be a string',
    })
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

/**
 * 🛠 Update Admin DTO Schema
 */
export const UpdateAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(8).max(15).optional(),
});

// ✅ Export types for use in service layer
export type CreateAdminDtoType = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminDtoType = z.infer<typeof UpdateAdminSchema>;
