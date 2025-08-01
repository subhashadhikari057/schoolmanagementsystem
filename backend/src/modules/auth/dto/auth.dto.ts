import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * 📥 Schema for login credentials
 */
export const LoginSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email('Email format is invalid'),

  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }).min(8, 'Password must be at least 8 characters'),
});

export class LoginDto extends createZodDto(LoginSchema) {}

// Types for service use
export type LoginDtoType = z.infer<typeof LoginSchema>;

/**
 * 📥 Schema for force password change
 */
export const ForceChangePasswordSchema = z.object({
  tempToken: z.string({
    required_error: 'Temp token is required',
    invalid_type_error: 'Temp token must be a string',
  }).min(1, 'Temp token cannot be empty'),

  newPassword: z.string({
    required_error: 'New password is required',
    invalid_type_error: 'New password must be a string',
  })
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),

  confirmPassword: z.string({
    required_error: 'Confirm password is required',
    invalid_type_error: 'Confirm password must be a string',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export class ForceChangePasswordDto extends createZodDto(ForceChangePasswordSchema) {}

// Types for service use
export type ForceChangePasswordDtoType = z.infer<typeof ForceChangePasswordSchema>;
