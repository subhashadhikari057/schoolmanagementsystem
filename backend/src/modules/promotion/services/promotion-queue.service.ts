/**
 * =============================================================================
 * Promotion Queue Service
 * =============================================================================
 * Handles background processing of student promotions with progress tracking.
 * Implements queue-based processing for large datasets.
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { PromotionStatus, PromotionType } from '@prisma/client';

export interface PromotionJob {
  batchId: string;
  userId: string;
  totalStudents: number;
  processedStudents: number;
  promotedStudents: number;
  retainedStudents: number;
  graduatedStudents: number;
  failedStudents: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
}

@Injectable()
export class PromotionQueueService {
  private readonly logger = new Logger(PromotionQueueService.name);
  private readonly jobs = new Map<string, PromotionJob>();
  private readonly progressCallbacks = new Map<
    string,
    (progress: PromotionJob) => void
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Start promotion processing in background
   */
  async startPromotionJob(batchId: string, userId: string): Promise<void> {
    const batch = await this.prisma.promotionBatch.findUnique({
      where: { id: batchId },
      include: {
        promotionRecords: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
              },
            },
            fromClass: true,
            toClass: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('Promotion batch not found');
    }

    // Initialize job
    const job: PromotionJob = {
      batchId,
      userId,
      totalStudents: batch.promotionRecords.length,
      processedStudents: 0,
      promotedStudents: 0,
      retainedStudents: 0,
      graduatedStudents: 0,
      failedStudents: 0,
      status: 'PENDING',
      errors: [],
    };

    this.jobs.set(batchId, job);

    // Start processing in background
    setImmediate(() => this.processPromotionBatch(batch, job));
  }

  /**
   * Get job progress
   */
  getJobProgress(batchId: string): PromotionJob | null {
    return this.jobs.get(batchId) || null;
  }

  /**
   * Subscribe to job progress updates
   */
  subscribeToProgress(
    batchId: string,
    callback: (progress: PromotionJob) => void,
  ): void {
    this.progressCallbacks.set(batchId, callback);
  }

  /**
   * Unsubscribe from job progress updates
   */
  unsubscribeFromProgress(batchId: string): void {
    this.progressCallbacks.delete(batchId);
  }

  /**
   * Process promotion batch with progress tracking
   */
  private async processPromotionBatch(
    batch: any,
    job: PromotionJob,
  ): Promise<void> {
    try {
      job.status = 'IN_PROGRESS';
      job.startedAt = new Date();
      this.updateProgress(job);

      // Update batch status
      await this.prisma.promotionBatch.update({
        where: { id: batch.id },
        data: {
          status: PromotionStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Process each student with small delays to prevent overwhelming the database
      for (let i = 0; i < batch.promotionRecords.length; i++) {
        const record = batch.promotionRecords[i];

        try {
          await this.processIndividualPromotion(record, job.userId);

          // Update counters based on promotion type
          // console.log(
          //   `📊 Processing student ${record.student.user.fullName}: ${record.promotionType}`,
          // );
          switch (record.promotionType) {
            case PromotionType.PROMOTED:
              job.promotedStudents++;
              break;
            case PromotionType.RETAINED:
              job.retainedStudents++;
              break;
            case PromotionType.GRADUATED:
              job.graduatedStudents++;
              break;
          }
        } catch (error) {
          job.failedStudents++;
          const studentName = record.student.user.fullName;
          const errorMessage = this.getDetailedErrorMessage(error, record);
          job.errors.push(`${studentName}: ${errorMessage}`);

          this.logger.error(
            `Failed to promote student ${record.studentId}:`,
            error,
          );
        }

        job.processedStudents++;
        this.updateProgress(job);

        // Small delay to prevent overwhelming the database (adjust based on your needs)
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Mark job as completed
      job.status = 'COMPLETED';
      job.completedAt = new Date();

      // Update batch with final statistics
      // console.log('📊 Final promotion counts:', {
      //   promoted: job.promotedStudents,
      //   retained: job.retainedStudents,
      //   graduated: job.graduatedStudents,
      //   failed: job.failedStudents,
      //   total: job.totalStudents,
      // });

      await this.prisma.promotionBatch.update({
        where: { id: batch.id },
        data: {
          status:
            job.failedStudents > 0
              ? PromotionStatus.FAILED
              : PromotionStatus.COMPLETED,
          completedAt: new Date(),
          promotedStudents: job.promotedStudents,
          retainedStudents: job.retainedStudents,
          graduatedStudents: job.graduatedStudents,
        },
      });

      this.updateProgress(job);

      // Log completion
      await this.audit.log({
        userId: job.userId,
        action: 'UPDATE',
        module: 'PromotionBatch',
        status: job.failedStudents > 0 ? 'FAIL' : 'SUCCESS',
        details: {
          batchId: batch.id,
          totalProcessed: job.processedStudents,
          promoted: job.promotedStudents,
          retained: job.retainedStudents,
          graduated: job.graduatedStudents,
          failed: job.failedStudents,
        },
      });
    } catch (error) {
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.errors.push(`Batch processing failed: ${error.message}`);

      this.updateProgress(job);

      // Update batch status
      await this.prisma.promotionBatch.update({
        where: { id: batch.id },
        data: {
          status: PromotionStatus.FAILED,
          completedAt: new Date(),
        },
      });

      this.logger.error(`Promotion batch ${batch.id} failed:`, error);
    }
  }

  /**
   * Process individual student promotion
   */
  private async processIndividualPromotion(
    record: any,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async tx => {
      // Update promotion record status
      await tx.promotionRecord.update({
        where: { id: record.id },
        data: {
          status: PromotionStatus.IN_PROGRESS,
          processedAt: new Date(),
        },
      });

      if (record.promotionType === PromotionType.PROMOTED && record.toClassId) {
        // Update student's class
        await tx.student.update({
          where: { id: record.studentId },
          data: {
            classId: record.toClassId,
            academicStatus: 'active',
          },
        });

        // Update class enrollments
        await tx.class.update({
          where: { id: record.fromClassId },
          data: { currentEnrollment: { decrement: 1 } },
        });

        await tx.class.update({
          where: { id: record.toClassId },
          data: { currentEnrollment: { increment: 1 } },
        });
      } else if (record.promotionType === PromotionType.RETAINED) {
        // Student stays in same class - no class change needed
        // Just mark as processed
      } else if (record.promotionType === PromotionType.GRADUATED) {
        // Update student status to graduated
        await tx.student.update({
          where: { id: record.studentId },
          data: {
            academicStatus: 'graduated',
          },
        });

        // Update class enrollment
        await tx.class.update({
          where: { id: record.fromClassId },
          data: { currentEnrollment: { decrement: 1 } },
        });
      }

      // Mark promotion record as completed
      await tx.promotionRecord.update({
        where: { id: record.id },
        data: {
          status: PromotionStatus.COMPLETED,
        },
      });
    });

    // Log individual promotion
    await this.audit.log({
      userId,
      action: 'UPDATE',
      module: 'StudentPromotion',
      status: 'SUCCESS',
      details: {
        studentId: record.studentId,
        promotionType: record.promotionType,
        fromClassId: record.fromClassId,
        toClassId: record.toClassId,
        batchId: record.batchId,
      },
    });
  }

  /**
   * Update progress and notify subscribers
   */
  private updateProgress(job: PromotionJob): void {
    const callback = this.progressCallbacks.get(job.batchId);
    if (callback) {
      callback({ ...job });
    }
  }

  /**
   * Get detailed error message for failed promotions
   */
  private getDetailedErrorMessage(error: any, record: any): string {
    const errorMsg = error.message || 'Unknown error';

    // Common promotion failure reasons
    if (errorMsg.includes('foreign key constraint')) {
      if (errorMsg.includes('classId')) {
        return 'Target class not found or invalid';
      }
      return 'Database constraint violation';
    }

    if (errorMsg.includes('Unique constraint')) {
      return 'Student already exists in target class';
    }

    if (errorMsg.includes('not found')) {
      return 'Student or class record not found';
    }

    if (errorMsg.includes('capacity')) {
      return 'Target class is at full capacity';
    }

    if (record.promotionType === 'PROMOTED' && !record.toClassId) {
      return 'No target class available for promotion';
    }

    if (
      record.promotionType === 'GRADUATED' &&
      record.student.class.grade < 12
    ) {
      return 'Student not in final grade for graduation';
    }

    // Return the original error message if we can't categorize it
    return errorMsg;
  }

  /**
   * Clean up completed jobs (call this periodically)
   */
  cleanupCompletedJobs(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [batchId, job] of this.jobs.entries()) {
      if (
        (job.status === 'COMPLETED' || job.status === 'FAILED') &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(batchId);
        this.progressCallbacks.delete(batchId);
      }
    }
  }
}
