/**
 * =============================================================================
 * Login DTOs Tests
 * =============================================================================
 * Comprehensive test suite for login-related DTOs and validation schemas.
 * =============================================================================
 */

import {
  LoginRequestSchema,
  LoginUserSchema,
  LoginResponseSchema,
  type LoginRequestDto,
  type LoginUserDto,
  type LoginResponseDto,
} from '../../../dto/auth/login.dto';
import { UserRole } from '../../../enums/core/user-roles.enum';

describe('Login DTOs', () => {
  describe('LoginRequestSchema', () => {
    const validLoginData = {
      identifier: 'user@example.com',
      password: 'Password123',
    };

    test('should validate correct login request with email', () => {
      const result = LoginRequestSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLoginData);
      }
    });

    test('should validate correct login request with phone', () => {
      const phoneData = {
        identifier: '+1234567890',
        password: 'Password123',
      };
      const result = LoginRequestSchema.safeParse(phoneData);
      expect(result.success).toBe(true);
    });

    test('should reject empty identifier', () => {
      const invalidData = {
        identifier: '',
        password: 'Password123',
      };
      const result = LoginRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid identifier format', () => {
      const invalidData = {
        identifier: 'invalid-format',
        password: 'Password123',
      };
      const result = LoginRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject short password', () => {
      const invalidData = {
        identifier: 'user@example.com',
        password: '123',
      };
      const result = LoginRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject missing fields', () => {
      const incompleteData = {
        identifier: 'user@example.com',
      };
      const result = LoginRequestSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginUserSchema', () => {
    const validUserData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'John Doe',
      role: UserRole.STUDENT,
    };

    test('should validate correct user data', () => {
      const result = LoginUserSchema.safeParse(validUserData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUserData);
      }
    });

    test('should reject invalid UUID', () => {
      const invalidData = {
        ...validUserData,
        id: 'invalid-uuid',
      };
      const result = LoginUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid role', () => {
      const invalidData = {
        ...validUserData,
        role: 'invalid_role',
      };
      const result = LoginUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject empty name', () => {
      const invalidData = {
        ...validUserData,
        full_name: '',
      };
      const result = LoginUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginResponseSchema', () => {
    const validResponseData = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expires_in: 900,
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'John Doe',
        role: UserRole.STUDENT,
      },
    };

    test('should validate correct login response', () => {
      const result = LoginResponseSchema.safeParse(validResponseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validResponseData);
      }
    });

    test('should reject missing access token', () => {
      const invalidData = {
        ...validResponseData,
        access_token: '',
      };
      const result = LoginResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject negative expires_in', () => {
      const invalidData = {
        ...validResponseData,
        expires_in: -1,
      };
      const result = LoginResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid user data', () => {
      const invalidData = {
        ...validResponseData,
        user: {
          id: 'invalid-uuid',
          full_name: '',
          role: 'invalid_role',
        },
      };
      const result = LoginResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Interfaces', () => {
    test('LoginRequestDto should match expected structure', () => {
      const loginRequest: LoginRequestDto = {
        identifier: 'user@example.com',
        password: 'Password123',
      };

      expect(typeof loginRequest.identifier).toBe('string');
      expect(typeof loginRequest.password).toBe('string');
    });

    test('LoginUserDto should match expected structure', () => {
      const loginUser: LoginUserDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'John Doe',
        role: UserRole.STUDENT,
      };

      expect(typeof loginUser.id).toBe('string');
      expect(typeof loginUser.full_name).toBe('string');
      expect(Object.values(UserRole)).toContain(loginUser.role);
    });

    test('LoginResponseDto should match expected structure', () => {
      const loginResponse: LoginResponseDto = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 900,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          full_name: 'John Doe',
          role: UserRole.STUDENT,
        },
      };

      expect(typeof loginResponse.access_token).toBe('string');
      expect(typeof loginResponse.refresh_token).toBe('string');
      expect(typeof loginResponse.expires_in).toBe('number');
      expect(typeof loginResponse.user).toBe('object');
    });
  });
});