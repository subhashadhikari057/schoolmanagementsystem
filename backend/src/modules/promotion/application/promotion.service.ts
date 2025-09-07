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
  PromotionPreviewResponseDto,
  PromotionExecutionResult,
  PromotionStudentResponseDto,
  PromotionSummaryDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  AcademicYearResponseDto,
  PromotionBatchResponseDto,
} from '../dto/promotion.dto';
import { PromotionType, PromotionStatus } from '@prisma/client';

@Injectable()
export class PromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
          attendanceRecords: {
            where: {
              createdAt: {
                gte: new Date(new Date().getFullYear(), 3, 1), // April 1st
                lte: new Date(new Date().getFullYear() + 1, 2, 31), // March 31st
              },
            },
          },
          examResults: {
            include: {
              examSlot: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      });

      if (students.length === 0) {
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
            hasClasses: true,
            hasStudents: false,
            message:
              'No active students found in the system. Please add students to classes before running promotions.',
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
        const attendance = this.calculateAttendancePercentage(
          student.attendanceRecords,
        );
        const gpa = await this.calculateGPA(student.examResults);
        const eligibilityCheck = this.checkEligibility(
          attendance,
          gpa,
          student.feeStatus,
        );

        // Determine promotion type
        let promotionType: PromotionType;
        let targetGrade: number | null = null;
        let targetSection: string | null = null;

        if (
          !eligibilityCheck.isEligible ||
          dto.excludedStudentIds?.includes(student.id)
        ) {
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
          isEligible: eligibilityCheck.isEligible,
          ineligibilityReasons: eligibilityCheck.reasons,
          feeStatus: student.feeStatus,
          attendancePercentage: attendance,
          gpa,
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

        if (eligibilityCheck.isEligible) {
          stats.eligible++;
        } else {
          stats.ineligible++;
        }

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

      // Create summary by grade
      const summaryByGrade: PromotionSummaryDto[] = Array.from(
        gradeStats.entries(),
      )
        .sort(([a], [b]) => a - b)
        .map(([grade, stats]) => ({
          fromGrade: grade,
          toGrade: grade >= 12 ? ('Graduate' as const) : grade + 1,
          totalStudents: stats.total,
          eligibleStudents: stats.eligible,
          ineligibleStudents: stats.ineligible,
          promotingStudents: stats.promoting,
          stayingStudents: stats.staying,
          graduatingStudents: stats.graduating,
        }));

      // Calculate total statistics
      const totalStats = {
        totalStudents: promotionStudents.length,
        totalPromoting: promotionStudents.filter(
          s => s.promotionType === PromotionType.PROMOTED,
        ).length,
        totalStaying: promotionStudents.filter(
          s => s.promotionType === PromotionType.RETAINED,
        ).length,
        totalGraduating: promotionStudents.filter(
          s => s.promotionType === PromotionType.GRADUATED,
        ).length,
        totalIneligible: promotionStudents.filter(s => !s.isEligible).length,
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

    if (existingBatch) {
      throw new ConflictException(
        'A promotion batch for this academic year is already in progress',
      );
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
      const promotionRecords: any[] = [];
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
          reason: dto.reason,
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

      // Execute the actual promotions
      await this.processPromotionBatch(batch.id, userId);

      return {
        success: true,
        batchId: batch.id,
        message: 'Promotion batch executed successfully.',
        totalProcessed: previewData.totalStats.totalStudents,
        promoted: previewData.totalStats.totalPromoting,
        retained: previewData.totalStats.totalStaying,
        graduated: previewData.totalStats.totalGraduating,
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
  private calculateAttendancePercentage(
    attendanceRecords: { status: string }[],
  ): number | null {
    if (attendanceRecords.length === 0) return null;

    const presentCount = attendanceRecords.filter(
      record => record.status === 'present',
    ).length;
    return (
      Math.round((presentCount / attendanceRecords.length) * 100 * 100) / 100
    );
  }

  private async calculateGPA(examResults: any[]): Promise<number | null> {
    if (examResults.length === 0) return null;

    const validResults = examResults.filter(
      result => result.marksObtained !== null && result.totalMarks > 0,
    );
    if (validResults.length === 0) return null;

    const totalPoints = validResults.reduce((sum, result) => {
      const percentage = (result.marksObtained! / result.totalMarks) * 100;
      return sum + this.percentageToGradePoint(percentage);
    }, 0);

    return Math.round((totalPoints / validResults.length) * 100) / 100;
  }

  private percentageToGradePoint(percentage: number): number {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.5;
    if (percentage >= 70) return 3.0;
    if (percentage >= 60) return 2.5;
    if (percentage >= 50) return 2.0;
    if (percentage >= 40) return 1.5;
    return 0.0;
  }

  private checkEligibility(
    attendance: number | null,
    gpa: number | null,
    feeStatus: string,
  ): { isEligible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check attendance (minimum 75%)
    if (attendance !== null && attendance < 75) {
      reasons.push(`Low attendance: ${attendance}%`);
    }

    // Check GPA (minimum 2.0)
    if (gpa !== null && gpa < 2.0) {
      reasons.push(`Low GPA: ${gpa}`);
    }

    // Check fee status
    if (feeStatus === 'pending' || feeStatus === 'overdue') {
      reasons.push('Outstanding fees');
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }

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

    // Create new class if it doesn't exist
    // This is a simplified version - in production, you might want to handle this differently
    const newClass = await this.prisma.class.create({
      data: {
        name: `Grade ${targetGrade} ${targetSection}`,
        grade: targetGrade,
        section: targetSection,
        capacity: 40, // Default capacity
        roomId: (await this.prisma.classroom.findFirst())?.id || '', // Assign first available room
        classTeacherId: (await this.prisma.teacher.findFirst())?.id || '', // Assign first available teacher
      },
    });

    return newClass.id;
  }
}
