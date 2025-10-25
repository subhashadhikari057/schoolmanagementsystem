/**
 * =============================================================================
 * Promotion Service
 * =============================================================================
 * Service for managing student promotions and academic year transitions.
 * Handles business logic for promotion eligibility, batch processing, and data integrity.
 * =============================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  PreviewPromotionDto,
  ExecutePromotionDto,
  IndividualPromotionDto,
  PromotionPreviewResponseDto,
  PromotionExecutionResult,
  IndividualPromotionResult,
  PromotionStudentResponseDto,
  PromotionSummaryDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearResponseDto,
  PromotionBatchResponseDto,
} from '../dto/promotion.dto';
import { PromotionType, PromotionStatus } from '@prisma/client';
import { PromotionQueueService } from '../services/promotion-queue.service';

@Injectable()
export class PromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queueService: PromotionQueueService,
  ) {}

  /**
   * Debug method to check classes in database
   */
  async debugClasses() {
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        students: {
          where: {
            academicStatus: 'active',
            deletedAt: null,
          },
          select: {
            id: true,
            academicStatus: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });

    // Also get total student count
    const totalStudents = await this.prisma.student.count({
      where: {
        academicStatus: 'active',
        deletedAt: null,
      },
    });

    return {
      totalClasses: classes.length,
      totalActiveStudents: totalStudents,
      classesWithStudents: classes.filter(c => c.students.length > 0).length,
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        status: cls.status,
        studentCount: cls.students.length,
        students: cls.students.map(s => ({
          id: s.id,
          name: s.user.fullName,
          academicStatus: s.academicStatus,
        })),
      })),
    };
  }

  /**
   * Debug method to check promotion batches
   */
  async debugBatches() {
    const batches = await this.prisma.promotionBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        executedBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return {
      totalBatches: batches.length,
      batches: batches.map(batch => ({
        id: batch.id,
        fromAcademicYear: batch.fromAcademicYear,
        toAcademicYear: batch.toAcademicYear,
        status: batch.status,
        totalStudents: batch.totalStudents,
        executedBy: batch.executedBy?.fullName,
        createdAt: batch.createdAt,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
        isStuck:
          batch.status === 'PENDING' &&
          batch.createdAt < new Date(Date.now() - 60 * 60 * 1000),
      })),
    };
  }

  /**
   * Clean up stuck promotion batches
   */
  async cleanupStuckBatches() {
    // First, let's see ALL batches for debugging
    const allBatches = await this.prisma.promotionBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(
      '🔍 DEBUG: All recent promotion batches:',
      allBatches.map(b => ({
        id: b.id.substring(0, 8),
        status: b.status,
        fromYear: b.fromAcademicYear,
        toYear: b.toAcademicYear,
        createdAt: b.createdAt,
        ageInMinutes: Math.floor(
          (Date.now() - b.createdAt.getTime()) / (1000 * 60),
        ),
      })),
    );

    // Very aggressive cleanup - consider batches stuck after 1 minute
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

    // Find stuck batches
    const stuckBatches = await this.prisma.promotionBatch.findMany({
      where: {
        status: { in: [PromotionStatus.PENDING, PromotionStatus.IN_PROGRESS] },
        createdAt: { lt: oneMinuteAgo },
      },
    });

    // console.log('🔍 DEBUG: Found stuck batches:', stuckBatches.length);

    if (stuckBatches.length === 0) {
      // console.log('✅ No stuck batches found');
      return {
        message: 'No stuck batches found',
        cleanedBatches: [],
      };
    }

    // Mark stuck batches as failed
    const cleanedBatches: Array<{
      id: string;
      fromAcademicYear: string;
      toAcademicYear: string;
      createdAt: Date;
      wasStuckFor: string;
    }> = [];

    for (const batch of stuckBatches) {
      const stuckDurationMinutes = Math.round(
        (Date.now() - batch.createdAt.getTime()) / (1000 * 60),
      );

      console.log(
        `🧹 Cleaning stuck batch ${batch.id.substring(0, 8)} (stuck for ${stuckDurationMinutes} minutes)`,
      );

      await this.prisma.promotionBatch.update({
        where: { id: batch.id },
        data: {
          status: PromotionStatus.FAILED,
          completedAt: new Date(),
        },
      });

      cleanedBatches.push({
        id: batch.id,
        fromAcademicYear: batch.fromAcademicYear,
        toAcademicYear: batch.toAcademicYear,
        createdAt: batch.createdAt,
        wasStuckFor: `${stuckDurationMinutes} minutes`,
      });

      // Skip audit logging for now to avoid foreign key constraint issues
      // TODO: Fix audit logging with proper system user
      console.log(
        `📝 Audit: Manual cleanup of stuck batch ${batch.id} (${stuckDurationMinutes} minutes)`,
      );
    }

    const message = `Cleaned up ${cleanedBatches.length} stuck promotion batches`;
    console.log('✅ Cleanup result:', message);

    return {
      message,
      cleanedBatches,
    };
  }

  /**
   * Preview promotions for an academic year
   */
  async previewPromotions(
    dto: PreviewPromotionDto,
    userId: string,
  ): Promise<PromotionPreviewResponseDto> {
    try {
      // First check if there are any classes in the system
      const classCount = await this.prisma.class.count({
        where: { deletedAt: null },
      });

      if (classCount === 0) {
        // Return empty preview instead of throwing error
        return {
          promotionStudents: [],
          summaryByGrade: [],
          totalStats: {
            totalStudents: 0,
            totalPromoting: 0,
            totalStaying: 0,
            totalGraduating: 0,
            totalIneligible: 0,
          },
          fromAcademicYear: dto.academicYear,
          toAcademicYear: this.generateNextAcademicYear(dto.academicYear),
          metadata: {
            hasClasses: false,
            hasStudents: false,
            message:
              'No classes found in the system. Please add classes before running promotions.',
          },
        };
      }

      // Get all active students
      const students = await this.prisma.student.findMany({
        where: {
          academicStatus: 'active',
          deletedAt: null,
          id: dto.excludedStudentIds?.length
            ? { notIn: dto.excludedStudentIds }
            : undefined,
        },
        include: {
          user: true,
          class: true,
        },
      });

      if (students.length === 0) {
        // Check if this is because all students are excluded or truly no students
        const totalStudentCount = await this.prisma.student.count({
          where: { academicStatus: 'active', deletedAt: null },
        });

        const message =
          totalStudentCount === 0
            ? 'No active students found in the system. Please add students to classes before running promotions.'
            : dto.excludedStudentIds?.length > 0
              ? `All ${totalStudentCount} students are selected to stay in their current classes. No students will be promoted.`
              : 'No students available for promotion.';

        // Return empty preview instead of throwing error
        return {
          promotionStudents: [],
          summaryByGrade: [],
          totalStats: {
            totalStudents: totalStudentCount,
            totalPromoting: 0,
            totalStaying: dto.excludedStudentIds?.length || 0,
            totalGraduating: 0,
            totalIneligible: 0,
          },
          fromAcademicYear: dto.academicYear,
          toAcademicYear: this.generateNextAcademicYear(dto.academicYear),
          metadata: {
            hasClasses: true,
            hasStudents: totalStudentCount > 0,
            message,
          },
        };
      }

      // Calculate promotion data for each student
      const promotionStudents: PromotionStudentResponseDto[] = [];
      const gradeStats = new Map<
        number,
        {
          total: number;
          eligible: number;
          ineligible: number;
          promoting: number;
          staying: number;
          graduating: number;
        }
      >();

      for (const student of students) {
        const grade = student.class.grade;

        // Determine promotion type - SIMPLE LOGIC ONLY
        let promotionType: PromotionType;
        let targetGrade: number | null = null;
        let targetSection: string | null = null;

        // Only check if student is manually excluded - no other eligibility tests
        if (dto.excludedStudentIds?.includes(student.id)) {
          promotionType = PromotionType.RETAINED;
        } else if (grade >= 12) {
          promotionType = PromotionType.GRADUATED;
        } else {
          promotionType = PromotionType.PROMOTED;
          targetGrade = grade + 1;
          targetSection = student.class.section; // Keep same section by default
        }

        const promotionStudent: PromotionStudentResponseDto = {
          id: student.id,
          fullName: student.user.fullName,
          rollNumber: student.rollNumber,
          studentId: student.studentId,
          className:
            student.class.name ||
            `Grade ${student.class.grade} ${student.class.section}`,
          currentGrade: grade,
          section: student.class.section,
          academicStatus: student.academicStatus,
          isEligible: true, // Always eligible - let superadmin decide
          ineligibilityReasons: [], // No automatic reasons
          feeStatus: student.feeStatus,
          attendancePercentage: null, // Remove attendance calculation
          gpa: null, // Remove GPA calculation
          promotionType,
          targetGrade,
          targetSection,
        };

        promotionStudents.push(promotionStudent);

        // Update grade statistics
        if (!gradeStats.has(grade)) {
          gradeStats.set(grade, {
            total: 0,
            eligible: 0,
            ineligible: 0,
            promoting: 0,
            staying: 0,
            graduating: 0,
          });
        }

        const stats = gradeStats.get(grade)!;
        stats.total++;
        stats.eligible++; // All students are eligible - superadmin decides

        switch (promotionType) {
          case PromotionType.PROMOTED:
            stats.promoting++;
            break;
          case PromotionType.RETAINED:
            stats.staying++;
            break;
          case PromotionType.GRADUATED:
            stats.graduating++;
            break;
        }
      }

      // Get all real classes from database for summary
      const allClasses = await this.prisma.class.findMany({
        where: {
          deletedAt: null,
          status: 'active', // Only active classes
        },
        orderBy: [{ grade: 'asc' }, { section: 'asc' }],
        include: {
          students: {
            where: {
              academicStatus: 'active',
              deletedAt: null,
            },
          },
        },
      });

      // Create summary by real classes - include ALL classes, even without students
      const summaryByGrade: PromotionSummaryDto[] = allClasses.map(cls => {
        // Get all students in this class
        const allStudentsInClass = cls.students.length;

        // Filter out excluded students for promotion calculations
        const studentsToPromote = cls.students.filter(
          student => !dto.excludedStudentIds?.includes(student.id),
        ).length;

        const studentsToStay = allStudentsInClass - studentsToPromote;
        const grade = cls.grade;

        // Count promotion types for this class
        const promotingStudents = grade >= 12 ? 0 : studentsToPromote;
        const graduatingStudents = grade >= 12 ? studentsToPromote : 0;

        return {
          fromGrade: grade,
          toGrade: grade >= 12 ? ('Graduate' as const) : grade + 1,
          className: cls.name || `Grade ${cls.grade} ${cls.section}`,
          section: cls.section,
          totalStudents: allStudentsInClass,
          eligibleStudents: allStudentsInClass, // All are eligible
          ineligibleStudents: 0, // No automatic ineligibility
          promotingStudents,
          stayingStudents: studentsToStay,
          graduatingStudents,
          // Add target class info for proper display
          targetClassName:
            grade >= 12 ? 'Graduate' : `Grade ${grade + 1} ${cls.section}`,
        };
      }); // Show ALL classes, even those without students

      // Calculate total statistics from class summaries (more accurate)
      const totalStats = {
        totalStudents: summaryByGrade.reduce(
          (sum, cls) => sum + cls.totalStudents,
          0,
        ),
        totalPromoting: summaryByGrade.reduce(
          (sum, cls) => sum + cls.promotingStudents,
          0,
        ),
        totalStaying: summaryByGrade.reduce(
          (sum, cls) => sum + cls.stayingStudents,
          0,
        ),
        totalGraduating: summaryByGrade.reduce(
          (sum, cls) => sum + cls.graduatingStudents,
          0,
        ),
        totalIneligible: 0, // No automatic ineligibility
      };

      const toAcademicYear = this.generateNextAcademicYear(dto.academicYear);

      // Log audit
      await this.audit.log({
        userId,
        action: 'PREVIEW',
        module: 'Promotion',
        status: 'SUCCESS',
        details: {
          academicYear: dto.academicYear,
          toAcademicYear,
          totalStudents: totalStats.totalStudents,
          excludedCount: dto.excludedStudentIds?.length || 0,
        },
      });

      return {
        fromAcademicYear: dto.academicYear,
        toAcademicYear,
        summaryByGrade,
        promotionStudents,
        totalStats,
        metadata: {
          hasClasses: true,
          hasStudents: true,
        },
      };
    } catch (error) {
      await this.audit.log({
        userId,
        action: 'PREVIEW',
        module: 'Promotion',
        status: 'FAIL',
        details: { error: error.message },
      });

      // Re-throw BadRequestException and ConflictException as-is
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // For other errors, provide a more detailed message
      throw new BadRequestException(
        `Failed to preview promotions: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Execute student promotions
   */
  async executePromotions(
    dto: ExecutePromotionDto,
    userId: string,
  ): Promise<PromotionExecutionResult> {
    // First check if there are any classes and students in the system
    const classCount = await this.prisma.class.count({
      where: { deletedAt: null },
    });

    if (classCount === 0) {
      throw new BadRequestException({
        message:
          'No classes found in the system. Please add classes before running promotions.',
        code: 'NO_CLASSES_FOUND',
        action: 'ADD_CLASSES',
      });
    }

    const studentCount = await this.prisma.student.count({
      where: { academicStatus: 'active', deletedAt: null },
    });

    if (studentCount === 0) {
      throw new BadRequestException({
        message:
          'No active students found in the system. Please add students before running promotions.',
        code: 'NO_STUDENTS_FOUND',
        action: 'ADD_STUDENTS',
      });
    }

    // Check if promotion batch already exists
    const existingBatch = await this.prisma.promotionBatch.findFirst({
      where: {
        fromAcademicYear: dto.academicYear,
        toAcademicYear: dto.toAcademicYear,
        status: { in: [PromotionStatus.PENDING, PromotionStatus.IN_PROGRESS] },
      },
    });

    console.log('🔍 DEBUG: Checking for existing batch...');
    console.log(
      '🔍 DEBUG: Academic year:',
      dto.academicYear,
      '->',
      dto.toAcademicYear,
    );
    console.log(
      '🔍 DEBUG: Existing batch found:',
      existingBatch
        ? {
            id: existingBatch.id.substring(0, 8),
            status: existingBatch.status,
            createdAt: existingBatch.createdAt,
            ageInMinutes: Math.floor(
              (Date.now() - existingBatch.createdAt.getTime()) / (1000 * 60),
            ),
          }
        : 'None',
    );

    if (existingBatch) {
      // Very aggressive - consider batches stuck after 1 minute
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

      console.log(
        '🔍 DEBUG: Batch age check - created at:',
        existingBatch.createdAt,
      );
      console.log('🔍 DEBUG: One minute ago:', oneMinuteAgo);
      console.log(
        '🔍 DEBUG: Is stuck?',
        existingBatch.createdAt < oneMinuteAgo,
      );

      if (
        existingBatch.createdAt < oneMinuteAgo &&
        (existingBatch.status === PromotionStatus.PENDING ||
          existingBatch.status === PromotionStatus.IN_PROGRESS)
      ) {
        console.log('🧹 Auto-cleaning stuck batch during execution...');

        // Mark stuck batch as failed and allow new promotion
        await this.prisma.promotionBatch.update({
          where: { id: existingBatch.id },
          data: {
            status: PromotionStatus.FAILED,
            completedAt: new Date(),
          },
        });

        // Log stuck batch cleanup for audit purposes
        await this.audit.log({
          userId: userId || 'SYSTEM',
          action: 'UPDATE',
          module: 'PromotionBatch',
          status: 'SUCCESS',
          details: {
            batchId: existingBatch.id,
            action: 'Auto-marked stuck promotion batch as failed',
            reason: 'Batch was stuck for over 1 minute',
            fromAcademicYear: existingBatch.fromAcademicYear,
            toAcademicYear: existingBatch.toAcademicYear,
            previousStatus: existingBatch.status,
          },
        });

        console.log('✅ Stuck batch cleaned, proceeding with new promotion');
      } else {
        console.log('❌ Batch is not stuck yet, throwing conflict error');
        throw new ConflictException(
          `A promotion batch for academic year ${dto.academicYear} is already in progress. Please wait for it to complete or contact administrator.`,
        );
      }
    }

    try {
      // Get preview data first
      const previewData = await this.previewPromotions(
        {
          academicYear: dto.academicYear,
          excludedStudentIds: dto.excludedStudentIds,
        },
        userId,
      );

      // Create academic year if it doesn't exist
      await this.ensureAcademicYearExists(dto.toAcademicYear);

      // Ensure both academic years exist
      await this.ensureAcademicYearExists(dto.academicYear);

      // Create promotion batch
      const batch = await this.prisma.promotionBatch.create({
        data: {
          academicYearId: (await this.getAcademicYear(dto.academicYear)).id,
          fromAcademicYear: dto.academicYear,
          toAcademicYear: dto.toAcademicYear,
          status: PromotionStatus.PENDING,
          totalStudents: previewData.totalStats.totalStudents,
          executedById: userId,
        },
      });

      // Create promotion records
      const promotionRecords: Array<{
        batchId: string;
        studentId: string;
        fromClassId: string;
        toClassId: string | null;
        promotionType: PromotionType;
        status: PromotionStatus;
        isEligible: boolean;
        ineligibilityReasons: string[];
        attendancePercentage: string | null;
        gpa: string | null;
        reason: string;
      }> = [];

      console.log(
        '🔍 DEBUG: Preview data promotion students:',
        previewData.promotionStudents.length,
      );
      console.log(
        '🔍 DEBUG: Promotion types:',
        previewData.promotionStudents.map(s => ({
          name: s.fullName,
          type: s.promotionType,
          grade: s.currentGrade,
        })),
      );

      for (const student of previewData.promotionStudents) {
        const toClassId = await this.findOrCreateTargetClass(
          student.targetGrade,
          student.targetSection,
          student.promotionType,
        );

        const studentRecord = await this.prisma.student.findUnique({
          where: { id: student.id },
          select: { classId: true },
        });

        if (!studentRecord?.classId) {
          continue; // Skip students without class
        }

        promotionRecords.push({
          batchId: batch.id,
          studentId: student.id,
          fromClassId: studentRecord.classId,
          toClassId,
          promotionType: student.promotionType,
          status: PromotionStatus.PENDING,
          isEligible: student.isEligible,
          ineligibilityReasons: student.ineligibilityReasons,
          attendancePercentage: student.attendancePercentage
            ? student.attendancePercentage.toString()
            : null,
          gpa: student.gpa ? student.gpa.toString() : null,
          reason: dto.reason || 'Annual student promotion',
        });
      }

      await this.prisma.promotionRecord.createMany({
        data: promotionRecords,
      });

      // Log audit
      await this.audit.log({
        userId,
        action: 'CREATE',
        module: 'PromotionBatch',
        status: 'SUCCESS',
        details: {
          batchId: batch.id,
          fromAcademicYear: dto.academicYear,
          toAcademicYear: dto.toAcademicYear,
          totalStudents: previewData.totalStats.totalStudents,
        },
      });

      // Start the promotion job in background queue
      await this.queueService.startPromotionJob(batch.id, userId);

      return {
        success: true,
        batchId: batch.id,
        message:
          'Promotion batch started successfully. Processing in background...',
        totalProcessed: 0, // Will be updated via progress tracking
        promoted: 0,
        retained: 0,
        graduated: 0,
        failed: 0,
      };
    } catch (error) {
      await this.audit.log({
        userId,
        action: 'CREATE',
        module: 'PromotionBatch',
        status: 'FAIL',
        details: { error: error.message },
      });
      throw new BadRequestException('Failed to execute promotions');
    }
  }

  /**
   * Promote individual student
   */
  async promoteIndividualStudent(
    dto: IndividualPromotionDto,
    userId: string,
  ): Promise<IndividualPromotionResult> {
    // Get student details
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // No automatic eligibility checks - superadmin decides

    // Determine promotion type and target class
    const currentGrade = student.class.grade;
    const isGraduating = currentGrade >= 12; // Assuming grade 12 is the final grade

    // Check promotion type based on conditions
    let promotionType: PromotionType;
    if (isGraduating) {
      promotionType = PromotionType.GRADUATED;
    } else {
      // Individual promotion always promotes (unless manually excluded elsewhere)
      promotionType = PromotionType.PROMOTED;
    }

    let targetClassId: string | null = null;
    let targetClassName = 'Graduated';

    if (!isGraduating) {
      // Find or create target class for promotion
      const targetGrade = currentGrade + 1;
      const targetSection = student.class.section;

      targetClassId = await this.findOrCreateTargetClass(
        targetGrade,
        targetSection,
        promotionType,
      );

      const targetClass = await this.prisma.class.findUnique({
        where: { id: targetClassId! },
        select: { name: true },
      });
      targetClassName =
        targetClass?.name || `Grade ${targetGrade} ${targetSection}`;
    }

    try {
      // Start transaction for individual promotion
      await this.prisma.$transaction(async tx => {
        // Create a temporary batch for individual promotion
        const individualBatch = await tx.promotionBatch.create({
          data: {
            academicYearId: (await this.getAcademicYear(dto.academicYear)).id,
            fromAcademicYear: dto.academicYear,
            toAcademicYear: dto.toAcademicYear,
            status: PromotionStatus.COMPLETED,
            totalStudents: 1,
            promotedStudents: isGraduating ? 0 : 1,
            retainedStudents: 0,
            graduatedStudents: isGraduating ? 1 : 0,
            executedById: userId,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });

        // Create promotion record
        await tx.promotionRecord.create({
          data: {
            batchId: individualBatch.id,
            studentId: dto.studentId,
            fromClassId: student.classId,
            toClassId: targetClassId,
            promotionType: promotionType,
            status: PromotionStatus.COMPLETED,
            isEligible: true,
            ineligibilityReasons: [],
            attendancePercentage: null,
            gpa: null,
            reason: dto.reason || 'Individual promotion',
            processedAt: new Date(),
          },
        });

        // Update student's class (only if not graduating)
        if (!isGraduating && targetClassId) {
          await tx.student.update({
            where: { id: dto.studentId },
            data: {
              classId: targetClassId,
              academicStatus: 'active',
            },
          });
        } else {
          // Mark as graduated
          await tx.student.update({
            where: { id: dto.studentId },
            data: {
              academicStatus: 'graduated',
            },
          });
        }

        // Transaction completed successfully
      });

      // Log the promotion
      await this.audit.log({
        action: 'STUDENT_PROMOTION_INDIVIDUAL',
        userId,
        status: 'SUCCESS',
        details: {
          studentId: dto.studentId,
          fromClass: student.class.name,
          toClass: targetClassName,
          promotionType,
          reason: dto.reason,
        },
      });

      // Extract student name from User.fullName (following the same pattern as StudentService)
      const studentFullName = student.user.fullName;

      return {
        success: true,
        message: `${studentFullName} has been successfully ${isGraduating ? 'graduated' : 'promoted'}`,
        studentId: dto.studentId,
        studentName: studentFullName,
        fromClass: student.class.name || 'Unknown Class',
        toClass: targetClassName || 'Graduated',
        promotionType: promotionType as 'PROMOTED' | 'GRADUATED',
        promotionDate: new Date().toISOString(),
      };
    } catch (error) {
      // Log the error
      await this.audit.log({
        action: 'STUDENT_PROMOTION_INDIVIDUAL',
        userId,
        status: 'FAIL',
        details: { error: error.message },
      });
      throw new BadRequestException('Failed to promote student');
    }
  }

  /**
   * Get promotion job progress
   */
  async getPromotionProgress(batchId: string) {
    const progress = this.queueService.getJobProgress(batchId);
    if (progress) {
      return {
        batchId: progress.batchId,
        status: progress.status,
        totalStudents: progress.totalStudents,
        processedStudents: progress.processedStudents,
        promotedStudents: progress.promotedStudents,
        retainedStudents: progress.retainedStudents,
        graduatedStudents: progress.graduatedStudents,
        failedStudents: progress.failedStudents,
        progress:
          progress.totalStudents > 0
            ? Math.round(
                (progress.processedStudents / progress.totalStudents) * 100,
              )
            : 0,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        errors: progress.errors,
      };
    }

    // Fallback to database if not in queue (completed job)
    const batch = await this.prisma.promotionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Promotion batch not found');
    }

    return {
      batchId: batch.id,
      status: batch.status,
      totalStudents: batch.totalStudents,
      processedStudents: batch.totalStudents,
      promotedStudents: batch.promotedStudents,
      retainedStudents: batch.retainedStudents,
      graduatedStudents: batch.graduatedStudents,
      failedStudents: 0,
      progress: 100,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      errors: [],
    };
  }

  /**
   * Revert promotion batch (rollback incomplete or failed promotions)
   */
  async revertPromotionBatch(batchId: string, userId: string) {
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
      throw new NotFoundException('Promotion batch not found');
    }

    // Allow reverting any completed promotion batch (successful or failed)
    if (batch.status !== PromotionStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only revert completed promotion batches',
      );
    }

    let revertedCount = 0;
    let failedRevertCount = 0;
    const errors: string[] = [];

    try {
      // Process each promotion record that was completed
      for (const record of batch.promotionRecords) {
        if (record.status === PromotionStatus.COMPLETED) {
          try {
            await this.prisma.$transaction(async tx => {
              if (
                record.promotionType === PromotionType.PROMOTED &&
                record.toClassId
              ) {
                // Revert student back to original class
                await tx.student.update({
                  where: { id: record.studentId },
                  data: {
                    classId: record.fromClassId,
                    academicStatus: 'active',
                  },
                });

                // Revert class enrollments
                await tx.class.update({
                  where: { id: record.fromClassId },
                  data: { currentEnrollment: { increment: 1 } },
                });

                await tx.class.update({
                  where: { id: record.toClassId },
                  data: { currentEnrollment: { decrement: 1 } },
                });
              } else if (record.promotionType === PromotionType.GRADUATED) {
                // Revert graduated student back to active
                await tx.student.update({
                  where: { id: record.studentId },
                  data: {
                    academicStatus: 'active',
                  },
                });

                // Restore class enrollment
                await tx.class.update({
                  where: { id: record.fromClassId },
                  data: { currentEnrollment: { increment: 1 } },
                });
              }

              // Mark promotion record as reverted
              await tx.promotionRecord.update({
                where: { id: record.id },
                data: {
                  status: PromotionStatus.FAILED, // Use FAILED to indicate reverted
                  processedAt: new Date(),
                },
              });
            });

            revertedCount++;

            // Log individual revert
            await this.audit.log({
              userId,
              action: 'UPDATE',
              module: 'StudentPromotionRevert',
              status: 'SUCCESS',
              details: {
                studentId: record.studentId,
                promotionType: record.promotionType,
                fromClassId: record.fromClassId,
                toClassId: record.toClassId,
                batchId: record.batchId,
              },
            });
          } catch (error) {
            failedRevertCount++;
            errors.push(
              `Failed to revert student ${record.student.user.fullName}: ${(error as Error).message}`,
            );
          }
        }
      }

      // Update batch status
      await this.prisma.promotionBatch.update({
        where: { id: batchId },
        data: {
          status: PromotionStatus.FAILED, // Mark as failed/reverted
          completedAt: new Date(),
        },
      });

      // Log batch revert
      await this.audit.log({
        userId,
        action: 'UPDATE',
        module: 'PromotionBatchRevert',
        status: failedRevertCount > 0 ? 'FAIL' : 'SUCCESS',
        details: {
          batchId,
          revertedCount,
          failedRevertCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      return {
        success: true,
        message: `Successfully reverted ${revertedCount} student promotions${failedRevertCount > 0 ? ` (${failedRevertCount} failed to revert)` : ''}`,
        revertedCount,
        failedRevertCount,
        errors,
      };
    } catch (error) {
      await this.audit.log({
        userId,
        action: 'UPDATE',
        module: 'PromotionBatchRevert',
        status: 'FAIL',
        details: { batchId, error: (error as Error).message },
      });

      throw new BadRequestException(
        `Failed to revert promotion batch: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get promotion batch by ID
   */
  async getPromotionBatch(batchId: string): Promise<PromotionBatchResponseDto> {
    const batch = await this.prisma.promotionBatch.findUnique({
      where: { id: batchId },
      include: {
        executedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Promotion batch not found');
    }

    return {
      id: batch.id,
      fromAcademicYear: batch.fromAcademicYear,
      toAcademicYear: batch.toAcademicYear,
      status: batch.status,
      totalStudents: batch.totalStudents,
      promotedStudents: batch.promotedStudents,
      retainedStudents: batch.retainedStudents,
      graduatedStudents: batch.graduatedStudents,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      executedBy: batch.executedBy,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  /**
   * Process promotion batch - actually update student classes
   */
  async processPromotionBatch(batchId: string, userId: string): Promise<void> {
    const batch = await this.prisma.promotionBatch.findUnique({
      where: { id: batchId },
      include: {
        promotionRecords: {
          include: {
            student: true,
            fromClass: true,
            toClass: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Promotion batch not found');
    }

    // Update batch status to in progress
    await this.prisma.promotionBatch.update({
      where: { id: batchId },
      data: {
        status: PromotionStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    let promoted = 0;
    let retained = 0;
    let graduated = 0;
    let failed = 0;

    // Process each promotion record
    for (const record of batch.promotionRecords) {
      try {
        await this.prisma.$transaction(async tx => {
          // Update promotion record status
          await tx.promotionRecord.update({
            where: { id: record.id },
            data: {
              status: PromotionStatus.IN_PROGRESS,
              processedAt: new Date(),
            },
          });

          if (
            record.promotionType === PromotionType.PROMOTED &&
            record.toClassId
          ) {
            // Update student's class
            await tx.student.update({
              where: { id: record.studentId },
              data: {
                classId: record.toClassId,
                academicStatus: 'active', // Ensure student remains active
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

            promoted++;
          } else if (record.promotionType === PromotionType.RETAINED) {
            // Student stays in same class - no class change needed
            retained++;
          } else if (record.promotionType === PromotionType.GRADUATED) {
            // Update student status to graduated
            await tx.student.update({
              where: { id: record.studentId },
              data: {
                academicStatus: 'graduated',
                // Note: classId stays the same for historical record keeping
              },
            });

            // Update class enrollment
            await tx.class.update({
              where: { id: record.fromClassId },
              data: { currentEnrollment: { decrement: 1 } },
            });

            graduated++;
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
            batchId,
          },
        });
      } catch (error) {
        failed++;

        // Mark promotion record as failed
        await this.prisma.promotionRecord.update({
          where: { id: record.id },
          data: {
            status: PromotionStatus.FAILED,
            reason: error.message,
          },
        });

        // Log failure
        await this.audit.log({
          userId,
          action: 'UPDATE',
          module: 'StudentPromotion',
          status: 'FAIL',
          details: {
            studentId: record.studentId,
            error: error.message,
            batchId,
          },
        });
      }
    }

    // Update batch with final statistics and completion
    await this.prisma.promotionBatch.update({
      where: { id: batchId },
      data: {
        status: failed > 0 ? PromotionStatus.FAILED : PromotionStatus.COMPLETED,
        completedAt: new Date(),
        promotedStudents: promoted,
        retainedStudents: retained,
        graduatedStudents: graduated,
      },
    });

    // Log batch completion
    await this.audit.log({
      userId,
      action: 'UPDATE',
      module: 'PromotionBatch',
      status: failed > 0 ? 'FAIL' : 'SUCCESS',
      details: {
        batchId,
        promoted,
        retained,
        graduated,
        failed,
      },
    });
  }

  /**
   * Academic Year Management
   */
  async createAcademicYear(
    dto: CreateAcademicYearDto,
    userId: string,
  ): Promise<AcademicYearResponseDto> {
    const existingYear = await this.prisma.academicYear.findUnique({
      where: { year: dto.year },
    });

    if (existingYear) {
      throw new ConflictException('Academic year already exists');
    }

    if (dto.isCurrent) {
      // Set all other years to not current
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const academicYear = await this.prisma.academicYear.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });

    return academicYear;
  }

  async getCurrentAcademicYear(): Promise<AcademicYearResponseDto> {
    const currentYear = await this.prisma.academicYear.findFirst({
      where: { isCurrent: true, isActive: true },
    });

    if (!currentYear) {
      throw new NotFoundException('No current academic year found');
    }

    return currentYear;
  }

  async getAllAcademicYears(): Promise<AcademicYearResponseDto[]> {
    return this.prisma.academicYear.findMany({
      where: { isActive: true },
      orderBy: { year: 'desc' },
    });
  }

  async updateAcademicYear(
    id: string,
    dto: UpdateAcademicYearDto,
    userId: string,
  ): Promise<AcademicYearResponseDto> {
    const existingYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!existingYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (dto.isCurrent) {
      // Set all other years to not current
      await this.prisma.academicYear.updateMany({
        where: { id: { not: id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId,
      },
    });
  }

  async setCurrentAcademicYear(
    id: string,
    userId: string,
  ): Promise<AcademicYearResponseDto> {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Set all other years to not current
    await this.prisma.academicYear.updateMany({
      where: { id: { not: id }, isCurrent: true },
      data: { isCurrent: false },
    });

    // Set this year as current
    return this.prisma.academicYear.update({
      where: { id },
      data: {
        isCurrent: true,
        updatedById: userId,
      },
    });
  }

  async getPromotionBatches(
    limit: number = 50,
    offset: number = 0,
  ): Promise<PromotionBatchResponseDto[]> {
    const batches = await this.prisma.promotionBatch.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        executedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return batches.map(batch => ({
      id: batch.id,
      fromAcademicYear: batch.fromAcademicYear,
      toAcademicYear: batch.toAcademicYear,
      status: batch.status,
      totalStudents: batch.totalStudents,
      promotedStudents: batch.promotedStudents,
      retainedStudents: batch.retainedStudents,
      graduatedStudents: batch.graduatedStudents,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      executedBy: batch.executedBy,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    }));
  }

  /**
   * Private helper methods
   */

  private generateNextAcademicYear(currentYear: string): string {
    const [startYear, endYear] = currentYear.split('-').map(Number);
    return `${startYear + 1}-${endYear + 1}`;
  }

  private async ensureAcademicYearExists(year: string): Promise<void> {
    const existing = await this.prisma.academicYear.findUnique({
      where: { year },
    });

    if (!existing) {
      const [startYear, endYear] = year.split('-').map(Number);
      await this.prisma.academicYear.create({
        data: {
          year,
          startDate: new Date(startYear, 3, 1), // April 1st
          endDate: new Date(endYear, 2, 31), // March 31st
          isCurrent: false,
          isActive: true,
        },
      });
    }
  }

  private async getAcademicYear(year: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { year },
    });

    if (!academicYear) {
      throw new NotFoundException(`Academic year ${year} not found`);
    }

    return academicYear;
  }

  private async findOrCreateTargetClass(
    targetGrade: number | null,
    targetSection: string | null,
    promotionType: PromotionType,
  ): Promise<string | null> {
    if (promotionType === PromotionType.GRADUATED) {
      return null;
    }

    if (
      promotionType === PromotionType.RETAINED ||
      !targetGrade ||
      !targetSection
    ) {
      return null; // Will be handled by keeping current class
    }

    // Find existing class for the target grade and section
    const existingClass = await this.prisma.class.findFirst({
      where: {
        grade: targetGrade,
        section: targetSection,
        deletedAt: null,
      },
    });

    if (existingClass) {
      return existingClass.id;
    }

    // Don't create new classes automatically - this should be done manually by admin
    // Instead, throw an error to indicate the target class doesn't exist
    throw new BadRequestException(
      `Target class for Grade ${targetGrade} ${targetSection} does not exist. Please create the class first before running promotions.`,
    );

    // If you want to allow automatic class creation, uncomment below:
    // const firstRoom = await this.prisma.classroom.findFirst({ where: { deletedAt: null } });
    // const firstTeacher = await this.prisma.teacher.findFirst({ where: { deletedAt: null } });
    //
    // if (!firstRoom || !firstTeacher) {
    //   throw new BadRequestException(
    //     `Cannot create target class for Grade ${targetGrade} ${targetSection}: No available rooms or teachers found.`
    //   );
    // }
    //
    // const newClass = await this.prisma.class.create({
    //   data: {
    //     name: `Grade ${targetGrade} ${targetSection}`,
    //     grade: targetGrade,
    //     section: targetSection,
    //     capacity: 40,
    //     roomId: firstRoom.id,
    //     classTeacherId: firstTeacher.id,
    //   },
    // });
    //
    // return newClass.id;
  }
}
