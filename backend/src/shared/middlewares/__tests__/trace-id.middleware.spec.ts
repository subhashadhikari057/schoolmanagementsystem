// backend/src/shared/middlewares/__tests__/trace-id.middleware.spec.ts

import { TraceIdMiddleware } from '../trace-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('TraceIdMiddleware', () => {
  let middleware: TraceIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new TraceIdMiddleware();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should add trace ID to request object', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const traceId = (mockRequest as any).traceId as string;
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId.length).toBeGreaterThan(0);
    });

    it('should add trace ID to response headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Trace-ID',
        expect.any(String),
      );
    });

    it('should generate valid UUID format trace ID', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const traceId = (mockRequest as any).traceId as string;

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(traceId).toMatch(uuidRegex);
    });

    it('should call next middleware', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should generate unique trace IDs for different requests', () => {
      const request1 = { headers: {} };
      const request2 = { headers: {} };
      const response1 = { setHeader: jest.fn() } as Partial<Response>;
      const response2 = { setHeader: jest.fn() } as Partial<Response>;

      middleware.use(request1 as Request, response1 as Response, mockNext);
      middleware.use(request2 as Request, response2 as Response, mockNext);

      const traceId1 = (request1 as any).traceId;
      const traceId2 = (request2 as any).traceId;

      expect(traceId1).toBeDefined();
      expect(traceId2).toBeDefined();
      expect(traceId1).not.toBe(traceId2);
    });

    it('should set the same trace ID in request and response header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const requestTraceId = (mockRequest as any).traceId as string;

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Trace-ID',
        requestTraceId,
      );
    });

    it('should handle multiple calls without interference', () => {
      // First call
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      const firstTraceId = (mockRequest as any).traceId as string;

      // Reset mocks
      jest.clearAllMocks();

      // Second call with same objects (simulating middleware reuse)
      const newRequest = { headers: {} };
      const newResponse = { setHeader: jest.fn() } as Partial<Response>;

      middleware.use(newRequest as Request, newResponse as Response, mockNext);
      const secondTraceId = (newRequest as any).traceId as string;

      expect(firstTraceId).toBeDefined();
      expect(secondTraceId).toBeDefined();
      expect(firstTraceId).not.toBe(secondTraceId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
