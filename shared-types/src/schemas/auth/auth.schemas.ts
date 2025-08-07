/**
 * =============================================================================
 * Auth Validation Schemas
 * =============================================================================
 * Centralized Zod schemas for authentication and authorization.
 * =============================================================================
 */

import { z } from 'zod';
import { CommonValidation, BaseEntitySchema, MetadataSchema } from '../common/base.schemas';
import { UserRole } from '../../enums/core/user-roles.enum';
import { SessionStatus } from '../../enums/auth/session-status.enum';
import { UserStatus } from '../../enums/core/user-status.enum';

/**
 * =============================================================================
 * LOGIN SCHEMAS
 * =============================================================================
 */

/**
 * Email or phone identifier validation
 */
const identifierSchema = z.string()
  .min(1, 'Email or phone is required')
  .refine(
    (value) => {
      // Check if it's a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Check if it's a valid phone number (must be at least 10 digits total)
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    'Must be a valid email address or phone number'
  );

/**
 * Login request schema
 */
export const LoginRequestSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

/**
 * Login user schema (user data in login response)
 */
export const LoginUserSchema = z.object({
  id: CommonValidation.uuid,
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  permissions: z.array(z.string()).optional(),
});

/**
 * Login response schema
 */
export const LoginResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  refresh_token: z.string().min(1, 'Refresh token is required'),
  expires_in: z.number().int().positive('Expires in must be positive'),
  token_type: z.string().default('Bearer'),
  user: LoginUserSchema,
});

/**
 * =============================================================================
 * REGISTRATION SCHEMAS
 * =============================================================================
 */

/**
 * User registration schema
 */
export const RegisterUserSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
});

/**
 * Registration request schema
 */
export const RegisterRequestSchema = z.object({
  user: RegisterUserSchema,
  role: z.enum([UserRole.STUDENT, UserRole.PARENT], {
    errorMap: () => ({ message: 'Only student and parent roles can self-register' }),
  }),
  metadata: MetadataSchema,
  terms_accepted: z.boolean().refine(val => val === true, 'Terms and conditions must be accepted'),
  privacy_accepted: z.boolean().refine(val => val === true, 'Privacy policy must be accepted'),
});

/**
 * Registration response schema
 */
export const RegisterResponseSchema = z.object({
  id: CommonValidation.uuid,
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  message: z.string(),
  verification_required: z.boolean().default(true),
});

/**
 * =============================================================================
 * PASSWORD RESET SCHEMAS
 * =============================================================================
 */

/**
 * Password reset request schema
 */
export const RequestPasswordResetSchema = z.object({
  identifier: identifierSchema,
  redirect_url: CommonValidation.url.optional(),
});

/**
 * Password reset confirmation schema
 */
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: CommonValidation.password,
  confirm_password: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }
);

/**
 * Change password schema (for authenticated users)
 */
export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: CommonValidation.password,
  confirm_password: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }
).refine(
  (data) => data.current_password !== data.new_password,
  {
    message: 'New password must be different from current password',
    path: ['new_password'],
  }
);

/**
 * =============================================================================
 * SESSION SCHEMAS
 * =============================================================================
 */

/**
 * Refresh token request schema
 */
export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

/**
 * Refresh token response schema
 */
export const RefreshTokenResponseSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  expires_in: z.number().int().positive('Expires in must be positive'),
  token_type: z.string().default('Bearer'),
});

/**
 * Current user response schema (/me endpoint)
 */
export const MeResponseSchema = z.object({
  id: CommonValidation.uuid,
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  permissions: z.array(z.string()).optional(),
  last_login: z.date().optional(),
  profile_complete: z.boolean().default(false),
});

/**
 * Session information schema
 */
export const SessionSchema = BaseEntitySchema.extend({
  user_id: CommonValidation.uuid,
  status: z.nativeEnum(SessionStatus),
  ip_address: z.string().ip('Invalid IP address'),
  user_agent: z.string().max(500, 'User agent too long'),
  last_activity: z.date(),
  expires_at: z.date(),
  refresh_token_hash: z.string().optional(),
});

/**
 * =============================================================================
 * VERIFICATION SCHEMAS
 * =============================================================================
 */

/**
 * Email verification schema
 */
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: CommonValidation.email,
});

/**
 * Phone verification schema
 */
export const PhoneVerificationSchema = z.object({
  token: z.string().length(6, 'Verification code must be 6 digits'),
  phone: CommonValidation.phone,
});

/**
 * Resend verification schema
 */
export const ResendVerificationSchema = z.object({
  identifier: identifierSchema,
  type: z.enum(['email', 'phone']),
});

/**
 * =============================================================================
 * LOGOUT SCHEMAS
 * =============================================================================
 */

/**
 * Logout request schema
 */
export const LogoutRequestSchema = z.object({
  refresh_token: z.string().optional(),
  logout_all_devices: z.boolean().default(false),
});

/**
 * Logout response schema
 */
export const LogoutResponseSchema = z.object({
  message: z.string(),
  logged_out_sessions: z.number().int().min(0),
});

/**
 * =============================================================================
 * FORCE PASSWORD CHANGE SCHEMAS
 * =============================================================================
 */

/**
 * Force password change schema (when user must change password)
 */
export const ForceChangePasswordSchema = z.object({
  temp_token: z.string().min(1, 'Temporary token is required'),
  new_password: CommonValidation.password,
  confirm_password: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }
);

/**
 * =============================================================================
 * TWO-FACTOR AUTHENTICATION SCHEMAS
 * =============================================================================
 */

/**
 * Enable 2FA schema
 */
export const Enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  backup_codes: z.array(z.string()).optional(),
});

/**
 * Verify 2FA schema
 */
export const Verify2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
  backup_code: z.string().optional(),
});

/**
 * Disable 2FA schema
 */
export const Disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, '2FA code must be 6 digits').optional(),
  backup_code: z.string().optional(),
});

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

// Login types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Registration types
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// Password reset types
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;
export type PasswordReset = z.infer<typeof PasswordResetSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ForceChangePassword = z.infer<typeof ForceChangePasswordSchema>;

// Session types
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type Session = z.infer<typeof SessionSchema>;

// Verification types
export type EmailVerification = z.infer<typeof EmailVerificationSchema>;
export type PhoneVerification = z.infer<typeof PhoneVerificationSchema>;
export type ResendVerification = z.infer<typeof ResendVerificationSchema>;

// Logout types
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// 2FA types
export type Enable2FA = z.infer<typeof Enable2FASchema>;
export type Verify2FA = z.infer<typeof Verify2FASchema>;
export type Disable2FA = z.infer<typeof Disable2FASchema>;