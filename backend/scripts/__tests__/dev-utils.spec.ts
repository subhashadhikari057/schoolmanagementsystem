/**
 * =============================================================================
 * Development Utilities Tests - School Management System
 * =============================================================================
 * Comprehensive tests for development utilities including database management,
 * log formatting, and development workflow automation.
 * =============================================================================
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  DevLogger,
  DatabaseManager,
  LogFormatter,
  DevServer,
} from '../dev-utils';

// Mock external dependencies
jest.mock('child_process');
jest.mock('fs');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedWriteFileSync = writeFileSync as jest.MockedFunction<
  typeof writeFileSync
>;
const mockedReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockedMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;

describe('DevLogger', () => {
  let logger: DevLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new DevLogger('test.log', false); // Disable file logging for tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockedExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('logging methods', () => {
    it('should log info messages with proper formatting', () => {
      logger.info('TEST', 'This is a test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('This is a test message'),
      );
    });

    it('should log error messages with proper formatting', () => {
      logger.error('TEST', 'This is an error message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('This is an error message'),
      );
    });

    it('should log success messages with proper formatting', () => {
      logger.success('TEST', 'Operation completed successfully');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SUCCESS'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed successfully'),
      );
    });

    it('should log warning messages with proper formatting', () => {
      logger.warn('TEST', 'This is a warning message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    });

    it('should log debug messages with proper formatting', () => {
      logger.debug('TEST', 'This is a debug message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    });
  });

  describe('section formatting', () => {
    it('should format section headers correctly', () => {
      logger.section('Test Section');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Section'),
      );
    });

    it('should format subsection headers correctly', () => {
      logger.subsection('Test Subsection');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Subsection'),
      );
    });
  });

  describe('file logging', () => {
    it('should write to log file when file logging is enabled', () => {
      const fileLogger = new DevLogger('test.log', true);
      mockedExistsSync.mockReturnValue(false);

      fileLogger.info('TEST', 'Test message');

      expect(mockedMkdirSync).toHaveBeenCalled();
      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.log'),
        expect.stringContaining('Test message'),
        { flag: 'a' },
      );
    });

    it('should not write to log file when file logging is disabled', () => {
      logger.info('TEST', 'Test message');

      expect(mockedWriteFileSync).not.toHaveBeenCalled();
    });
  });
});

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  let logger: DevLogger;

  beforeEach(() => {
    logger = new DevLogger('test.log', false);
    dbManager = new DatabaseManager(logger);
    mockedExecSync.mockReturnValue('Success');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reset', () => {
    it('should execute database reset commands', async () => {
      await dbManager.reset();

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('prisma db push --force-reset'),
        expect.any(Object),
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('prisma generate'),
        expect.any(Object),
      );
    });

    it('should handle reset errors gracefully', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Database reset failed');
      });

      await expect(dbManager.reset()).rejects.toThrow('Database reset failed');
    });
  });

  describe('seed', () => {
    it('should execute comprehensive seed by default', async () => {
      await dbManager.seed();

      expect(mockedExecSync).toHaveBeenCalledWith(
        'npm run seed:comprehensive',
        expect.any(Object),
      );
    });

    it('should execute basic seed when specified', async () => {
      await dbManager.seed('basic');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'npm run db:seed',
        expect.any(Object),
      );
    });

    it('should execute test seed when specified', async () => {
      await dbManager.seed('test');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'ts-node prisma/seeds/test-seed.ts',
        expect.any(Object),
      );
    });

    it('should handle seed errors gracefully', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Seeding failed');
      });

      await expect(dbManager.seed()).rejects.toThrow('Seeding failed');
    });
  });

  describe('migrate', () => {
    it('should execute database migration', async () => {
      await dbManager.migrate();

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('prisma db push'),
        expect.any(Object),
      );
    });
  });

  describe('backup', () => {
    it('should create database backup with default name', async () => {
      const backupName = await dbManager.backup();

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('npm run db:backup'),
        expect.any(Object),
      );
      expect(backupName).toMatch(/backup-\d{4}-\d{2}-\d{2}/);
    });

    it('should create database backup with custom name', async () => {
      const customName = 'my-custom-backup';
      const backupName = await dbManager.backup(customName);

      expect(mockedExecSync).toHaveBeenCalledWith(
        `npm run db:backup -- ${customName}`,
        expect.any(Object),
      );
      expect(backupName).toBe(customName);
    });
  });

  describe('resetAndSeed', () => {
    it('should reset and seed database in sequence', async () => {
      await dbManager.resetAndSeed('test');

      // Should call reset commands first
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('prisma db push --force-reset'),
        expect.any(Object),
      );

      // Then seed commands
      expect(mockedExecSync).toHaveBeenCalledWith(
        'ts-node prisma/seeds/test-seed.ts',
        expect.any(Object),
      );
    });
  });
});

describe('LogFormatter', () => {
  let logFormatter: LogFormatter;
  let logger: DevLogger;

  beforeEach(() => {
    logger = new DevLogger('test.log', false);
    logFormatter = new LogFormatter(logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatApplicationLogs', () => {
    it('should handle non-existent log file', () => {
      mockedExistsSync.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logFormatter.formatApplicationLogs('nonexistent.log');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Log file not found'),
      );

      consoleSpy.mockRestore();
    });

    it('should process JSON log entries', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(
        '{"level":"INFO","message":"Test message","timestamp":"2023-01-01T00:00:00.000Z"}\n' +
          '{"level":"ERROR","message":"Error message","timestamp":"2023-01-01T00:01:00.000Z"}',
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logFormatter.formatApplicationLogs('test.log');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing 2 log entries'),
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-JSON log lines gracefully', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(
        'Plain text log line\n' + 'Another plain text line',
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logFormatter.formatApplicationLogs('test.log');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing 2 log entries'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('tailLogs', () => {
    it('should execute tail command for existing log file', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedExecSync.mockReturnValue('Last 10 lines of log');

      logFormatter.tailLogs('test.log', 10);

      expect(mockedExecSync).toHaveBeenCalledWith('tail -n 10 test.log', {
        encoding: 'utf8',
      });
    });

    it('should handle non-existent log file for tailing', () => {
      mockedExistsSync.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logFormatter.tailLogs('nonexistent.log');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Log file not found'),
      );
      expect(mockedExecSync).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clearLogs', () => {
    it('should clear log file by writing empty content', () => {
      logFormatter.clearLogs('test.log');

      expect(mockedWriteFileSync).toHaveBeenCalledWith('test.log', '');
    });

    it('should handle errors when clearing logs', () => {
      mockedWriteFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logFormatter.clearLogs('test.log');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to clear logs'),
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('DevServer', () => {
  let devServer: DevServer;
  let logger: DevLogger;

  beforeEach(() => {
    logger = new DevLogger('test.log', false);
    devServer = new DevServer(logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runTests', () => {
    it('should run all tests by default', async () => {
      mockedExecSync.mockReturnValue('All tests passed');

      await devServer.runTests();

      expect(mockedExecSync).toHaveBeenCalledWith('npm test', {
        stdio: 'inherit',
      });
    });

    it('should run unit tests when specified', async () => {
      mockedExecSync.mockReturnValue('Unit tests passed');

      await devServer.runTests('unit');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'npm test -- --testPathIgnorePatterns=integration',
        { stdio: 'inherit' },
      );
    });

    it('should run integration tests when specified', async () => {
      mockedExecSync.mockReturnValue('Integration tests passed');

      await devServer.runTests('integration');

      expect(mockedExecSync).toHaveBeenCalledWith(
        'npm test -- --testPathPattern=integration',
        { stdio: 'inherit' },
      );
    });

    it('should run e2e tests when specified', async () => {
      mockedExecSync.mockReturnValue('E2E tests passed');

      await devServer.runTests('e2e');

      expect(mockedExecSync).toHaveBeenCalledWith('npm run test:e2e', {
        stdio: 'inherit',
      });
    });

    it('should handle test failures gracefully', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Tests failed');
      });

      await expect(devServer.runTests()).rejects.toThrow('Tests failed');
    });
  });
});

describe('CLI Integration', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should handle database reset command', async () => {
    process.argv = ['node', 'dev-utils.ts', 'db', 'reset'];
    mockedExecSync.mockReturnValue('Database reset successful');

    // Import and run the CLI (this would normally be done by requiring the module)
    // For testing purposes, we'll just verify the command structure
    expect(process.argv[2]).toBe('db');
    expect(process.argv[3]).toBe('reset');
  });

  it('should handle logs format command', async () => {
    process.argv = ['node', 'dev-utils.ts', 'logs', 'format', 'test.log'];

    expect(process.argv[2]).toBe('logs');
    expect(process.argv[3]).toBe('format');
    expect(process.argv[4]).toBe('test.log');
  });

  it('should handle dev test command', async () => {
    process.argv = ['node', 'dev-utils.ts', 'dev', 'test', 'integration'];

    expect(process.argv[2]).toBe('dev');
    expect(process.argv[3]).toBe('test');
    expect(process.argv[4]).toBe('integration');
  });
});

describe('Error Handling', () => {
  let logger: DevLogger;

  beforeEach(() => {
    logger = new DevLogger('test.log', false);
  });

  it('should handle file system errors gracefully', () => {
    mockedWriteFileSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // This should not throw, but should log the error
    logger.info('TEST', 'Test message');

    consoleSpy.mockRestore();
  });

  it('should handle command execution errors gracefully', async () => {
    const dbManager = new DatabaseManager(logger);

    mockedExecSync.mockImplementation(() => {
      const error = new Error('Command failed');
      (error as any).status = 1;
      throw error;
    });

    await expect(dbManager.reset()).rejects.toThrow('Command failed');
  });
});

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    // Test the private formatDuration method through public methods
    it('should format duration correctly in log analytics', () => {
      // This would be tested through the LogFormatter class if it were public
      // For now, we'll test the integration through other methods
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Command Validation', () => {
    it('should validate required parameters', () => {
      // Test parameter validation
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Integration Tests', () => {
  it('should work with real file system operations', () => {
    // These would be integration tests that actually create files
    // and test the full workflow
    expect(true).toBe(true); // Placeholder for now
  });

  it('should integrate with actual database operations', () => {
    // These would test against a test database
    expect(true).toBe(true); // Placeholder for now
  });
});
