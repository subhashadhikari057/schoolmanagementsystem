/**
 * =============================================================================
 * Auth Schemas Test Suite
 * =============================================================================
 * Comprehensive tests for centralized auth validation schemas.
 * =============================================================================
 */

import {
  LoginRequestSchema,
  LoginUserSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  RequestPasswordResetSchema,
  PasswordResetSchema,
  ChangePasswordSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  MeResponseSchema,
  SessionSchema,
  EmailVerificationSchema,
  PhoneVerificationSchema,
  ResendVerificationSchema,
  LogoutRequestSchema,
  LogoutResponseSchema,
  Enable2FASchema,
  Verify2FASchema,
  Disable2FASchema,
} from '../../../schemas/auth/auth.schemas';
import { UserRole } from '../../../enums/core/user-roles.enum';
import { UserStatus } from '../../../enums/core/user-status.enum';
import { SessionStatus } from '../../../enums/auth/session-status.enum';

describe('Auth Validation Schemas', () => {
  describe('Login Schemas', () => {
    describe('LoginRequestSchema', () => {
      test('should validate login with email', () => {
        const validLogin = {
          identifier: 'test@example.com',
          password: 'password123',
          remember_me: true,
        };

        expect(() => LoginRequestSchema.parse(validLogin)).not.toThrow();
      });

      test('should validate login with phone', () => {
        const validLogin = {
          identifier: '+1234567890',
          password: 'password123',
        };

        expect(() => LoginRequestSchema.parse(validLogin)).not.toThrow();
      });

      test('should apply default for remember_me', () => {
        const loginData = {
          identifier: 'test@example.com',
          password: 'password123',
        };

        const result = LoginRequestSchema.parse(loginData);
        expect(result.remember_me).toBe(false);
      });

      test('should reject invalid identifier', () => {
        const invalidLogins = [
          { identifier: '', password: 'password123' },
          { identifier: 'invalid-identifier', password: 'password123' },
          { identifier: '@invalid.com', password: 'password123' },
          { identifier: '123', password: 'password123' },
        ];

        invalidLogins.forEach(login => {
          expect(() => LoginRequestSchema.parse(login)).toThrow();
        });
      });

      test('should reject empty password', () => {
        const invalidLogin = {
          identifier: 'test@example.com',
          password: '',
        };

        expect(() => LoginRequestSchema.parse(invalidLogin)).toThrow();
      });
    });

    describe('LoginUserSchema', () => {
      test('should validate complete user data', () => {
        const validUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          permissions: ['read:profile', 'write:profile'],
        };

        expect(() => LoginUserSchema.parse(validUser)).not.toThrow();
      });

      test('should validate user without optional fields', () => {
        const minimalUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        };

        expect(() => LoginUserSchema.parse(minimalUser)).not.toThrow();
      });

      test('should reject invalid user data', () => {
        const invalidUsers = [
          { id: 'invalid-uuid', full_name: 'John', email: 'john@example.com', role: UserRole.STUDENT, status: UserStatus.ACTIVE },
          { id: '123e4567-e89b-12d3-a456-426614174000', full_name: '', email: 'john@example.com', role: UserRole.STUDENT, status: UserStatus.ACTIVE },
          { id: '123e4567-e89b-12d3-a456-426614174000', full_name: 'John', email: 'invalid-email', role: UserRole.STUDENT, status: UserStatus.ACTIVE },
          { id: '123e4567-e89b-12d3-a456-426614174000', full_name: 'John', email: 'john@example.com', role: 'INVALID_ROLE', status: UserStatus.ACTIVE },
        ];

        invalidUsers.forEach(user => {
          expect(() => LoginUserSchema.parse(user)).toThrow();
        });
      });
    });

    describe('LoginResponseSchema', () => {
      test('should validate complete login response', () => {
        const validResponse = {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'refresh_token_here',
          expires_in: 3600,
          token_type: 'Bearer',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            full_name: 'John Doe',
            email: 'john@example.com',
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
          },
        };

        expect(() => LoginResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should apply default token_type', () => {
        const responseData = {
          access_token: 'token',
          refresh_token: 'refresh_token',
          expires_in: 3600,
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            full_name: 'John Doe',
            email: 'john@example.com',
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
          },
        };

        const result = LoginResponseSchema.parse(responseData);
        expect(result.token_type).toBe('Bearer');
      });

      test('should reject invalid login response', () => {
        const invalidResponses = [
          { access_token: '', refresh_token: 'refresh', expires_in: 3600, user: {} },
          { access_token: 'token', refresh_token: '', expires_in: 3600, user: {} },
          { access_token: 'token', refresh_token: 'refresh', expires_in: -1, user: {} },
          { access_token: 'token', refresh_token: 'refresh', expires_in: 0, user: {} },
        ];

        invalidResponses.forEach(response => {
          expect(() => LoginResponseSchema.parse(response)).toThrow();
        });
      });
    });
  });

  describe('Registration Schemas', () => {
    describe('RegisterRequestSchema', () => {
      test('should validate student registration', () => {
        const validRegistration = {
          user: {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            password: 'Password123',
          },
          role: UserRole.STUDENT,
          metadata: { source: 'web' },
          terms_accepted: true,
          privacy_accepted: true,
        };

        expect(() => RegisterRequestSchema.parse(validRegistration)).not.toThrow();
      });

      test('should validate parent registration', () => {
        const validRegistration = {
          user: {
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'Password123',
          },
          role: UserRole.PARENT,
          metadata: {},
          terms_accepted: true,
          privacy_accepted: true,
        };

        expect(() => RegisterRequestSchema.parse(validRegistration)).not.toThrow();
      });

      test('should reject non-self-registerable roles', () => {
        const invalidRegistrations = [
          {
            user: { full_name: 'John', email: 'john@example.com', password: 'Password123' },
            role: UserRole.TEACHER,
            terms_accepted: true,
            privacy_accepted: true,
          },
          {
            user: { full_name: 'John', email: 'john@example.com', password: 'Password123' },
            role: UserRole.ADMIN,
            terms_accepted: true,
            privacy_accepted: true,
          },
        ];

        invalidRegistrations.forEach(registration => {
          expect(() => RegisterRequestSchema.parse(registration)).toThrow();
        });
      });

      test('should reject unaccepted terms/privacy', () => {
        const invalidRegistrations = [
          {
            user: { full_name: 'John', email: 'john@example.com', password: 'Password123' },
            role: UserRole.STUDENT,
            terms_accepted: false,
            privacy_accepted: true,
          },
          {
            user: { full_name: 'John', email: 'john@example.com', password: 'Password123' },
            role: UserRole.STUDENT,
            terms_accepted: true,
            privacy_accepted: false,
          },
        ];

        invalidRegistrations.forEach(registration => {
          expect(() => RegisterRequestSchema.parse(registration)).toThrow();
        });
      });
    });

    describe('RegisterResponseSchema', () => {
      test('should validate registration response', () => {
        const validResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: UserRole.STUDENT,
          status: UserStatus.PENDING_VERIFICATION,
          message: 'Registration successful',
          verification_required: true,
        };

        expect(() => RegisterResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should apply default verification_required', () => {
        const responseData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          message: 'Registration successful',
        };

        const result = RegisterResponseSchema.parse(responseData);
        expect(result.verification_required).toBe(true);
      });
    });
  });

  describe('Password Reset Schemas', () => {
    describe('RequestPasswordResetSchema', () => {
      test('should validate password reset request with email', () => {
        const validRequest = {
          identifier: 'test@example.com',
          redirect_url: 'https://example.com/reset',
        };

        expect(() => RequestPasswordResetSchema.parse(validRequest)).not.toThrow();
      });

      test('should validate password reset request with phone', () => {
        const validRequest = {
          identifier: '+1234567890',
        };

        expect(() => RequestPasswordResetSchema.parse(validRequest)).not.toThrow();
      });
    });

    describe('PasswordResetSchema', () => {
      test('should validate password reset with matching passwords', () => {
        const validReset = {
          token: 'reset_token_123',
          new_password: 'NewPassword123',
          confirm_password: 'NewPassword123',
        };

        expect(() => PasswordResetSchema.parse(validReset)).not.toThrow();
      });

      test('should reject mismatched passwords', () => {
        const invalidReset = {
          token: 'reset_token_123',
          new_password: 'NewPassword123',
          confirm_password: 'DifferentPassword123',
        };

        expect(() => PasswordResetSchema.parse(invalidReset)).toThrow();
      });

      test('should reject weak new password', () => {
        const invalidReset = {
          token: 'reset_token_123',
          new_password: 'weak',
          confirm_password: 'weak',
        };

        expect(() => PasswordResetSchema.parse(invalidReset)).toThrow();
      });
    });

    describe('ChangePasswordSchema', () => {
      test('should validate password change with valid data', () => {
        const validChange = {
          current_password: 'OldPassword123',
          new_password: 'NewPassword123',
          confirm_password: 'NewPassword123',
        };

        expect(() => ChangePasswordSchema.parse(validChange)).not.toThrow();
      });

      test('should reject when new password matches current', () => {
        const invalidChange = {
          current_password: 'SamePassword123',
          new_password: 'SamePassword123',
          confirm_password: 'SamePassword123',
        };

        expect(() => ChangePasswordSchema.parse(invalidChange)).toThrow();
      });

      test('should reject mismatched new passwords', () => {
        const invalidChange = {
          current_password: 'OldPassword123',
          new_password: 'NewPassword123',
          confirm_password: 'DifferentPassword123',
        };

        expect(() => ChangePasswordSchema.parse(invalidChange)).toThrow();
      });
    });
  });

  describe('Session Schemas', () => {
    describe('RefreshTokenRequestSchema', () => {
      test('should validate refresh token request', () => {
        const validRequest = {
          refresh_token: 'valid_refresh_token',
        };

        expect(() => RefreshTokenRequestSchema.parse(validRequest)).not.toThrow();
      });

      test('should reject empty refresh token', () => {
        const invalidRequest = {
          refresh_token: '',
        };

        expect(() => RefreshTokenRequestSchema.parse(invalidRequest)).toThrow();
      });
    });

    describe('RefreshTokenResponseSchema', () => {
      test('should validate refresh token response', () => {
        const validResponse = {
          access_token: 'new_access_token',
          expires_in: 3600,
          token_type: 'Bearer',
        };

        expect(() => RefreshTokenResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should apply default token_type', () => {
        const responseData = {
          access_token: 'new_access_token',
          expires_in: 3600,
        };

        const result = RefreshTokenResponseSchema.parse(responseData);
        expect(result.token_type).toBe('Bearer');
      });
    });

    describe('MeResponseSchema', () => {
      test('should validate complete me response', () => {
        const validResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          permissions: ['read:profile'],
          last_login: new Date(),
          profile_complete: true,
        };

        expect(() => MeResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should validate minimal me response', () => {
        const minimalResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        };

        expect(() => MeResponseSchema.parse(minimalResponse)).not.toThrow();
      });

      test('should apply default profile_complete', () => {
        const responseData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        };

        const result = MeResponseSchema.parse(responseData);
        expect(result.profile_complete).toBe(false);
      });
    });

    describe('SessionSchema', () => {
      test('should validate complete session', () => {
        const validSession = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: new Date(),
          updated_at: new Date(),
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          status: SessionStatus.ACTIVE,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          last_activity: new Date(),
          expires_at: new Date(),
          refresh_token_hash: 'hashed_refresh_token',
        };

        expect(() => SessionSchema.parse(validSession)).not.toThrow();
      });

      test('should reject invalid IP address', () => {
        const invalidSession = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: new Date(),
          updated_at: new Date(),
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          status: SessionStatus.ACTIVE,
          ip_address: 'invalid-ip',
          user_agent: 'Mozilla/5.0',
          last_activity: new Date(),
          expires_at: new Date(),
        };

        expect(() => SessionSchema.parse(invalidSession)).toThrow();
      });
    });
  });

  describe('Verification Schemas', () => {
    describe('EmailVerificationSchema', () => {
      test('should validate email verification', () => {
        const validVerification = {
          token: 'verification_token_123',
          email: 'test@example.com',
        };

        expect(() => EmailVerificationSchema.parse(validVerification)).not.toThrow();
      });
    });

    describe('PhoneVerificationSchema', () => {
      test('should validate phone verification', () => {
        const validVerification = {
          token: '123456',
          phone: '+1234567890',
        };

        expect(() => PhoneVerificationSchema.parse(validVerification)).not.toThrow();
      });

      test('should reject invalid token length', () => {
        const invalidVerifications = [
          { token: '123', phone: '+1234567890' },
          { token: '1234567', phone: '+1234567890' },
        ];

        invalidVerifications.forEach(verification => {
          expect(() => PhoneVerificationSchema.parse(verification)).toThrow();
        });
      });
    });

    describe('ResendVerificationSchema', () => {
      test('should validate resend verification request', () => {
        const validRequests = [
          { identifier: 'test@example.com', type: 'email' },
          { identifier: '+1234567890', type: 'phone' },
        ];

        validRequests.forEach(request => {
          expect(() => ResendVerificationSchema.parse(request)).not.toThrow();
        });
      });

      test('should reject invalid type', () => {
        const invalidRequest = {
          identifier: 'test@example.com',
          type: 'invalid',
        };

        expect(() => ResendVerificationSchema.parse(invalidRequest)).toThrow();
      });
    });
  });

  describe('Logout Schemas', () => {
    describe('LogoutRequestSchema', () => {
      test('should validate logout request', () => {
        const validRequest = {
          refresh_token: 'refresh_token',
          logout_all_devices: true,
        };

        expect(() => LogoutRequestSchema.parse(validRequest)).not.toThrow();
      });

      test('should apply defaults', () => {
        const minimalRequest = {};
        const result = LogoutRequestSchema.parse(minimalRequest);
        
        expect(result.logout_all_devices).toBe(false);
      });
    });

    describe('LogoutResponseSchema', () => {
      test('should validate logout response', () => {
        const validResponse = {
          message: 'Logged out successfully',
          logged_out_sessions: 2,
        };

        expect(() => LogoutResponseSchema.parse(validResponse)).not.toThrow();
      });

      test('should reject negative session count', () => {
        const invalidResponse = {
          message: 'Logged out',
          logged_out_sessions: -1,
        };

        expect(() => LogoutResponseSchema.parse(invalidResponse)).toThrow();
      });
    });
  });

  describe('Two-Factor Authentication Schemas', () => {
    describe('Enable2FASchema', () => {
      test('should validate enable 2FA request', () => {
        const validRequest = {
          password: 'Password123',
          backup_codes: ['code1', 'code2', 'code3'],
        };

        expect(() => Enable2FASchema.parse(validRequest)).not.toThrow();
      });

      test('should validate without backup codes', () => {
        const validRequest = {
          password: 'Password123',
        };

        expect(() => Enable2FASchema.parse(validRequest)).not.toThrow();
      });
    });

    describe('Verify2FASchema', () => {
      test('should validate 2FA verification with code', () => {
        const validVerification = {
          code: '123456',
        };

        expect(() => Verify2FASchema.parse(validVerification)).not.toThrow();
      });

      test('should validate 2FA verification with backup code', () => {
        const validVerification = {
          code: '123456',
          backup_code: 'backup123',
        };

        expect(() => Verify2FASchema.parse(validVerification)).not.toThrow();
      });

      test('should reject invalid code length', () => {
        const invalidVerifications = [
          { code: '123' },
          { code: '1234567' },
        ];

        invalidVerifications.forEach(verification => {
          expect(() => Verify2FASchema.parse(verification)).toThrow();
        });
      });
    });

    describe('Disable2FASchema', () => {
      test('should validate disable 2FA request', () => {
        const validRequest = {
          password: 'Password123',
          code: '123456',
        };

        expect(() => Disable2FASchema.parse(validRequest)).not.toThrow();
      });

      test('should validate with backup code', () => {
        const validRequest = {
          password: 'Password123',
          backup_code: 'backup123',
        };

        expect(() => Disable2FASchema.parse(validRequest)).not.toThrow();
      });
    });
  });
});