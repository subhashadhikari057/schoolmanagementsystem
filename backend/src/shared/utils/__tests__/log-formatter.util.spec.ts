/**
 * =============================================================================
 * Log Formatter Utility Tests - School Management System
 * =============================================================================
 * Comprehensive tests for log formatting, parsing, and analysis utilities
 * =============================================================================
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import {
  LogFormatter,
  ParsedLogEntry,
  LogAnalytics,
} from '../log-formatter.util';

// Mock file system operations
jest.mock('fs');

const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockedWriteFileSync = writeFileSync as jest.MockedFunction<
  typeof writeFileSync
>;

describe('LogFormatter', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('parseLogFile', () => {
    it('should throw error for non-existent file', () => {
      mockedExistsSync.mockReturnValue(false);

      expect(() => LogFormatter.parseLogFile('nonexistent.log')).toThrow(
        'Log file not found: nonexistent.log',
      );
    });

    it('should parse JSON log entries correctly', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(
        '{"timestamp":"2023-01-01T10:00:00.000Z","level":"INFO","context":"APP","message":"Application started"}\n' +
          '{"timestamp":"2023-01-01T10:01:00.000Z","level":"ERROR","context":"DB","message":"Connection failed","userId":"user123","traceId":"trace456"}',
      );

      const entries = LogFormatter.parseLogFile('test.log');

      expect(entries).toHaveLength(2);

      expect(entries[0]).toEqual({
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Application started',
        metadata: {},
        traceId: undefined,
        userId: undefined,
        requestId: undefined,
        duration: undefined,
      });

      expect(entries[1]).toEqual({
        timestamp: new Date('2023-01-01T10:01:00.000Z'),
        level: 'ERROR',
        context: 'DB',
        message: 'Connection failed',
        metadata: {},
        traceId: 'trace456',
        userId: 'user123',
        requestId: undefined,
        duration: undefined,
      });
    });

    it('should parse standard log format entries', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(
        '2023-01-01T10:00:00.000Z [INFO] [APP] Application started\n' +
          '2023-01-01T10:01:00.000Z [ERROR] [DATABASE] Connection timeout',
      );

      const entries = LogFormatter.parseLogFile('test.log');

      expect(entries).toHaveLength(2);
      expect(entries[0].level).toBe('INFO');
      expect(entries[0].context).toBe('APP');
      expect(entries[0].message).toBe('Application started');
    });

    it('should skip malformed log lines', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(
        '{"timestamp":"2023-01-01T10:00:00.000Z","level":"INFO","context":"APP","message":"Valid entry"}\n' +
          'This is not a valid JSON or standard format\n' +
          '2023-01-01T10:01:00.000Z [ERROR] [DB] Valid standard format',
      );

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const entries = LogFormatter.parseLogFile('test.log');

      expect(entries).toHaveLength(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping malformed log line'),
      );

      warnSpy.mockRestore();
    });
  });

  describe('parseLogLine', () => {
    it('should parse JSON log line correctly', () => {
      const jsonLine =
        '{"timestamp":"2023-01-01T10:00:00.000Z","level":"INFO","context":"APP","message":"Test message","traceId":"trace123","duration":150}';

      const entry = LogFormatter.parseLogLine(jsonLine);

      expect(entry).toEqual({
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Test message',
        metadata: {},
        traceId: 'trace123',
        userId: undefined,
        requestId: undefined,
        duration: 150,
      });
    });

    it('should parse standard log format correctly', () => {
      const standardLine =
        '2023-01-01T10:00:00.000Z [WARN] [AUTH] Invalid token provided';

      const entry = LogFormatter.parseLogLine(standardLine);

      expect(entry).toEqual({
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'WARN',
        context: 'AUTH',
        message: 'Invalid token provided',
      });
    });

    it('should return null for unparseable lines', () => {
      const invalidLine = 'This is not a valid log format';

      const entry = LogFormatter.parseLogLine(invalidLine);

      expect(entry).toBeNull();
    });

    it('should handle missing timestamp gracefully', () => {
      const jsonLine =
        '{"level":"INFO","context":"APP","message":"No timestamp"}';

      const entry = LogFormatter.parseLogLine(jsonLine);

      expect(entry).not.toBeNull();
      expect(entry?.level).toBe('INFO');
      expect(entry?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('formatForConsole', () => {
    const sampleEntries: ParsedLogEntry[] = [
      {
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Application started',
      },
      {
        timestamp: new Date('2023-01-01T10:01:00.000Z'),
        level: 'ERROR',
        context: 'DB',
        message: 'Connection failed',
        traceId: 'trace123',
        userId: 'user456',
        duration: 5000,
      },
      {
        timestamp: new Date('2023-01-01T10:02:00.000Z'),
        level: 'DEBUG',
        context: 'AUTH',
        message: 'Token validated',
        metadata: { tokenType: 'Bearer', expiry: '1h' },
      },
    ];

    it('should format entries for console display', () => {
      LogFormatter.formatForConsole(sampleEntries);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Log Entries (3 shown)'),
      );

      // Should display all entries by default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Application started'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token validated'),
      );
    });

    it('should filter by minimum level', () => {
      LogFormatter.formatForConsole(sampleEntries, { minLevel: 'ERROR' });

      // Should only show ERROR and higher priority logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed'),
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Token validated'),
      );
    });

    it('should filter by context', () => {
      LogFormatter.formatForConsole(sampleEntries, { context: 'DB' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed'),
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Application started'),
      );
    });

    it('should limit number of entries displayed', () => {
      LogFormatter.formatForConsole(sampleEntries, { maxLines: 1 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Log Entries (1 shown)'),
      );
    });

    it('should show metadata when requested', () => {
      LogFormatter.formatForConsole(sampleEntries, { showMetadata: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Metadata:'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('tokenType'),
      );
    });

    it('should show trace ID and user ID when available', () => {
      LogFormatter.formatForConsole(sampleEntries);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Trace: trace123'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User: user456'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duration: 5000ms'),
      );
    });
  });

  describe('analyzeLog', () => {
    const sampleEntries: ParsedLogEntry[] = [
      {
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Application started',
      },
      {
        timestamp: new Date('2023-01-01T10:01:00.000Z'),
        level: 'ERROR',
        context: 'DB',
        message: 'Connection timeout',
        duration: 5000,
      },
      {
        timestamp: new Date('2023-01-01T10:02:00.000Z'),
        level: 'ERROR',
        context: 'AUTH',
        message: 'Invalid credentials',
        duration: 200,
      },
      {
        timestamp: new Date('2023-01-01T10:03:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Request processed',
        duration: 1500,
      },
    ];

    it('should analyze log entries and provide insights', () => {
      const analytics = LogFormatter.analyzeLog(sampleEntries);

      expect(analytics.totalEntries).toBe(4);
      expect(analytics.levelCounts).toEqual({
        INFO: 2,
        ERROR: 2,
      });
      expect(analytics.contextCounts).toEqual({
        APP: 2,
        DB: 1,
        AUTH: 1,
      });
      expect(analytics.errorPatterns).toEqual([
        'Connection timeout',
        'Invalid credentials',
      ]);
      expect(analytics.performanceMetrics.errorRate).toBe(50);
      expect(analytics.performanceMetrics.averageResponseTime).toBe(2233.33); // (5000 + 200 + 1500) / 3
    });

    it('should identify slow queries', () => {
      const analytics = LogFormatter.analyzeLog(sampleEntries);

      expect(analytics.performanceMetrics.slowQueries).toHaveLength(2);
      expect(analytics.performanceMetrics.slowQueries[0].duration).toBe(5000);
      expect(analytics.performanceMetrics.slowQueries[1].duration).toBe(1500);
    });

    it('should calculate time range correctly', () => {
      const analytics = LogFormatter.analyzeLog(sampleEntries);

      expect(analytics.timeRange.start).toEqual(
        new Date('2023-01-01T10:00:00.000Z'),
      );
      expect(analytics.timeRange.end).toEqual(
        new Date('2023-01-01T10:03:00.000Z'),
      );
      expect(analytics.timeRange.duration).toBe('3m 0s');
    });

    it('should throw error for empty log entries', () => {
      expect(() => LogFormatter.analyzeLog([])).toThrow(
        'No log entries to analyze',
      );
    });
  });

  describe('generateReport', () => {
    const sampleAnalytics: LogAnalytics = {
      totalEntries: 100,
      levelCounts: { ERROR: 10, WARN: 20, INFO: 70 },
      contextCounts: { APP: 50, DB: 30, AUTH: 20 },
      errorPatterns: ['Connection timeout', 'Invalid token'],
      performanceMetrics: {
        averageResponseTime: 250.5,
        slowQueries: [
          {
            timestamp: new Date(),
            level: 'INFO',
            context: 'DB',
            message: 'Slow query executed',
            duration: 2000,
          },
        ],
        errorRate: 10,
      },
      timeRange: {
        start: new Date('2023-01-01T10:00:00.000Z'),
        end: new Date('2023-01-01T11:00:00.000Z'),
        duration: '1h 0m 0s',
      },
    };

    it('should generate comprehensive report', () => {
      const report = LogFormatter.generateReport(sampleAnalytics);

      expect(report).toContain('LOG ANALYSIS REPORT');
      expect(report).toContain('Total Entries: 100');
      expect(report).toContain('Duration: 1h 0m 0s');
      expect(report).toContain('ERROR      :     10 (10.0%)');
      expect(report).toContain('Average Response Time: 250.50ms');
      expect(report).toContain('Error Rate: 10.00%');
      expect(report).toContain('SLOWEST QUERIES');
      expect(report).toContain('ERROR PATTERNS');
    });
  });

  describe('exportLogs', () => {
    const sampleEntries: ParsedLogEntry[] = [
      {
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Test message',
        traceId: 'trace123',
        userId: 'user456',
        duration: 100,
      },
    ];

    it('should export logs as JSON', () => {
      LogFormatter.exportLogs(sampleEntries, 'json', 'output.json');

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        'output.json',
        expect.stringContaining('"level":"INFO"'),
        'utf8',
      );
    });

    it('should export logs as CSV', () => {
      LogFormatter.exportLogs(sampleEntries, 'csv', 'output.csv');

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        'output.csv',
        expect.stringContaining('timestamp,level,context,message'),
        'utf8',
      );
    });

    it('should export logs as TXT', () => {
      LogFormatter.exportLogs(sampleEntries, 'txt', 'output.txt');

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        'output.txt',
        expect.stringContaining('[INFO] [APP] Test message'),
        'utf8',
      );
    });

    it('should throw error for unsupported format', () => {
      expect(() =>
        LogFormatter.exportLogs(sampleEntries, 'xml' as any, 'output.xml'),
      ).toThrow('Unsupported export format: xml');
    });
  });

  describe('filterLogs', () => {
    const sampleEntries: ParsedLogEntry[] = [
      {
        timestamp: new Date('2023-01-01T10:00:00.000Z'),
        level: 'INFO',
        context: 'APP',
        message: 'Application started',
        userId: 'user123',
        traceId: 'trace456',
      },
      {
        timestamp: new Date('2023-01-01T10:05:00.000Z'),
        level: 'ERROR',
        context: 'DB',
        message: 'Database connection failed',
        userId: 'user456',
        traceId: 'trace789',
      },
      {
        timestamp: new Date('2023-01-01T10:10:00.000Z'),
        level: 'WARN',
        context: 'AUTH',
        message: 'Token expiring soon',
        userId: 'user123',
        traceId: 'trace456',
      },
    ];

    it('should filter by level', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        level: ['ERROR', 'WARN'],
      });

      expect(filtered).toHaveLength(2);
      expect(filtered[0].level).toBe('ERROR');
      expect(filtered[1].level).toBe('WARN');
    });

    it('should filter by context', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        context: ['APP', 'AUTH'],
      });

      expect(filtered).toHaveLength(2);
      expect(filtered[0].context).toBe('APP');
      expect(filtered[1].context).toBe('AUTH');
    });

    it('should filter by time range', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        timeRange: {
          start: new Date('2023-01-01T10:02:00.000Z'),
          end: new Date('2023-01-01T10:08:00.000Z'),
        },
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].level).toBe('ERROR');
    });

    it('should filter by search term', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        searchTerm: 'connection',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toContain('connection');
    });

    it('should filter by user ID', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        userId: 'user123',
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(entry => entry.userId === 'user123')).toBe(true);
    });

    it('should filter by trace ID', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        traceId: 'trace456',
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(entry => entry.traceId === 'trace456')).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filtered = LogFormatter.filterLogs(sampleEntries, {
        level: ['INFO', 'WARN'],
        userId: 'user123',
      });

      expect(filtered).toHaveLength(2);
      expect(filtered[0].level).toBe('INFO');
      expect(filtered[1].level).toBe('WARN');
    });
  });
});
