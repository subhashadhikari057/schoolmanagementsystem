import { z } from 'zod';
import { CommonValidation } from '../common/base.schemas';

// Email or phone identifier validation (copied from auth.schemas.ts)
const identifierSchema = z
  .string()
  .min(1, "Email or phone is required")
  .refine((value) => {
    // Check if it's a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's a valid phone number (must be at least 10 digits total)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  }, "Must be a valid email address or phone number");

/**
 * =============================================================================
 * OTP Schemas for Forgot Password Flow
 * =============================================================================
 */

/**
 * Request OTP for password reset
 */
export const RequestOtpSchema = z.object({
  identifier: identifierSchema,
  delivery_method: z.enum(['email', 'sms']).default('email'),
});

/**
 * Verify OTP and get reset token
 */
export const VerifyOtpSchema = z.object({
  identifier: identifierSchema,
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

/**
 * Reset password with verified token
 */
export const ResetPasswordWithOtpSchema = z
  .object({
    reset_token: z.string().min(1, 'Reset token is required'),
    new_password: CommonValidation.password,
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

/**
 * =============================================================================
 * Type Exports
 * =============================================================================
 */

export type RequestOtp = z.infer<typeof RequestOtpSchema>;
export type VerifyOtp = z.infer<typeof VerifyOtpSchema>;
export type ResetPasswordWithOtp = z.infer<typeof ResetPasswordWithOtpSchema>;
