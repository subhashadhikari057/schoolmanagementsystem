// backend/src/shared/middlewares/__tests__/audit.middleware.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { AuditMiddleware } from '../audit.middleware';
import { EnhancedAuditService } from '../../logger/enhanced-audit.service';
import { AuditAction, AuditModule, AuditStatus, UserRole } from 'shared-types';
import type { AuthenticatedUser } from '../../guards/jwt-auth.guard';

describe('AuditMiddleware', () => {
  let middleware: AuditMiddleware;
  let auditService: jest.Mocked<EnhancedAuditService>;

  beforeEach(async () => {
    const mockAuditService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditMiddleware,
        {
          provide: EnhancedAuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    middleware = module.get<AuditMiddleware>(AuditMiddleware);
    auditService = module.get(EnhancedAuditService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        method: 'POST',
        url: '/api/v1/auth/login',
        user: {
          id: 'user-123',
          role: UserRole.STUDENT,
          email: 'user@example.com',
          sessionId: 'session-123',
          isActive: true,
        },
        traceId: 'trace-123',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
        connection: { remoteAddress: '127.0.0.1' } as any,
        socket: { remoteAddress: '127.0.0.1' } as any,
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      };

      mockResponse = {
        statusCode: 200,
        end: jest.fn(),
      };

      nextFunction = jest.fn();
    });

    it('should set up audit context and call next', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRequest.startTime).toBeDefined();
      expect(mockRequest.auditContext).toEqual({
        userId: 'user-123',
        traceId: 'trace-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/v1/auth/login',
        method: 'POST',
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should audit successful authentication request', done => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      // The middleware has replaced the end function, so call it directly
      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function which should trigger audit
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        expect(auditService.record).toHaveBeenCalledWith(
          AuditAction.CREATE,
          AuditModule.AUTH,
          AuditStatus.SUCCESS,
          expect.objectContaining({
            userId: 'user-123',
            traceId: 'trace-123',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            endpoint: '/api/v1/auth/login',
            method: 'POST',
            statusCode: 200,
            duration: expect.any(Number),
          }),
          expect.objectContaining({
            endpoint: '/api/v1/auth/login',
            method: 'POST',
            statusCode: 200,
            duration: expect.any(Number),
            userAgent: 'Mozilla/5.0',
          }),
        );
        done();
      });
    });

    it('should audit failed request with error status', done => {
      mockResponse.statusCode = 401;

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        setImmediate(() => {
          expect(auditService.record).toHaveBeenCalledWith(
            AuditAction.UNAUTHORIZED_ACCESS,
            AuditModule.AUTH,
            AuditStatus.FAILURE,
            expect.objectContaining({
              statusCode: 401,
            }),
            expect.any(Object),
          );
          done();
        });
      });
    });

    it('should audit admin actions', done => {
      mockRequest.user = {
        id: 'admin-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
        sessionId: 'admin-session-123',
        isActive: true,
      };
      mockRequest.url = '/api/v1/users';
      mockRequest.method = 'GET';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        setImmediate(() => {
          expect(auditService.record).toHaveBeenCalledWith(
            AuditAction.READ,
            AuditModule.USER,
            AuditStatus.SUCCESS,
            expect.objectContaining({
              userId: 'admin-123',
              method: 'GET',
              endpoint: '/api/v1/users',
            }),
            expect.any(Object),
          );
          done();
        });
      });
    });

    it('should not audit health check endpoints', () => {
      mockRequest.url = '/health';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        // Should not call audit service for health checks
        expect(auditService.record).not.toHaveBeenCalled();
      });
    });

    it('should handle missing user gracefully', done => {
      mockRequest.user = undefined;

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        setImmediate(() => {
          expect(auditService.record).toHaveBeenCalledWith(
            AuditAction.CREATE,
            AuditModule.AUTH,
            AuditStatus.SUCCESS,
            expect.objectContaining({
              userId: undefined,
            }),
            expect.any(Object),
          );
          done();
        });
      });
    });

    it('should handle audit service errors gracefully', done => {
      auditService.record.mockRejectedValue(new Error('Audit service error'));

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      const wrappedEnd = mockResponse.end as any;

      // Call the wrapped end function
      wrappedEnd();

      // Allow async audit to complete
      setImmediate(() => {
        setImmediate(() => {
          // Should not throw even if audit fails
          expect(auditService.record).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        connection: { remoteAddress: '127.0.0.1' } as any,
        socket: { remoteAddress: '127.0.0.1' } as any,
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
        connection: { remoteAddress: '127.0.0.1' } as any,
        socket: { remoteAddress: '127.0.0.1' } as any,
      } as unknown as Request;

      const ip = (middleware as any).getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from connection.remoteAddress', () => {
      const mockRequest = {
        headers: {},
        connection: {
          remoteAddress: '192.168.1.3',
        },
        socket: {},
      } as Request;

      const ip = (middleware as any).getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.3');
    });

    it('should return unknown if no IP found', () => {
      const mockRequest = {
        headers: {},
        connection: {} as any,
        socket: {} as any,
      } as Request;

      const ip = (middleware as any).getClientIp(mockRequest);
      expect(ip).toBe('unknown');
    });
  });
});
