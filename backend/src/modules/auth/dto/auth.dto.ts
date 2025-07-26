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
