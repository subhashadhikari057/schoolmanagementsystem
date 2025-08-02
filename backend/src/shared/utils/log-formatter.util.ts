/**
 * =============================================================================
 * Log Formatting Utilities - School Management System
 * =============================================================================
 * Advanced log formatting, parsing, and analysis utilities for development
 * =============================================================================
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';

// Safely import chalk with fallback for test environments
interface ChalkInstance {
  red: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  gray: (text: string) => string;
  magenta: (text: string) => string;
  cyan: (text: string) => string;
  green: (text: string) => string;
  white: (text: string) => string;
  dim: (text: string) => string;
}

let chalk: ChalkInstance;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  chalk = require('chalk') as ChalkInstance;
} catch {
  // Fallback for environments where chalk is not available
  chalk = {
    red: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    gray: (text: string) => text,
    magenta: (text: string) => text,
    cyan: (text: string) => text,
    green: (text: string) => text,
    white: (text: string) => text,
    dim: (text: string) => text,
  };
}

export interface ParsedLogEntry {
  timestamp: Date;
  level: string;
  context: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface LogAnalytics {
  totalEntries: number;
  levelCounts: Record<string, number>;
  contextCounts: Record<string, number>;
  errorPatterns: string[];
  performanceMetrics: {
    averageResponseTime: number;
    slowQueries: ParsedLogEntry[];
    errorRate: number;
  };
  timeRange: {
    start: Date;
    end: Date;
    duration: string;
  };
}

export class LogFormatter {
  private static readonly LOG_LEVELS = {
    ERROR: { priority: 0, color: chalk.red, icon: '❌' },
    WARN: { priority: 1, color: chalk.yellow, icon: '⚠️' },
    INFO: { priority: 2, color: chalk.blue, icon: 'ℹ️' },
    DEBUG: { priority: 3, color: chalk.gray, icon: '🐛' },
    VERBOSE: { priority: 4, color: chalk.magenta, icon: '📝' },
  };

  /**
   * Parse a log file and return structured log entries
   */
  static parseLogFile(filePath: string): ParsedLogEntry[] {
    if (!existsSync(filePath)) {
      throw new Error(`Log file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        const entry = LogFormatter.parseLogLine(line);
        if (entry) {
          entries.push(entry);
        }
      } catch (_error) {
        // Skip malformed lines
        console.warn(
          `Skipping malformed log line: ${line.substring(0, 100)}...`,
        );
      }
    }

    return entries;
  }

  /**
   * Parse a single log line into a structured entry
   */
  static parseLogLine(line: string): ParsedLogEntry | null {
    try {
      // Try to parse as JSON first (structured logs)
      const jsonEntry = JSON.parse(line);
      return {
        timestamp: new Date(
          jsonEntry.timestamp || jsonEntry.time || Date.now(),
        ),
        level: jsonEntry.level || 'INFO',
        context: jsonEntry.context || jsonEntry.logger || 'APP',
        message: jsonEntry.message || jsonEntry.msg || '',
        metadata: jsonEntry.metadata || {},
        traceId: jsonEntry.traceId,
        userId: jsonEntry.userId,
        requestId: jsonEntry.requestId,
        duration: jsonEntry.duration,
      };
    } catch {
      // Try to parse as standard log format
      const match = line.match(
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.+)$/,
      );

      if (match) {
        const [, timestamp, level, context, message] = match;
        return {
          timestamp: new Date(timestamp),
          level,
          context,
          message,
        };
      }
    }

    return null;
  }

  /**
   * Format log entries for console display with colors and icons
   */
  static formatForConsole(
    entries: ParsedLogEntry[],
    options: {
      maxLines?: number;
      minLevel?: string;
      context?: string;
      showMetadata?: boolean;
    } = {},
  ): void {
    const {
      maxLines = 100,
      minLevel = 'DEBUG',
      context,
      showMetadata = false,
    } = options;

    const minPriority =
      LogFormatter.LOG_LEVELS[minLevel as keyof typeof LogFormatter.LOG_LEVELS]
        ?.priority ?? 4;

    let filteredEntries = entries.filter(entry => {
      const levelConfig =
        LogFormatter.LOG_LEVELS[
          entry.level as keyof typeof LogFormatter.LOG_LEVELS
        ];
      const meetsPriority = levelConfig
        ? levelConfig.priority <= minPriority
        : true;
      const meetsContext = !context || entry.context.includes(context);

      return meetsPriority && meetsContext;
    });

    // Take only the most recent entries
    filteredEntries = filteredEntries.slice(-maxLines);

    console.log(
      chalk.cyan.bold(`\n📋 Log Entries (${filteredEntries.length} shown)\n`),
    );

    filteredEntries.forEach((entry, index) => {
      const levelConfig =
        LogFormatter.LOG_LEVELS[
          entry.level as keyof typeof LogFormatter.LOG_LEVELS
        ];
      const colorFn = levelConfig?.color || chalk.white;
      const icon = levelConfig?.icon || '📝';

      const timestamp = chalk.gray(entry.timestamp.toISOString());
      const level = colorFn(entry.level.padEnd(5));
      const context = chalk.cyan(`[${entry.context}]`);
      const message = entry.message;

      console.log(
        `${chalk.dim(`${(index + 1).toString().padStart(3)}`)} ${timestamp} ${icon} ${level} ${context} ${message}`,
      );

      // Show additional metadata if requested
      if (
        showMetadata &&
        entry.metadata &&
        Object.keys(entry.metadata).length > 0
      ) {
        console.log(
          chalk.dim(`    Metadata: ${JSON.stringify(entry.metadata, null, 2)}`),
        );
      }

      if (entry.traceId) {
        console.log(chalk.yellow(`    Trace: ${entry.traceId}`));
      }

      if (entry.userId) {
        console.log(chalk.blue(`    User: ${entry.userId}`));
      }

      if (entry.duration) {
        console.log(chalk.magenta(`    Duration: ${entry.duration}ms`));
      }
    });
  }

  /**
   * Analyze log entries and provide insights
   */
  static analyzeLog(entries: ParsedLogEntry[]): LogAnalytics {
    if (entries.length === 0) {
      throw new Error('No log entries to analyze');
    }

    const levelCounts: Record<string, number> = {};
    const contextCounts: Record<string, number> = {};
    const errorPatterns: string[] = [];
    const durations: number[] = [];
    let errorCount = 0;

    entries.forEach(entry => {
      // Count levels
      levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;

      // Count contexts
      contextCounts[entry.context] = (contextCounts[entry.context] || 0) + 1;

      // Collect error patterns
      if (entry.level === 'ERROR') {
        errorCount++;
        errorPatterns.push(entry.message);
      }

      // Collect durations
      if (entry.duration) {
        durations.push(entry.duration);
      }
    });

    // Sort timestamps to get time range
    const sortedEntries = entries.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const start = sortedEntries[0].timestamp;
    const end = sortedEntries[sortedEntries.length - 1].timestamp;
    const durationMs = end.getTime() - start.getTime();

    // Calculate performance metrics
    const averageResponseTime =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const slowQueries = entries
      .filter(entry => entry.duration && entry.duration > 1000)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const errorRate =
      entries.length > 0 ? (errorCount / entries.length) * 100 : 0;

    return {
      totalEntries: entries.length,
      levelCounts,
      contextCounts,
      errorPatterns: [...new Set(errorPatterns)], // Remove duplicates
      performanceMetrics: {
        averageResponseTime,
        slowQueries,
        errorRate,
      },
      timeRange: {
        start,
        end,
        duration: LogFormatter.formatDuration(durationMs),
      },
    };
  }

  /**
   * Generate a comprehensive log report
   */
  static generateReport(analytics: LogAnalytics): string {
    const report: string[] = [];

    report.push('🔍 LOG ANALYSIS REPORT');
    report.push('='.repeat(50));
    report.push('');

    // Summary
    report.push('📊 SUMMARY');
    report.push(`Total Entries: ${analytics.totalEntries}`);
    report.push(
      `Time Range: ${analytics.timeRange.start.toISOString()} - ${analytics.timeRange.end.toISOString()}`,
    );
    report.push(`Duration: ${analytics.timeRange.duration}`);
    report.push('');

    // Level Distribution
    report.push('📈 LEVEL DISTRIBUTION');
    Object.entries(analytics.levelCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([level, count]) => {
        const percentage = ((count / analytics.totalEntries) * 100).toFixed(1);
        report.push(
          `${level.padEnd(8)}: ${count.toString().padStart(6)} (${percentage}%)`,
        );
      });
    report.push('');

    // Context Distribution
    report.push('🏷️  CONTEXT DISTRIBUTION');
    Object.entries(analytics.contextCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10
      .forEach(([context, count]) => {
        const percentage = ((count / analytics.totalEntries) * 100).toFixed(1);
        report.push(
          `${context.padEnd(20)}: ${count.toString().padStart(6)} (${percentage}%)`,
        );
      });
    report.push('');

    // Performance Metrics
    report.push('⚡ PERFORMANCE METRICS');
    report.push(
      `Average Response Time: ${analytics.performanceMetrics.averageResponseTime.toFixed(2)}ms`,
    );
    report.push(
      `Error Rate: ${analytics.performanceMetrics.errorRate.toFixed(2)}%`,
    );
    report.push(
      `Slow Queries (over 1s): ${analytics.performanceMetrics.slowQueries.length}`,
    );
    report.push('');

    // Top Slow Queries
    if (analytics.performanceMetrics.slowQueries.length > 0) {
      report.push('🐌 SLOWEST QUERIES');
      analytics.performanceMetrics.slowQueries
        .slice(0, 5)
        .forEach((query, index) => {
          report.push(
            `${index + 1}. ${query.duration}ms - ${query.message.substring(0, 80)}...`,
          );
        });
      report.push('');
    }

    // Error Patterns
    if (analytics.errorPatterns.length > 0) {
      report.push('❌ ERROR PATTERNS');
      analytics.errorPatterns.slice(0, 10).forEach((pattern, index) => {
        report.push(`${index + 1}. ${pattern.substring(0, 100)}...`);
      });
      report.push('');
    }

    return report.join('\n');
  }

  /**
   * Export log entries to various formats
   */
  static exportLogs(
    entries: ParsedLogEntry[],
    format: 'json' | 'csv' | 'txt',
    filePath: string,
  ): void {
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(entries, null, 2);
        break;

      case 'csv': {
        const headers =
          'timestamp,level,context,message,traceId,userId,duration\n';
        const rows = entries
          .map(
            entry =>
              `"${entry.timestamp.toISOString()}","${entry.level}","${entry.context}","${entry.message.replace(/"/g, '""')}","${entry.traceId || ''}","${entry.userId || ''}","${entry.duration || ''}"`,
          )
          .join('\n');
        content = headers + rows;
        break;
      }

      case 'txt':
        content = entries
          .map(
            entry =>
              `${entry.timestamp.toISOString()} [${entry.level}] [${entry.context}] ${entry.message}`,
          )
          .join('\n');
        break;

      default:
        throw new Error(`Unsupported export format: ${format as string}`);
    }

    writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Filter log entries by various criteria
   */
  static filterLogs(
    entries: ParsedLogEntry[],
    filters: {
      level?: string[];
      context?: string[];
      timeRange?: { start: Date; end: Date };
      searchTerm?: string;
      userId?: string;
      traceId?: string;
    },
  ): ParsedLogEntry[] {
    return entries.filter(entry => {
      // Level filter
      if (filters.level && !filters.level.includes(entry.level)) {
        return false;
      }

      // Context filter
      if (
        filters.context &&
        !filters.context.some(ctx => entry.context.includes(ctx))
      ) {
        return false;
      }

      // Time range filter
      if (filters.timeRange) {
        const entryTime = entry.timestamp.getTime();
        if (
          entryTime < filters.timeRange.start.getTime() ||
          entryTime > filters.timeRange.end.getTime()
        ) {
          return false;
        }
      }

      // Search term filter
      if (
        filters.searchTerm &&
        !entry.message.toLowerCase().includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // User ID filter
      if (filters.userId && entry.userId !== filters.userId) {
        return false;
      }

      // Trace ID filter
      if (filters.traceId && entry.traceId !== filters.traceId) {
        return false;
      }

      return true;
    });
  }

  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
