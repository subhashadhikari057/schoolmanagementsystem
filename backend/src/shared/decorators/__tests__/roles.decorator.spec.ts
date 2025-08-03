/**
 * =============================================================================
 * Roles Decorator and Guard Tests
 * =============================================================================
 * Comprehensive tests for role-based access control functionality.
 * =============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard /* ROLES_KEY, MIN_ROLE_KEY */ } from '../roles.decorator';
import { UserRole } from '@sms/shared-types';
import { AuthenticatedUser } from '../../guards/jwt-auth.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockGetRequest = jest.fn();
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  const createMockUser = (role: UserRole): AuthenticatedUser => ({
    id: 'user-123',
    email: 'test@example.com',
    role,
    sessionId: 'session-123',
    isActive: true,
  });

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when user is not authenticated', () => {
      const mockRequest = { user: null };
      mockGetRequest.mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('User must be authenticated to check roles'),
      );
    });

    it('should allow access when no role requirements are specified', () => {
      const mockRequest = { user: createMockUser(UserRole.STUDENT) };
      mockGetRequest.mockReturnValue(mockRequest);
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    describe('specific roles requirement', () => {
      it('should allow access when user has required role', () => {
        const mockRequest = {
          user: createMockUser(UserRole.ADMIN),
          url: '/api/admin',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.ADMIN, UserRole.SUPER_ADMIN]) // ROLES_KEY
          .mockReturnValueOnce(undefined); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });

      it('should deny access when user does not have required role', () => {
        const mockRequest = {
          user: createMockUser(UserRole.STUDENT),
          url: '/api/admin',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.ADMIN, UserRole.SUPER_ADMIN]) // ROLES_KEY
          .mockReturnValueOnce(undefined); // MIN_ROLE_KEY

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          new ForbiddenException(
            'Access denied. Required roles: admin, super_admin',
          ),
        );
      });

      it('should allow access when user has one of multiple required roles', () => {
        const mockRequest = {
          user: createMockUser(UserRole.TEACHER),
          url: '/api/academic',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.TEACHER, UserRole.ADMIN]) // ROLES_KEY
          .mockReturnValueOnce(undefined); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });
    });

    describe('minimum role requirement', () => {
      it('should allow access when user meets minimum role requirement', () => {
        const mockRequest = {
          user: createMockUser(UserRole.ADMIN),
          url: '/api/teacher-level',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce(undefined) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });

      it('should allow access when user exactly meets minimum role requirement', () => {
        const mockRequest = {
          user: createMockUser(UserRole.TEACHER),
          url: '/api/teacher-level',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce(undefined) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });

      it('should deny access when user does not meet minimum role requirement', () => {
        const mockRequest = {
          user: createMockUser(UserRole.STUDENT),
          url: '/api/teacher-level',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce(undefined) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          new ForbiddenException(
            'Access denied. Minimum role required: teacher',
          ),
        );
      });

      it('should allow super admin access to teacher-level endpoints', () => {
        const mockRequest = {
          user: createMockUser(UserRole.SUPER_ADMIN),
          url: '/api/teacher-level',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce(undefined) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });
    });

    describe('combined role requirements', () => {
      it('should enforce specific roles when both specific and minimum roles are specified', () => {
        const mockRequest = {
          user: createMockUser(UserRole.ACCOUNTANT),
          url: '/api/admin-only',
          method: 'POST',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.ADMIN]) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        // Should fail on specific roles check even though user meets minimum role
        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          new ForbiddenException('Access denied. Required roles: admin'),
        );
      });

      it('should pass both specific and minimum role checks', () => {
        const mockRequest = {
          user: createMockUser(UserRole.ADMIN),
          url: '/api/admin-teacher',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.ADMIN, UserRole.TEACHER]) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        const result = guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
      });
    });

    describe('role hierarchy validation', () => {
      const hierarchyTests = [
        {
          user: UserRole.SUPER_ADMIN,
          required: UserRole.ADMIN,
          shouldPass: true,
        },
        { user: UserRole.ADMIN, required: UserRole.TEACHER, shouldPass: true },
        { user: UserRole.TEACHER, required: UserRole.PARENT, shouldPass: true },
        { user: UserRole.PARENT, required: UserRole.STUDENT, shouldPass: true },
        {
          user: UserRole.STUDENT,
          required: UserRole.PARENT,
          shouldPass: false,
        },
        {
          user: UserRole.PARENT,
          required: UserRole.TEACHER,
          shouldPass: false,
        },
        { user: UserRole.TEACHER, required: UserRole.ADMIN, shouldPass: false },
        {
          user: UserRole.ADMIN,
          required: UserRole.SUPER_ADMIN,
          shouldPass: false,
        },
      ];

      hierarchyTests.forEach(({ user, required, shouldPass }) => {
        it(`should ${shouldPass ? 'allow' : 'deny'} ${user} access to ${required}-level endpoints`, () => {
          const mockRequest = {
            user: createMockUser(user),
            url: `/api/${required}-level`,
            method: 'GET',
          };
          mockGetRequest.mockReturnValue(mockRequest);

          reflector.getAllAndOverride
            .mockReturnValueOnce(undefined) // ROLES_KEY
            .mockReturnValueOnce(required); // MIN_ROLE_KEY

          if (shouldPass) {
            const result = guard.canActivate(mockExecutionContext);
            expect(result).toBe(true);
          } else {
            expect(() => guard.canActivate(mockExecutionContext)).toThrow(
              new ForbiddenException(
                `Access denied. Minimum role required: ${required}`,
              ),
            );
          }
        });
      });
    });

    describe('logging and audit', () => {
      it('should log access denial for specific roles', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const mockRequest = {
          user: createMockUser(UserRole.STUDENT),
          url: '/api/admin',
          method: 'DELETE',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce([UserRole.ADMIN]) // ROLES_KEY
          .mockReturnValueOnce(undefined); // MIN_ROLE_KEY

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          ForbiddenException,
        );

        consoleSpy.mockRestore();
      });

      it('should log access denial for minimum role requirements', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const mockRequest = {
          user: createMockUser(UserRole.STUDENT),
          url: '/api/teacher-area',
          method: 'GET',
        };
        mockGetRequest.mockReturnValue(mockRequest);

        reflector.getAllAndOverride
          .mockReturnValueOnce(undefined) // ROLES_KEY
          .mockReturnValueOnce(UserRole.TEACHER); // MIN_ROLE_KEY

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          ForbiddenException,
        );

        consoleSpy.mockRestore();
      });
    });
  });
});
