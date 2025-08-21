#!/usr/bin/env ts-node

/**
 * =============================================================================
 * Development Utilities - School Management System
 * =============================================================================
 * Comprehensive development utilities for database management, logging,
 * and development workflow automation.
 * =============================================================================
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
}

class DevLogger {
  private logFile: string;
  private enableFileLogging: boolean;

  constructor(logFile = 'dev-utils.log', enableFileLogging = true) {
    this.logFile = join(process.cwd(), 'logs', logFile);
    this.enableFileLogging = enableFileLogging;

    // Ensure logs directory exists
    if (enableFileLogging) {
      const logDir = join(process.cwd(), 'logs');
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private formatMessage(
    level: LogEntry['level'],
    category: string,
    message: string,
  ): string {
    const timestamp = new Date().toISOString();
    const colorMap = {
      INFO: chalk.blue,
      WARN: chalk.yellow,
      ERROR: chalk.red,
      DEBUG: chalk.gray,
      SUCCESS: chalk.green,
    };

    const levelColor = colorMap[level] || chalk.white;
    const categoryFormatted = chalk.cyan(`[${category}]`);
    const timestampFormatted = chalk.gray(timestamp);

    return `${timestampFormatted} ${levelColor(level)} ${categoryFormatted} ${message}`;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.enableFileLogging) return;

    try {
      const logLine = `${entry.timestamp} [${entry.level}] [${entry.category}] ${entry.message}${
        entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : ''
      }\n`;

      writeFileSync(this.logFile, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(
    level: LogEntry['level'],
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
    };

    console.log(this.formatMessage(level, category, message));
    this.writeToFile(entry);
  }

  info(
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('INFO', category, message, metadata);
  }

  warn(
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('WARN', category, message, metadata);
  }

  error(
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('ERROR', category, message, metadata);
  }

  debug(
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('DEBUG', category, message, metadata);
  }

  success(
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('SUCCESS', category, message, metadata);
  }

  section(title: string): void {
    const separator = '═'.repeat(60);
    console.log(chalk.cyan(`\n${separator}`));
    console.log(chalk.cyan.bold(`  ${title}`));
    console.log(chalk.cyan(`${separator}\n`));
  }

  subsection(title: string): void {
    console.log(chalk.yellow(`\n── ${title} ──\n`));
  }
}

class DatabaseManager {
  private logger: DevLogger;
  private prismaPath: string;

  constructor(logger: DevLogger) {
    this.logger = logger;
    this.prismaPath = join(process.cwd(), 'node_modules', '.bin', 'prisma');
  }

  private async executeCommand(
    command: string,
    description: string,
  ): Promise<string> {
    this.logger.info('DATABASE', `${description}...`);

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      this.logger.success('DATABASE', `${description} completed successfully`);
      return result;
    } catch (error: any) {
      this.logger.error('DATABASE', `${description} failed: ${error.message}`);
      throw error;
    }
  }

  async reset(): Promise<void> {
    this.logger.section('Database Reset');

    try {
      // Push schema to reset database
      await this.executeCommand(
        `${this.prismaPath} db push --force-reset --accept-data-loss`,
        'Resetting database schema',
      );

      // Generate Prisma client
      await this.executeCommand(
        `${this.prismaPath} generate`,
        'Generating Prisma client',
      );

      this.logger.success('DATABASE', 'Database reset completed successfully');
    } catch (error) {
      this.logger.error('DATABASE', 'Database reset failed');
      throw error;
    }
  }

  async seed(
    seedType: 'basic' | 'comprehensive' | 'test' = 'comprehensive',
  ): Promise<void> {
    this.logger.section('Database Seeding');

    const seedCommands = {
      basic: 'npm run db:seed',
      comprehensive: 'npm run seed:comprehensive',
      test: 'ts-node prisma/seeds/test-seed.ts',
    };

    try {
      await this.executeCommand(
        seedCommands[seedType],
        `Running ${seedType} seed`,
      );

      this.logger.success(
        'DATABASE',
        `${seedType} seeding completed successfully`,
      );
    } catch (error) {
      this.logger.error('DATABASE', `${seedType} seeding failed`);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    this.logger.section('Database Migration');

    try {
      await this.executeCommand(
        `${this.prismaPath} db push`,
        'Applying database migrations',
      );
    } catch (error) {
      this.logger.error('DATABASE', 'Migration failed');
      throw error;
    }
  }

  async backup(backupName?: string): Promise<string> {
    this.logger.section('Database Backup');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = backupName || `backup-${timestamp}`;

    try {
      await this.executeCommand(
        `npm run db:backup -- ${name}`,
        `Creating backup: ${name}`,
      );

      return name;
    } catch (error) {
      this.logger.error('DATABASE', 'Backup failed');
      throw error;
    }
  }

  async status(): Promise<void> {
    this.logger.section('Database Status');

    try {
      const result = await this.executeCommand(
        `${this.prismaPath} db seed --preview-feature || echo "No seed preview available"`,
        'Checking database status',
      );

      this.logger.info('DATABASE', 'Status check completed');
    } catch (error) {
      this.logger.warn(
        'DATABASE',
        'Status check had issues, but continuing...',
      );
    }
  }

  async resetAndSeed(
    seedType: 'basic' | 'comprehensive' | 'test' = 'comprehensive',
  ): Promise<void> {
    this.logger.section('Database Reset & Seed');

    await this.reset();
    await this.seed(seedType);

    this.logger.success('DATABASE', 'Reset and seed completed successfully');
  }
}

class LogFormatter {
  private logger: DevLogger;

  constructor(logger: DevLogger) {
    this.logger = logger;
  }

  formatApplicationLogs(logFile: string): void {
    this.logger.section('Log Formatting');

    if (!existsSync(logFile)) {
      this.logger.warn('LOGS', `Log file not found: ${logFile}`);
      return;
    }

    try {
      const content = readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      this.logger.info('LOGS', `Processing ${lines.length} log entries`);

      lines.forEach((line, index) => {
        try {
          const logEntry = JSON.parse(line);
          this.formatLogEntry(logEntry, index + 1);
        } catch {
          // Handle non-JSON log lines
          this.logger.debug('LOGS', `Line ${index + 1}: ${line}`);
        }
      });

      this.logger.success('LOGS', 'Log formatting completed');
    } catch (error: any) {
      this.logger.error('LOGS', `Failed to format logs: ${error.message}`);
    }
  }

  private formatLogEntry(entry: any, lineNumber: number): void {
    const level = entry.level || 'INFO';
    const timestamp = entry.timestamp || entry.time || 'Unknown';
    const message = entry.message || entry.msg || 'No message';
    const context = entry.context || entry.logger || 'APP';

    const colorMap: Record<string, (text: string) => string> = {
      ERROR: chalk.red,
      WARN: chalk.yellow,
      INFO: chalk.blue,
      DEBUG: chalk.gray,
      VERBOSE: chalk.magenta,
    };

    const colorFn = colorMap[level] || chalk.white;

    console.log(
      `${chalk.gray(`[${lineNumber}]`)} ${chalk.gray(timestamp)} ${colorFn(level)} ${chalk.cyan(`[${context}]`)} ${message}`,
    );

    // Show additional properties if they exist
    if (entry.stack) {
      console.log(chalk.red(`  Stack: ${entry.stack}`));
    }

    if (entry.userId) {
      console.log(chalk.blue(`  User: ${entry.userId}`));
    }

    if (entry.traceId) {
      console.log(chalk.yellow(`  Trace: ${entry.traceId}`));
    }
  }

  tailLogs(logFile: string, lines: number = 50): void {
    this.logger.section(`Tailing Logs - Last ${lines} lines`);

    if (!existsSync(logFile)) {
      this.logger.warn('LOGS', `Log file not found: ${logFile}`);
      return;
    }

    try {
      const result = execSync(`tail -n ${lines} ${logFile}`, {
        encoding: 'utf8',
      });
      console.log(result);
    } catch (error: any) {
      this.logger.error('LOGS', `Failed to tail logs: ${error.message}`);
    }
  }

  clearLogs(logFile: string): void {
    this.logger.section('Clearing Logs');

    try {
      writeFileSync(logFile, '');
      this.logger.success('LOGS', `Cleared log file: ${logFile}`);
    } catch (error: any) {
      this.logger.error('LOGS', `Failed to clear logs: ${error.message}`);
    }
  }
}

class DevServer {
  private logger: DevLogger;

  constructor(logger: DevLogger) {
    this.logger = logger;
  }

  async startDevelopment(): Promise<void> {
    this.logger.section('Starting Development Environment');

    // Start Docker services
    this.logger.info('DEV-SERVER', 'Starting Docker services...');
    try {
      execSync('npm run docker:start', { stdio: 'inherit' });
      this.logger.success('DEV-SERVER', 'Docker services started');
    } catch (error) {
      this.logger.error('DEV-SERVER', 'Failed to start Docker services');
    }

    // Start backend in development mode
    this.logger.info('DEV-SERVER', 'Starting backend server...');
    const backend = spawn('npm', ['run', 'start:dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.logger.info(
        'DEV-SERVER',
        'Shutting down development environment...',
      );
      backend.kill();
      process.exit(0);
    });
  }

  async runTests(
    testType: 'all' | 'unit' | 'integration' | 'e2e' = 'all',
  ): Promise<void> {
    this.logger.section(`Running ${testType} tests`);

    const testCommands = {
      all: 'npm test',
      unit: 'npm test -- --testPathIgnorePatterns=integration',
      integration: 'npm test -- --testPathPattern=integration',
      e2e: 'npm run test:e2e',
    };

    try {
      execSync(testCommands[testType], { stdio: 'inherit' });
      this.logger.success('TESTS', `${testType} tests completed successfully`);
    } catch (error) {
      this.logger.error('TESTS', `${testType} tests failed`);
      throw error;
    }
  }
}

// CLI Interface
async function main(): Promise<void> {
  const logger = new DevLogger();
  const dbManager = new DatabaseManager(logger);
  const logFormatter = new LogFormatter(logger);
  const devServer = new DevServer(logger);

  const command = process.argv[2];
  const subCommand = process.argv[3];
  const options = process.argv.slice(4);

  try {
    switch (command) {
      case 'db': {
        switch (subCommand) {
          case 'reset':
            await dbManager.reset();
            break;
          case 'seed': {
            const seedType =
              (options[0] as 'basic' | 'comprehensive' | 'test') ||
              'comprehensive';
            await dbManager.seed(seedType);
            break;
          }
          case 'migrate':
            await dbManager.migrate();
            break;
          case 'backup': {
            const backupName = options[0];
            await dbManager.backup(backupName);
            break;
          }
          case 'status':
            await dbManager.status();
            break;
          case 'reset-and-seed': {
            const resetSeedType =
              (options[0] as 'basic' | 'comprehensive' | 'test') ||
              'comprehensive';
            await dbManager.resetAndSeed(resetSeedType);
            break;
          }
          default:
            logger.error('CLI', `Unknown database command: ${subCommand}`);
            showHelp();
        }
        break;
      }

      case 'logs': {
        switch (subCommand) {
          case 'format': {
            const logFile =
              options[0] || join(process.cwd(), 'logs', 'application.log');
            logFormatter.formatApplicationLogs(logFile);
            break;
          }
          case 'tail': {
            const tailFile =
              options[0] || join(process.cwd(), 'logs', 'application.log');
            const lines = parseInt(options[1]) || 50;
            logFormatter.tailLogs(tailFile, lines);
            break;
          }
          case 'clear': {
            const clearFile =
              options[0] || join(process.cwd(), 'logs', 'application.log');
            logFormatter.clearLogs(clearFile);
            break;
          }
          default:
            logger.error('CLI', `Unknown logs command: ${subCommand}`);
            showHelp();
        }
        break;
      }

      case 'dev': {
        switch (subCommand) {
          case 'start':
            await devServer.startDevelopment();
            break;
          case 'test': {
            const testType =
              (options[0] as 'all' | 'unit' | 'integration' | 'e2e') || 'all';
            await devServer.runTests(testType);
            break;
          }
          default:
            logger.error('CLI', `Unknown dev command: ${subCommand}`);
            showHelp();
        }
        break;
      }

      default:
        showHelp();
    }
  } catch (error: any) {
    logger.error('CLI', `Command failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(
    chalk.cyan.bold('\n🚀 Development Utilities - School Management System\n'),
  );

  console.log(chalk.yellow('Database Commands:'));
  console.log(
    '  npm run dev-utils db reset                    Reset database schema',
  );
  console.log(
    '  npm run dev-utils db seed [type]             Seed database (basic|comprehensive|test)',
  );
  console.log(
    '  npm run dev-utils db migrate                 Apply migrations',
  );
  console.log(
    '  npm run dev-utils db backup [name]           Create database backup',
  );
  console.log(
    '  npm run dev-utils db status                  Check database status',
  );
  console.log(
    '  npm run dev-utils db reset-and-seed [type]   Reset and seed in one command',
  );

  console.log(chalk.yellow('\nLog Commands:'));
  console.log(
    '  npm run dev-utils logs format [file]         Format and display logs',
  );
  console.log('  npm run dev-utils logs tail [file] [lines]   Tail log file');
  console.log('  npm run dev-utils logs clear [file]          Clear log file');

  console.log(chalk.yellow('\nDevelopment Commands:'));
  console.log(
    '  npm run dev-utils dev start                  Start development environment',
  );
  console.log(
    '  npm run dev-utils dev test [type]            Run tests (all|unit|integration|e2e)',
  );

  console.log(chalk.gray('\nExamples:'));
  console.log(
    chalk.gray('  npm run dev-utils db reset-and-seed comprehensive'),
  );
  console.log(
    chalk.gray('  npm run dev-utils logs tail logs/application.log 100'),
  );
  console.log(chalk.gray('  npm run dev-utils dev test integration'));

  console.log();
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { DevLogger, DatabaseManager, LogFormatter, DevServer };
