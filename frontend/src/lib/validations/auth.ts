import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().default(false),
});

// Forgot password form validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Set password form validation schema
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Verify OTP form validation schema
export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .min(1, 'OTP is required')
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Simple flexible schema with all optional fields
export const flexibleFormSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  rememberMe: z.boolean().default(false),
  otp: z.string().optional(),
});

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type FlexibleFormData = z.infer<typeof flexibleFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Change password form validation schema
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })
  .refine(data => data.current_password !== data.new_password, {
    message: 'New password must be different from the current one',
    path: ['new_password'],
  });
