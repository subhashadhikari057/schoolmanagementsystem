/**
 * =============================================================================
 * Session Validation Middleware Tests
 * =============================================================================
 * Comprehensive tests for session validation middleware functionality.
 * =============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionValidationMiddleware } from '../session-validation.middleware';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../logger/audit.service';
import { AuthenticatedUser } from '../../guards/jwt-auth.guard';
import { UserRole } from '@sms/shared-types';

describe('SessionValidationMiddleware', () => {
  let middleware: SessionValidationMiddleware;
  let prismaService: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.TEACHER,
    sessionId: 'session-123',
    isActive: true,
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    revokedAt: null,
    lastActivityAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Test',
  };

  const mockRequest = {
    user: mockUser,
    ip: '127.0.0.1',
    url: '/api/test',
    method: 'GET',
    headers: { 'user-agent': 'Mozilla/5.0 Test' },
    get: jest.fn().mockReturnValue('Mozilla/5.0 Test'),
    connection: { remoteAddress: '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;

  const mockResponse = {} as Response;
  const mockNext = jest.fn() as NextFunction;

  beforeEach(async () => {
    const mockPrismaService = {
      userSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const mockAuditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SessionValidationMiddleware,
          useFactory: (prisma: PrismaService, audit: AuditService) => {
            return new SessionValidationMiddleware(prisma, audit);
          },
          inject: [PrismaService, AuditService],
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    middleware = module.get<SessionValidationMiddleware>(
      SessionValidationMiddleware,
    );
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);

    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should skip validation for requests without user', async () => {
      const requestWithoutUser = {
        ...mockRequest,
        user: null,
      } as any as Request;

      await middleware.use(requestWithoutUser, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(prismaService.userSession.findUnique).not.toHaveBeenCalled();
    });

    it('should validate session successfully', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (prismaService.userSession.update as jest.Mock).mockResolvedValue(
        mockSession,
      );

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(prismaService.userSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent session', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(new UnauthorizedException('Session not found'));

      expect(auditService.record).toHaveBeenCalledWith({
        action: 'SESSION_SECURITY_VIOLATION',
        status: 'FAIL',
        module: 'AUTH',
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test',
        details: {
          reason: 'Session not found',
          endpoint: '/api/test',
          method: 'GET',
          sessionId: 'session-123',
        },
      });
    });

    it('should throw UnauthorizedException for revoked session', async () => {
      const revokedSession = {
        ...mockSession,
        revokedAt: new Date(),
      };
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        revokedSession,
      );

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(new UnauthorizedException('Session has been revoked'));

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            reason: 'Session has been revoked',
          }),
        }),
      );
    });

    it('should handle expired session due to inactivity', async () => {
      const expiredSession = {
        ...mockSession,
        lastActivityAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      };
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        expiredSession,
      );
      (prismaService.userSession.update as jest.Mock).mockResolvedValue(
        expiredSession,
      );

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(
        new UnauthorizedException('Session expired due to inactivity'),
      );

      // Should revoke the session
      expect(prismaService.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          revokedAt: expect.any(Date),
          revokeReason: 'Session expired due to inactivity',
        },
      });
    });

    it('should update last activity timestamp', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (prismaService.userSession.update as jest.Mock).mockResolvedValue(
        mockSession,
      );

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(prismaService.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          lastActivityAt: expect.any(Date),
          ipAddress: '127.0.0.1',
        },
      });
    });

    it('should handle IP address validation when enabled', async () => {
      const middlewareWithIpValidation = new SessionValidationMiddleware(
        prismaService,
        auditService,
        { validateIpAddress: true },
      );

      const sessionWithDifferentIp = {
        ...mockSession,
        ipAddress: '192.168.1.1',
      };
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        sessionWithDifferentIp,
      );
      (prismaService.userSession.update as jest.Mock).mockResolvedValue(
        sessionWithDifferentIp,
      );

      await expect(
        middlewareWithIpValidation.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Session security violation: IP address mismatch',
        ),
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            reason: 'Session security violation: IP address mismatch',
          }),
        }),
      );
    });

    it('should log warning for user agent mismatch but not block', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const sessionWithDifferentUserAgent = {
        ...mockSession,
        userAgent: 'Different User Agent',
      };
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        sessionWithDifferentUserAgent,
      );
      (prismaService.userSession.update as jest.Mock).mockResolvedValue(
        sessionWithDifferentUserAgent,
      );

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle session validation errors gracefully', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(new UnauthorizedException('Session validation failed'));
    });

    it('should handle activity update errors gracefully', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (prismaService.userSession.update as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );

      // Should not throw error, just log it
      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle audit service errors gracefully', async () => {
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      auditService.record.mockRejectedValue(new Error('Audit failed'));

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(new UnauthorizedException('Session not found'));

      // Should not throw additional error for audit failure
    });
  });

  describe('configuration options', () => {
    it('should respect custom maxIdleTime configuration', async () => {
      const customMiddleware = new SessionValidationMiddleware(
        prismaService,
        auditService,
        { maxIdleTime: 10 }, // 10 minutes
      );

      const sessionWithOldActivity = {
        ...mockSession,
        lastActivityAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      };
      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        sessionWithOldActivity,
      );

      await expect(
        customMiddleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(
        new UnauthorizedException('Session expired due to inactivity'),
      );
    });

    it('should respect updateLastActivity configuration', async () => {
      const middlewareNoUpdate = new SessionValidationMiddleware(
        prismaService,
        auditService,
        { updateLastActivity: false },
      );

      (prismaService.userSession.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );

      await middlewareNoUpdate.use(mockRequest, mockResponse, mockNext);

      expect(prismaService.userSession.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = {
        headers: { 'x-real-ip': '192.168.1.2' },
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from connection.remoteAddress', () => {
      const request = {
        headers: {},
        connection: { remoteAddress: '192.168.1.3' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(request);
      expect(ip).toBe('192.168.1.3');
    });

    it('should return unknown when no IP found', () => {
      const request = {
        headers: {},
        connection: {},
        socket: {},
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(request);
      expect(ip).toBe('unknown');
    });
  });
});
