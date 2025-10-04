/**
 * =============================================================================
 * Progress Tracking Service
 * =============================================================================
 * Manages real-time progress tracking for backup and restore operations
 * Uses Server-Sent Events (SSE) for real-time updates to frontend
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export enum ProgressStage {
  // Backup stages
  BACKUP_INITIATED = 'backup_initiated',
  DUMPING_DATABASE = 'dumping_database',
  COLLECTING_FILES = 'collecting_files',
  COMPRESSING = 'compressing',
  ENCRYPTING = 'encrypting',
  TRANSFERRING_OFFSITE = 'transferring_offsite',
  BACKUP_COMPLETED = 'backup_completed',
  BACKUP_FAILED = 'backup_failed',

  // Restore stages
  RESTORE_INITIATED = 'restore_initiated',
  DOWNLOADING_FROM_OFFSITE = 'downloading_from_offsite',
  DECRYPTING = 'decrypting',
  UNCOMPRESSING = 'uncompressing',
  VALIDATING_BACKUP = 'validating_backup',
  CREATING_PRE_RESTORE_SNAPSHOT = 'creating_pre_restore_snapshot',
  RESTORING_DATABASE = 'restoring_database',
  RESTORING_FILES = 'restoring_files',
  RESTORE_COMPLETED = 'restore_completed',
  RESTORE_FAILED = 'restore_failed',
}

export interface ProgressUpdate {
  operationId: string;
  operationType: 'backup' | 'restore';
  stage: ProgressStage;
  progress: number; // 0-100
  message: string;
  details?: any;
  timestamp: Date;
  error?: string;
}

@Injectable()
export class ProgressTrackingService {
  private readonly logger = new Logger(ProgressTrackingService.name);
  private readonly progressSubjects = new Map<
    string,
    Subject<ProgressUpdate>
  >();
  private readonly progressHistory = new Map<string, ProgressUpdate[]>();

  /**
   * Create a new progress tracker for an operation
   */
  createProgressTracker(
    operationId: string,
    operationType: 'backup' | 'restore',
  ): void {
    if (!this.progressSubjects.has(operationId)) {
      this.progressSubjects.set(operationId, new Subject<ProgressUpdate>());
      this.progressHistory.set(operationId, []);
      this.logger.log(
        `Created progress tracker for ${operationType} operation: ${operationId}`,
      );
    }
  }

  /**
   * Update progress for an operation
   */
  updateProgress(
    operationId: string,
    operationType: 'backup' | 'restore',
    stage: ProgressStage,
    progress: number,
    message: string,
    details?: any,
    error?: string,
  ): void {
    const subject = this.progressSubjects.get(operationId);
    if (!subject) {
      this.logger.warn(
        `Progress subject not found for operation: ${operationId}`,
      );
      return;
    }

    const update: ProgressUpdate = {
      operationId,
      operationType,
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      details,
      timestamp: new Date(),
      error,
    };

    // Store in history
    const history = this.progressHistory.get(operationId) || [];
    history.push(update);
    this.progressHistory.set(operationId, history);

    // Emit update
    subject.next(update);

    this.logger.debug(
      `Progress update for ${operationId}: ${stage} - ${progress}% - ${message}`,
    );
  }

  /**
   * Get observable for an operation's progress
   */
  getProgressObservable(
    operationId: string,
  ): Observable<ProgressUpdate> | null {
    const subject = this.progressSubjects.get(operationId);
    return subject ? subject.asObservable() : null;
  }

  /**
   * Get progress history for an operation
   */
  getProgressHistory(operationId: string): ProgressUpdate[] {
    return this.progressHistory.get(operationId) || [];
  }

  /**
   * Get current progress for an operation
   */
  getCurrentProgress(operationId: string): ProgressUpdate | null {
    const history = this.progressHistory.get(operationId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Complete and cleanup progress tracker
   */
  completeProgressTracker(operationId: string): void {
    const subject = this.progressSubjects.get(operationId);
    if (subject) {
      subject.complete();
      this.progressSubjects.delete(operationId);
      this.logger.log(`Completed progress tracker for: ${operationId}`);

      // Keep history for 1 hour, then clean up
      setTimeout(
        () => {
          this.progressHistory.delete(operationId);
          this.logger.debug(`Cleaned up progress history for: ${operationId}`);
        },
        60 * 60 * 1000,
      );
    }
  }

  /**
   * Helper methods for common stage updates
   */

  initiateBackup(operationId: string, backupType: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.BACKUP_INITIATED,
      0,
      `Initiating ${backupType} backup...`,
      { backupType },
    );
  }

  startDatabaseDump(operationId: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.DUMPING_DATABASE,
      10,
      'Dumping database...',
    );
  }

  startFileCollection(operationId: string, totalFiles?: number): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.COLLECTING_FILES,
      20,
      'Collecting files...',
      { totalFiles },
    );
  }

  startCompression(operationId: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.COMPRESSING,
      50,
      'Compressing backup...',
    );
  }

  startEncryption(operationId: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.ENCRYPTING,
      70,
      'Encrypting backup...',
    );
  }

  startOffsiteTransfer(operationId: string, destination: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.TRANSFERRING_OFFSITE,
      80,
      `Transferring to ${destination}...`,
      { destination },
    );
  }

  completeBackup(operationId: string, size: number, location: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.BACKUP_COMPLETED,
      100,
      'Backup completed successfully',
      { size, location },
    );
  }

  failBackup(operationId: string, error: string): void {
    this.updateProgress(
      operationId,
      'backup',
      ProgressStage.BACKUP_FAILED,
      0,
      'Backup failed',
      {},
      error,
    );
  }

  // Restore helper methods
  initiateRestore(operationId: string, backupId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.RESTORE_INITIATED,
      0,
      `Initiating restore from backup ${backupId}...`,
      { backupId },
    );
  }

  startOffsiteDownload(operationId: string, remotePath: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.DOWNLOADING_FROM_OFFSITE,
      10,
      `Downloading from offsite: ${remotePath}...`,
      { remotePath },
    );
  }

  startDecryption(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.DECRYPTING,
      20,
      'Decrypting backup...',
    );
  }

  startUncompressing(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.UNCOMPRESSING,
      30,
      'Uncompressing backup...',
    );
  }

  startValidation(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.VALIDATING_BACKUP,
      40,
      'Validating backup integrity...',
    );
  }

  startPreRestoreSnapshot(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.CREATING_PRE_RESTORE_SNAPSHOT,
      50,
      'Creating pre-restore snapshot...',
    );
  }

  startDatabaseRestore(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.RESTORING_DATABASE,
      60,
      'Restoring database...',
    );
  }

  startFileRestore(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.RESTORING_FILES,
      80,
      'Restoring files...',
    );
  }

  completeRestore(operationId: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.RESTORE_COMPLETED,
      100,
      'Restore completed successfully',
    );
  }

  failRestore(operationId: string, error: string): void {
    this.updateProgress(
      operationId,
      'restore',
      ProgressStage.RESTORE_FAILED,
      0,
      'Restore failed',
      {},
      error,
    );
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): string[] {
    return Array.from(this.progressSubjects.keys());
  }
}
