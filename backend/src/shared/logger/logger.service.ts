import {
  Injectable,
  Inject,
  LoggerService as NestLoggerService,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp?: Date;
  error?: Error;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context: string = 'Application';

  constructor(
    private readonly configService: ConfigService,
    @Inject('LOGGER_CONFIG') private readonly loggerConfig: any,
  ) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logDir = this.loggerConfig.logDirectory;

    // Ensure log directory exists
    if (this.loggerConfig.enableFile && !fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports: winston.transport[] = [];

    // Console transport
    if (this.loggerConfig.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const ctx = context ? `[${JSON.stringify(context)}]` : '';
                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                return `${String(timestamp)} ${String(level)} ${ctx} ${String(message)}${metaStr}`;
              },
            ),
          ),
        }),
      );
    }

    // File transports
    if (this.loggerConfig.enableFile) {
      // Combined logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: this.parseSize(this.loggerConfig.maxFileSize),
          maxFiles: parseInt(this.loggerConfig.maxFiles),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Error logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: this.parseSize(this.loggerConfig.maxFileSize),
          maxFiles: parseInt(this.loggerConfig.maxFiles),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Audit logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'audit.log'),
          maxsize: this.parseSize(this.loggerConfig.maxFileSize),
          maxFiles: parseInt(this.loggerConfig.maxFiles),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: this.loggerConfig.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
      exitOnError: false,
    });
  }

  private parseSize(size: string): number {
    const units = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+)(kb|mb|gb)$/);

    if (match) {
      return parseInt(match[1]) * units[match[2] as keyof typeof units];
    }

    return parseInt(size) || 10 * 1024 * 1024; // Default 10MB
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: LogContext): void {
    this.info(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      context: { ...context, module: this.context },
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      context: { ...context, module: this.context },
      error,
    });
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      context: { ...context, module: this.context },
    });
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      context: { ...context, module: this.context },
    });
  }

  verbose(message: string, context?: LogContext): void {
    this.writeLog({
      level: LogLevel.VERBOSE,
      message,
      context: { ...context, module: this.context },
    });
  }

  private writeLog(entry: LogEntry): void {
    const logData = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp || new Date().toISOString(),
      context: entry.context || {},
      ...(entry.error && {
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        },
      }),
    };

    this.logger.log(entry.level, logData);
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): LoggerService {
    const childLogger = new LoggerService(
      this.configService,
      this.loggerConfig,
    );
    childLogger.context = this.context;

    // Override writeLog to include additional context
    const originalWriteLog = childLogger.writeLog.bind(childLogger);
    childLogger.writeLog = (entry: LogEntry) => {
      entry.context = { ...context, ...entry.context };
      originalWriteLog(entry);
    };

    return childLogger;
  }

  /**
   * Log authentication events
   */
  logAuth(action: string, context: LogContext): void {
    this.info(`Auth: ${action}`, {
      ...context,
      category: 'AUTHENTICATION',
    });
  }

  /**
   * Log security events
   */
  logSecurity(action: string, context: LogContext): void {
    this.warn(`Security: ${action}`, {
      ...context,
      category: 'SECURITY',
    });
  }

  /**
   * Log API requests
   */
  logRequest(method: string, url: string, context: LogContext): void {
    this.info(`${method} ${url}`, {
      ...context,
      category: 'API_REQUEST',
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation: string, table: string, context: LogContext): void {
    this.debug(`DB: ${operation} on ${table}`, {
      ...context,
      category: 'DATABASE',
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    context: LogContext,
  ): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      category: 'PERFORMANCE',
      duration,
    });
  }

  /**
   * Flush all logs (useful for testing)
   */
  async flush(): Promise<void> {
    return new Promise(resolve => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}
