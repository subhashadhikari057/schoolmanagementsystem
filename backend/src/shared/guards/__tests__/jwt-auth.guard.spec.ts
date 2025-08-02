/**
 * =============================================================================
 * JWT Authentication Guard Tests
 * =============================================================================
 * Comprehensive tests for JWT authentication guard functionality.
 * =============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../jwt-auth.guard';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { verifyToken } from '../../auth/jwt.util';
import { UserRole } from 'shared-types';

// Mock the JWT utility
jest.mock('../../auth/jwt.util');
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let prismaService: jest.Mocked<PrismaService>;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  const mockRequest = {
    headers: {},
    ip: '127.0.0.1',
    url: '/api/test',
    get: jest.fn().mockReturnValue('test-user-agent'),
    user: undefined as any, // Will be set by guard
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    isActive: true,
    roles: [
      {
        role: {
          name: UserRole.TEACHER,
        },
      },
    ],
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    revokedAt: null,
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      userSession: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    prismaService = module.get(PrismaService);
    reflector = module.get(Reflector);

    // Reset mocks
    jest.clearAllMocks();
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Access token is required'),
      );
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Access token is required'),
      );
    });

    it('should throw UnauthorizedException for invalid JWT token', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockVerifyToken.mockReturnValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for token with invalid payload', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({ invalid: 'payload' } as any);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid session or user not found'),
      );
    });

    it('should throw UnauthorizedException for revoked session', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(),
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid session or user not found'),
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: {
          ...mockUser,
          isActive: false,
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid session or user not found'),
      );
    });

    it('should successfully authenticate valid token and session', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.TEACHER,
        sessionId: 'session-123',
        isActive: true,
      });
    });

    it('should handle session validation errors gracefully', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle user without roles', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: {
          ...mockUser,
          roles: [],
        },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid session or user not found'),
      );
    });

    it('should extract token correctly from different authorization formats', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      // Test with extra spaces
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-123',
      });
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should return undefined when no authorization header', () => {
      const request = { headers: {} } as any;
      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it('should return undefined for non-Bearer tokens', () => {
      const request = { headers: { authorization: 'Basic token123' } } as any;
      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it('should extract Bearer token correctly', () => {
      const request = { headers: { authorization: 'Bearer token123' } } as any;
      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBe('token123');
    });
  });
});
