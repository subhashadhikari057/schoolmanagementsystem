import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import * as PDFDocument from 'pdfkit';
import * as JSZip from 'jszip';
import { ExamResultStatus } from '../dto/grading.dto';
import {
  CreateGradingScaleDtoType,
  UpdateGradingScaleDtoType,
  CreateExamResultDtoType,
  UpdateExamResultDtoType,
  BulkGradeStudentsDtoType,
  GetClassGradingDtoType,
  GetSubjectGradingDtoType,
  PublishResultsDtoType,
  GradingPermissionDtoType,
  GradingScaleResponseDto,
  ExamResultResponseDto,
  ClassGradingDataResponseDto,
  SubjectGradingDataResponseDto,
  BulkGridGradingDtoType,
  GetGridGradingDataDtoType,
  GridGradingDataResponseDto,
  GetStudentGradeHistoryDtoType,
  StudentGradeHistoryDto,
  GridGradingStudentDto,
} from '../dto/grading.dto';

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private convertExamResultToDto(result: any): ExamResultResponseDto {
    return {
      ...result,
      marksObtained: result.marksObtained
        ? Number(result.marksObtained)
        : undefined,
      grade: result.grade
        ? {
            ...result.grade,
            minMarks: Number(result.grade.minMarks),
            maxMarks: Number(result.grade.maxMarks),
            gradePoint: result.grade.gradePoint
              ? Number(result.grade.gradePoint)
              : undefined,
          }
        : undefined,
      examSlot: result.examSlot
        ? {
            ...result.examSlot,
            subject: result.examSlot.subject
              ? {
                  ...result.examSlot.subject,
                  maxMarks: Number(result.examSlot.subject.maxMarks),
                  passMarks: Number(result.examSlot.subject.passMarks),
                }
              : undefined,
          }
        : undefined,
    } as ExamResultResponseDto;
  }

  // Grading Scale Management
  async createGradingScale(
    data: CreateGradingScaleDtoType,
    userId: string,
    userRole: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<GradingScaleResponseDto> {
    // Only super admin and admin can create grading scales
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions to create grading scale',
      );
    }

    // Validate grade definitions don't overlap
    this.validateGradeDefinitions(data.gradeDefinitions);

    const gradingScale = await this.prisma.gradingScale.create({
      data: {
        academicYear: data.academicYear,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault,
        createdById: userId,
        gradeDefinitions: {
          create: data.gradeDefinitions.map(def => ({
            grade: def.grade,
            minMarks: def.minMarks,
            maxMarks: def.maxMarks,
            gradePoint: def.gradePoint,
            description: def.description,
            color: def.color,
            createdById: userId,
          })),
        },
      },
      include: {
        gradeDefinitions: true,
      },
    });

    await this.audit.record({
      userId,
      action: 'CREATE_GRADING_SCALE',
      module: 'grading',
      status: 'SUCCESS',
      details: {
        gradingScaleId: gradingScale.id,
        academicYear: data.academicYear,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      ...gradingScale,
      gradeDefinitions: gradingScale.gradeDefinitions.map(def => ({
        ...def,
        minMarks: Number(def.minMarks),
        maxMarks: Number(def.maxMarks),
        gradePoint: def.gradePoint ? Number(def.gradePoint) : undefined,
      })),
    } as GradingScaleResponseDto;
  }

  async getGradingScales(
    academicYear?: string,
  ): Promise<GradingScaleResponseDto[]> {
    const gradingScales = await this.prisma.gradingScale.findMany({
      where: {
        ...(academicYear && { academicYear }),
        deletedAt: null,
      },
      include: {
        gradeDefinitions: {
          where: { deletedAt: null },
          orderBy: { minMarks: 'desc' },
        },
      },
      orderBy: [
        { academicYear: 'desc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return gradingScales.map(scale => ({
      ...scale,
      gradeDefinitions: scale.gradeDefinitions.map(def => ({
        ...def,
        minMarks: Number(def.minMarks),
        maxMarks: Number(def.maxMarks),
        gradePoint: def.gradePoint ? Number(def.gradePoint) : undefined,
      })),
    })) as GradingScaleResponseDto[];
  }

  async getDefaultGradingScale(
    academicYear: string,
  ): Promise<GradingScaleResponseDto | null> {
    const gradingScale = await this.prisma.gradingScale.findFirst({
      where: {
        academicYear,
        isDefault: true,
        deletedAt: null,
      },
      include: {
        gradeDefinitions: {
          where: { deletedAt: null },
          orderBy: { minMarks: 'desc' },
        },
      },
    });

    return gradingScale
      ? ({
          ...gradingScale,
          gradeDefinitions: gradingScale.gradeDefinitions.map(def => ({
            ...def,
            minMarks: Number(def.minMarks),
            maxMarks: Number(def.maxMarks),
            gradePoint: def.gradePoint ? Number(def.gradePoint) : undefined,
          })),
        } as GradingScaleResponseDto)
      : null;
  }

  // Permission Management
  async checkGradingPermission(
    userId: string,
    userRole: UserRole,
    subjectId: string,
    classId: string,
  ): Promise<boolean> {
    // Super admin can grade everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can grade everything
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Teachers can only grade subjects they are assigned to
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });

      if (!teacher) {
        return false;
      }

      // Check if teacher has permission for this subject and class
      const permission = await this.prisma.gradingPermission.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId,
          classId,
          canGrade: true,
          deletedAt: null,
        },
      });

      if (permission) {
        return true;
      }

      // Check if teacher is assigned to this subject and class through ClassSubject
      const classSubject = await this.prisma.classSubject.findFirst({
        where: {
          classId,
          subjectId,
          teacherId: teacher.id,
          deletedAt: null,
        },
      });

      return !!classSubject;
    }

    return false;
  }

  async checkModificationPermission(
    userId: string,
    userRole: UserRole,
    subjectId: string,
    classId: string,
  ): Promise<boolean> {
    // Super admin can modify everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can modify everything
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Teachers need specific permission to modify
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, deletedAt: null },
      });

      if (!teacher) {
        return false;
      }

      const permission = await this.prisma.gradingPermission.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId,
          classId,
          canModify: true,
          deletedAt: null,
        },
      });

      return !!permission;
    }

    return false;
  }

  // Class-wise Grading
  async getClassGradingData(
    data: GetClassGradingDtoType,
    userId: string,
    userRole: UserRole,
  ): Promise<ClassGradingDataResponseDto> {
    // Get exam schedule and slots
    const examSchedule = await this.prisma.examSchedule.findFirst({
      where: {
        classId: data.classId,
        calendarEntryId: data.calendarEntryId,
        ...(data.examScheduleId && { id: data.examScheduleId }),
        deletedAt: null,
      },
      include: {
        class: true,
        examSlots: {
          where: { deletedAt: null },
          include: {
            subject: true,
            dateslot: true,
            examResults: {
              include: {
                student: {
                  include: { user: true },
                },
                grade: true,
                gradedBy: {
                  select: { id: true, fullName: true },
                },
                lastModifiedBy: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
          orderBy: [
            { dateslot: { examDate: 'asc' } },
            { dateslot: { startTime: 'asc' } },
          ],
        },
      },
    });

    if (!examSchedule) {
      throw new NotFoundException('Exam schedule not found');
    }

    // Check permissions for each subject
    const subjects: any[] = [];
    for (const slot of examSchedule.examSlots) {
      if (slot.subject) {
        const hasPermission = await this.checkGradingPermission(
          userId,
          userRole,
          slot.subject.id,
          data.classId,
        );

        if (hasPermission) {
          subjects.push({
            id: slot.subject.id,
            name: slot.subject.name,
            code: slot.subject.code,
            maxMarks: Number(slot.subject.maxMarks),
            passMarks: Number(slot.subject.passMarks),
            examSlot: {
              id: slot.id,
              examDate: slot.dateslot.examDate,
              startTime: slot.dateslot.startTime,
              endTime: slot.dateslot.endTime,
            },
          });
        }
      }
    }

    // Get all students in the class
    const students = await this.prisma.student.findMany({
      where: {
        classId: data.classId,
        deletedAt: null,
      },
      include: {
        user: true,
        examResults: {
          where: {
            examSlot: {
              examScheduleId: examSchedule.id,
            },
          },
          include: {
            grade: true,
            gradedBy: {
              select: { id: true, fullName: true },
            },
            lastModifiedBy: {
              select: { id: true, fullName: true },
            },
            examSlot: {
              include: {
                subject: true,
                dateslot: true,
              },
            },
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Get grading scale
    const gradingScale = await this.getDefaultGradingScale(
      examSchedule.academicYear,
    );

    return {
      class: {
        id: examSchedule.class.id,
        grade: examSchedule.class.grade,
        section: examSchedule.class.section,
      },
      examSchedule: {
        id: examSchedule.id,
        name: examSchedule.name,
        academicYear: examSchedule.academicYear,
      },
      subjects,
      students: students.map(student => ({
        id: student.id,
        rollNumber: student.rollNumber,
        user: {
          fullName: student.user.fullName,
        },
        results: student.examResults.map(result =>
          this.convertExamResultToDto(result),
        ),
      })),
      gradingScale: gradingScale || undefined,
    };
  }

  // Subject-wise Grading
  async getSubjectGradingData(
    data: GetSubjectGradingDtoType,
    userId: string,
    userRole: UserRole,
  ): Promise<SubjectGradingDataResponseDto> {
    // Check permission for this subject
    const hasPermission = data.classIds
      ? await Promise.all(
          data.classIds.map(classId =>
            this.checkGradingPermission(
              userId,
              userRole,
              data.subjectId,
              classId,
            ),
          ),
        ).then(results => results.every(Boolean))
      : true; // If no specific classes, we'll filter later

    if (!hasPermission && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions for this subject');
    }

    // Get subject details
    const subject = await this.prisma.subject.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException('Subject not found');
    }

    // Get exam slots for this subject
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        subjectId: data.subjectId,
        dateslot: {
          calendarEntryId: data.calendarEntryId,
        },
        ...(data.classIds && {
          examSchedule: {
            classId: { in: data.classIds },
          },
        }),
        deletedAt: null,
      },
      include: {
        examSchedule: {
          include: { class: true },
        },
        dateslot: true,
        examResults: {
          include: {
            student: {
              include: { user: true },
            },
            grade: true,
            gradedBy: {
              select: { id: true, fullName: true },
            },
            lastModifiedBy: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    // Group by class
    const classesMap = new Map();
    for (const slot of examSlots) {
      const classId = slot.examSchedule.classId;

      // Check permission for this specific class if teacher
      if (userRole === UserRole.TEACHER) {
        const classPermission = await this.checkGradingPermission(
          userId,
          userRole,
          data.subjectId,
          classId,
        );
        if (!classPermission) {
          continue;
        }
      }

      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: slot.examSchedule.class.id,
          grade: slot.examSchedule.class.grade,
          section: slot.examSchedule.class.section,
          examSlot: {
            id: slot.id,
            examDate: slot.dateslot.examDate,
            startTime: slot.dateslot.startTime,
            endTime: slot.dateslot.endTime,
          },
          students: [],
        });
      }

      // Add students and their results
      const classData = classesMap.get(classId);
      for (const result of slot.examResults) {
        const existingStudent = classData.students.find(
          s => s.id === result.student.id,
        );
        if (!existingStudent) {
          classData.students.push({
            id: result.student.id,
            rollNumber: result.student.rollNumber,
            user: {
              fullName: result.student.user.fullName,
            },
            result: this.convertExamResultToDto(result),
          });
        }
      }
    }

    // Get grading scale (assuming same academic year for all classes)
    const firstSlot = examSlots[0];
    let gradingScale: GradingScaleResponseDto | null = null;
    if (firstSlot) {
      gradingScale = await this.getDefaultGradingScale(
        firstSlot.examSchedule.academicYear,
      );
    }

    return {
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        maxMarks: subject.maxMarks,
        passMarks: subject.passMarks,
      },
      classes: Array.from(classesMap.values()),
      gradingScale: gradingScale || undefined,
    };
  }

  // Individual Result Management
  async createExamResult(
    data: CreateExamResultDtoType,
    userId: string,
    userRole: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<ExamResultResponseDto> {
    // Get exam slot details to check permissions
    const examSlot = await this.prisma.examSlot.findUnique({
      where: { id: data.examSlotId },
      include: {
        subject: true,
        examSchedule: { include: { class: true } },
      },
    });

    if (!examSlot || examSlot.deletedAt) {
      throw new NotFoundException('Exam slot not found');
    }

    if (!examSlot.subject) {
      throw new BadRequestException('Exam slot has no subject assigned');
    }

    // Check permissions
    const hasPermission = await this.checkGradingPermission(
      userId,
      userRole,
      examSlot.subject.id,
      examSlot.examSchedule.classId,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to grade this exam',
      );
    }

    // Validate marks against max marks
    if (
      data.marksObtained &&
      data.marksObtained > Number(examSlot.subject!.maxMarks)
    ) {
      throw new BadRequestException('Marks obtained cannot exceed max marks');
    }

    // Calculate grade if marks provided
    let gradeId = data.gradeId;
    if (data.marksObtained && !gradeId) {
      const percentage =
        (data.marksObtained / Number(examSlot.subject!.maxMarks)) * 100;
      const gradingScale = await this.getDefaultGradingScale(
        examSlot.examSchedule.academicYear,
      );
      if (gradingScale) {
        const grade = gradingScale.gradeDefinitions.find(
          g => percentage >= g.minMarks && percentage <= g.maxMarks,
        );
        if (grade) {
          gradeId = grade.id;
        }
      }
    }

    const isPassed = data.isAbsent
      ? false
      : data.marksObtained
        ? data.marksObtained >= Number(examSlot.subject.passMarks)
        : false;

    const examResult = await this.prisma.examResult.create({
      data: {
        examSlotId: data.examSlotId,
        studentId: data.studentId,
        marksObtained: data.marksObtained,
        // maxMarks comes from subject, not stored in ExamResult
        gradeId,
        remarks: data.remarks,
        isAbsent: data.isAbsent,
        isPassed,
        status: ExamResultStatus.DRAFT,
        gradedAt: new Date(),
        gradedById: userId,
        createdById: userId,
      },
      include: {
        student: {
          include: { user: true },
        },
        grade: true,
        gradedBy: {
          select: { id: true, fullName: true },
        },
        examSlot: {
          include: {
            subject: true,
            dateslot: true,
          },
        },
      },
    });

    await this.audit.record({
      userId,
      action: 'CREATE_EXAM_RESULT',
      module: 'grading',
      status: 'SUCCESS',
      details: {
        examResultId: examResult.id,
        studentId: data.studentId,
        examSlotId: data.examSlotId,
        marksObtained: data.marksObtained,
      },
      ipAddress: ip,
      userAgent,
    });

    return this.convertExamResultToDto(examResult);
  }

  async updateExamResult(
    resultId: string,
    data: UpdateExamResultDtoType,
    userId: string,
    userRole: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<ExamResultResponseDto> {
    // Get existing result
    const existingResult = await this.prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        examSlot: {
          include: {
            subject: true,
            examSchedule: { include: { class: true } },
          },
        },
      },
    });

    if (!existingResult || existingResult.deletedAt) {
      throw new NotFoundException('Exam result not found');
    }

    // Check permissions
    const hasPermission = await this.checkModificationPermission(
      userId,
      userRole,
      existingResult.examSlot.subject!.id,
      existingResult.examSlot.examSchedule.classId,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to modify this result',
      );
    }

    // Validate marks if provided
    if (
      data.marksObtained &&
      data.marksObtained > Number(existingResult.examSlot.subject!.maxMarks)
    ) {
      throw new BadRequestException('Marks obtained cannot exceed max marks');
    }

    // Calculate grade if marks changed
    let gradeId = data.gradeId;
    if (data.marksObtained !== undefined && !gradeId) {
      const percentage =
        (data.marksObtained /
          Number(existingResult.examSlot.subject!.maxMarks)) *
        100;
      const gradingScale = await this.getDefaultGradingScale(
        existingResult.examSlot.examSchedule.academicYear,
      );
      if (gradingScale) {
        const grade = gradingScale.gradeDefinitions.find(
          g => percentage >= g.minMarks && percentage <= g.maxMarks,
        );
        if (grade) {
          gradeId = grade.id;
        }
      }
    }

    const isPassed = data.isAbsent
      ? false
      : (data.marksObtained ?? existingResult.marksObtained)
        ? (data.marksObtained ?? Number(existingResult.marksObtained!)) >=
          Number(existingResult.examSlot.subject!.passMarks)
        : false;

    // Create modification history entry
    const modificationEntry = {
      timestamp: new Date().toISOString(),
      modifiedBy: userId,
      reason: data.modificationReason,
      changes: {
        ...(data.marksObtained !== undefined && {
          marksObtained: {
            from: existingResult.marksObtained,
            to: data.marksObtained,
          },
        }),
        ...(data.gradeId && {
          gradeId: { from: existingResult.gradeId, to: data.gradeId },
        }),
        ...(data.remarks && {
          remarks: { from: existingResult.remarks, to: data.remarks },
        }),
        ...(data.isAbsent !== undefined && {
          isAbsent: { from: existingResult.isAbsent, to: data.isAbsent },
        }),
      },
    };

    const currentHistory = (existingResult.modificationHistory as any[]) || [];
    const updatedHistory = [...currentHistory, modificationEntry];

    const updatedResult = await this.prisma.examResult.update({
      where: { id: resultId },
      data: {
        ...(data.marksObtained !== undefined && {
          marksObtained: data.marksObtained,
        }),
        ...(gradeId && { gradeId }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
        ...(data.isAbsent !== undefined && { isAbsent: data.isAbsent }),
        isPassed,
        lastModifiedAt: new Date(),
        lastModifiedById: userId,
        modificationHistory: updatedHistory,
        updatedAt: new Date(),
        updatedById: userId,
      },
      include: {
        student: {
          include: { user: true },
        },
        grade: true,
        gradedBy: {
          select: { id: true, fullName: true },
        },
        lastModifiedBy: {
          select: { id: true, fullName: true },
        },
        examSlot: {
          include: {
            subject: true,
            dateslot: true,
          },
        },
      },
    });

    await this.audit.record({
      userId,
      action: 'UPDATE_EXAM_RESULT',
      module: 'grading',
      status: 'SUCCESS',
      details: {
        examResultId: resultId,
        changes: modificationEntry.changes,
        reason: data.modificationReason,
      },
      ipAddress: ip,
      userAgent,
    });

    return this.convertExamResultToDto(updatedResult);
  }

  async bulkGradeStudents(
    data: BulkGradeStudentsDtoType,
    userId: string,
    userRole: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<ExamResultResponseDto[]> {
    // Get exam slot details
    const examSlot = await this.prisma.examSlot.findUnique({
      where: { id: data.examSlotId },
      include: {
        subject: true,
        examSchedule: { include: { class: true } },
      },
    });

    if (!examSlot || examSlot.deletedAt) {
      throw new NotFoundException('Exam slot not found');
    }

    if (!examSlot.subject) {
      throw new BadRequestException('Exam slot has no subject assigned');
    }

    // Check permissions
    const hasPermission = await this.checkGradingPermission(
      userId,
      userRole,
      examSlot.subject.id,
      examSlot.examSchedule.classId,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to grade this exam',
      );
    }

    // Get grading scale
    const gradingScale = await this.getDefaultGradingScale(
      examSlot.examSchedule.academicYear,
    );

    const results: ExamResultResponseDto[] = [];
    for (const resultData of data.results) {
      // Calculate grade if marks provided
      let gradeId = resultData.gradeId;
      if (resultData.marksObtained && !gradeId && gradingScale) {
        const percentage =
          (resultData.marksObtained / Number(examSlot.subject.maxMarks)) * 100;
        const grade = gradingScale.gradeDefinitions.find(
          g => percentage >= g.minMarks && percentage <= g.maxMarks,
        );
        if (grade) {
          gradeId = grade.id;
        }
      }

      const isPassed = resultData.isAbsent
        ? false
        : resultData.marksObtained
          ? resultData.marksObtained >= Number(examSlot.subject.passMarks)
          : false;

      const result = await this.prisma.examResult.upsert({
        where: {
          examSlotId_studentId: {
            examSlotId: data.examSlotId,
            studentId: resultData.studentId,
          },
        },
        create: {
          examSlotId: data.examSlotId,
          studentId: resultData.studentId,
          marksObtained: resultData.marksObtained,
          // maxMarks comes from subject, not stored in ExamResult
          gradeId,
          remarks: resultData.remarks,
          isAbsent: resultData.isAbsent,
          isPassed,
          status: ExamResultStatus.DRAFT,
          gradedAt: new Date(),
          gradedById: userId,
          createdById: userId,
        },
        update: {
          marksObtained: resultData.marksObtained,
          gradeId,
          remarks: resultData.remarks,
          isAbsent: resultData.isAbsent,
          isPassed,
          lastModifiedAt: new Date(),
          lastModifiedById: userId,
          updatedAt: new Date(),
          updatedById: userId,
        },
        include: {
          student: {
            include: { user: true },
          },
          grade: true,
          gradedBy: {
            select: { id: true, fullName: true },
          },
          lastModifiedBy: {
            select: { id: true, fullName: true },
          },
          examSlot: {
            include: {
              subject: true,
              dateslot: true,
            },
          },
        },
      });

      results.push(this.convertExamResultToDto(result));
    }

    await this.audit.record({
      userId,
      action: 'BULK_GRADE_STUDENTS',
      module: 'grading',
      status: 'SUCCESS',
      details: {
        examSlotId: data.examSlotId,
        studentsCount: data.results.length,
      },
      ipAddress: ip,
      userAgent,
    });

    return results;
  }

  async publishResults(
    data: PublishResultsDtoType,
    userId: string,
    userRole: UserRole,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string; publishedCount: number }> {
    // Only admin and super admin can publish results
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions to publish results',
      );
    }

    // Find all exam results for this calendar entry
    const updatedResults = await this.prisma.examResult.updateMany({
      where: {
        examSlot: {
          examSchedule: {
            calendarEntryId: data.calendarEntryId,
          },
        },
        status: ExamResultStatus.DRAFT,
        deletedAt: null,
      },
      data: {
        status: ExamResultStatus.PUBLISHED,
        updatedAt: new Date(),
        updatedById: userId,
      },
    });

    await this.audit.record({
      userId,
      action: 'PUBLISH_RESULTS',
      module: 'grading',
      status: 'SUCCESS',
      details: {
        calendarEntryId: data.calendarEntryId,
        publishedCount: updatedResults.count,
        remarks: data.publishRemarks,
      },
      ipAddress: ip,
      userAgent,
    });

    return {
      message: 'Results published successfully',
      publishedCount: updatedResults.count,
    };
  }

  // Helper methods
  private validateGradeDefinitions(gradeDefinitions: any[]) {
    // Check for overlapping ranges
    for (let i = 0; i < gradeDefinitions.length; i++) {
      for (let j = i + 1; j < gradeDefinitions.length; j++) {
        const grade1 = gradeDefinitions[i];
        const grade2 = gradeDefinitions[j];

        if (
          (grade1.minMarks <= grade2.maxMarks &&
            grade1.maxMarks >= grade2.minMarks) ||
          (grade2.minMarks <= grade1.maxMarks &&
            grade2.maxMarks >= grade1.minMarks)
        ) {
          throw new BadRequestException(
            `Grade definitions overlap: ${grade1.grade} and ${grade2.grade}`,
          );
        }
      }
    }

    // Check for duplicate grades
    const grades = gradeDefinitions.map(g => g.grade);
    const uniqueGrades = new Set(grades);
    if (grades.length !== uniqueGrades.size) {
      throw new BadRequestException('Duplicate grade definitions found');
    }
  }

  private calculateGrade(
    marks: number,
    maxMarks: number,
    gradeDefinitions: any[],
  ) {
    const percentage = (marks / maxMarks) * 100;
    return gradeDefinitions.find(
      g => percentage >= g.minMarks && percentage <= g.maxMarks,
    );
  }

  // Grading Permission Management
  async createGradingPermission(
    data: GradingPermissionDtoType,
    userId: string,
    userRole: UserRole,
  ): Promise<any> {
    // Only admin and super admin can manage permissions
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions to manage grading permissions',
      );
    }

    return this.prisma.gradingPermission.upsert({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          classId: data.classId,
        },
      },
      create: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
        canGrade: data.canGrade,
        canModify: data.canModify,
        createdById: userId,
      },
      update: {
        canGrade: data.canGrade,
        canModify: data.canModify,
        updatedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async getTeacherGradingPermissions(teacherId: string): Promise<any[]> {
    return this.prisma.gradingPermission.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        subject: true,
        class: true,
      },
    });
  }

  async getExamSlotResults(
    examSlotId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ExamResultResponseDto[]> {
    // Get exam slot details to check permissions
    const examSlot = await this.prisma.examSlot.findUnique({
      where: { id: examSlotId },
      include: {
        subject: true,
        examSchedule: { include: { class: true } },
      },
    });

    if (!examSlot || examSlot.deletedAt) {
      throw new NotFoundException('Exam slot not found');
    }

    if (!examSlot.subject) {
      throw new BadRequestException('Exam slot has no subject assigned');
    }

    // Check permissions
    const hasPermission = await this.checkGradingPermission(
      userId,
      userRole,
      examSlot.subject.id,
      examSlot.examSchedule.classId,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to view these results',
      );
    }

    const results = await this.prisma.examResult.findMany({
      where: {
        examSlotId,
        deletedAt: null,
      },
      include: {
        student: {
          include: { user: true },
        },
        grade: true,
        gradedBy: {
          select: { id: true, fullName: true },
        },
        lastModifiedBy: {
          select: { id: true, fullName: true },
        },
        examSlot: {
          include: {
            subject: true,
            dateslot: true,
          },
        },
      },
      orderBy: [{ student: { rollNumber: 'asc' } }],
    });

    return results.map(result => this.convertExamResultToDto(result));
  }

  async getStudentResults(
    studentId: string,
    academicYear?: string,
    examSlotId?: string,
  ): Promise<ExamResultResponseDto[]> {
    const results = await this.prisma.examResult.findMany({
      where: {
        studentId,
        ...(examSlotId && { examSlotId }),
        ...(academicYear && {
          examSlot: {
            examSchedule: {
              academicYear,
            },
          },
        }),
        deletedAt: null,
      },
      include: {
        grade: true,
        gradedBy: {
          select: { id: true, fullName: true },
        },
        lastModifiedBy: {
          select: { id: true, fullName: true },
        },
        examSlot: {
          include: {
            subject: true,
            dateslot: true,
            examSchedule: {
              include: { class: true },
            },
          },
        },
      },
      orderBy: [
        { examSlot: { dateslot: { examDate: 'desc' } } },
        { examSlot: { subject: { name: 'asc' } } },
      ],
    });

    return results.map(result => this.convertExamResultToDto(result));
  }

  // Grid Grading Methods
  async getGridGradingData(
    data: GetGridGradingDataDtoType,
    userId: string,
    userRole: UserRole,
  ): Promise<GridGradingDataResponseDto> {
    // Get exam schedule with class and calendar entry details
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: data.examScheduleId },
      include: {
        class: true,
        calendarEntry: true,
      },
    });

    if (!examSchedule || examSchedule.deletedAt) {
      throw new NotFoundException('Exam schedule not found');
    }

    if (examSchedule.classId !== data.classId) {
      throw new BadRequestException('Class ID does not match exam schedule');
    }

    if (examSchedule.calendarEntryId !== data.calendarEntryId) {
      throw new BadRequestException(
        'Calendar entry ID does not match exam schedule',
      );
    }

    // Get all exam slots for this schedule with subjects
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        examScheduleId: data.examScheduleId,
        deletedAt: null,
        subject: {
          deletedAt: null,
        },
      },
      include: {
        subject: true,
        dateslot: true,
      },
      orderBy: {
        subject: { name: 'asc' },
      },
    });

    // Get all students in the class
    const students = await this.prisma.student.findMany({
      where: {
        classId: data.classId,
        deletedAt: null,
      },
      include: {
        user: true,
        examResults: {
          where: {
            examSlot: {
              examScheduleId: data.examScheduleId,
            },
            deletedAt: null,
          },
          include: {
            examSlot: {
              include: { subject: true },
            },
            grade: true,
            gradedBy: true,
          },
        },
      },
      orderBy: [{ rollNumber: 'asc' }, { user: { fullName: 'asc' } }],
    });

    // Get grading scale for this academic year
    const gradingScale = await this.getDefaultGradingScale(
      examSchedule.academicYear,
    );

    // Transform data into grid format
    const subjects = examSlots.map(slot => ({
      id: slot.subject!.id,
      name: slot.subject!.name,
      code: slot.subject!.code,
      maxMarks: Number(slot.subject!.maxMarks),
      passMarks: Number(slot.subject!.passMarks),
      examSlot: {
        id: slot.id,
        examDate: slot.dateslot.examDate,
        startTime: slot.dateslot.startTime || undefined,
        endTime: slot.dateslot.endTime || undefined,
      },
    }));

    const gridStudents: GridGradingStudentDto[] = students.map(student => {
      const subjectGrades: { [subjectId: string]: any } = {};

      examSlots.forEach(slot => {
        if (!slot.subject) return;

        const result = student.examResults.find(r => r.examSlotId === slot.id);
        subjectGrades[slot.subject.id] = {
          examSlotId: slot.id,
          marksObtained: result?.marksObtained
            ? Number(result.marksObtained)
            : undefined,
          maxMarks: Number(slot.subject.maxMarks),
          passMarks: Number(slot.subject.passMarks),
          grade: result?.grade
            ? {
                ...result.grade,
                minMarks: Number(result.grade.minMarks),
                maxMarks: Number(result.grade.maxMarks),
                gradePoint: result.grade.gradePoint
                  ? Number(result.grade.gradePoint)
                  : undefined,
              }
            : undefined,
          remarks: result?.remarks,
          isAbsent: result?.isAbsent || false,
          isPassed: result?.isPassed || false,
          status: result?.status || ExamResultStatus.DRAFT,
          resultId: result?.id,
          gradedAt: result?.gradedAt,
          gradedBy: result?.gradedBy
            ? {
                id: result.gradedBy.id,
                fullName: result.gradedBy.fullName,
              }
            : undefined,
        };
      });

      return {
        id: student.id,
        rollNumber: student.rollNumber,
        user: {
          fullName: student.user.fullName,
        },
        subjects: subjectGrades,
      };
    });

    // Calculate statistics
    const totalStudents = students.length;
    const totalSubjects = subjects.length;
    const totalPossibleEntries = totalStudents * totalSubjects;

    let gradedEntries = 0;
    let absentEntries = 0;

    gridStudents.forEach(student => {
      Object.values(student.subjects).forEach((subject: any) => {
        if (subject.resultId) {
          gradedEntries++;
          if (subject.isAbsent) {
            absentEntries++;
          }
        }
      });
    });

    const pendingEntries = totalPossibleEntries - gradedEntries;

    return {
      class: {
        id: examSchedule.class.id,
        grade: examSchedule.class.grade,
        section: examSchedule.class.section,
      },
      examSchedule: {
        id: examSchedule.id,
        name: examSchedule.name,
        academicYear: examSchedule.academicYear,
      },
      calendarEntry: {
        id: examSchedule.calendarEntry.id,
        name: examSchedule.calendarEntry.name || 'Exam',
        examType: examSchedule.calendarEntry.examType || 'OTHER',
        startDate: examSchedule.calendarEntry.startDate,
        endDate: examSchedule.calendarEntry.endDate,
      },
      subjects,
      students: gridStudents,
      gradingScale: gradingScale || undefined,
      statistics: {
        totalStudents,
        totalSubjects,
        gradedEntries,
        pendingEntries,
        absentEntries,
      },
    };
  }

  // Get student grade history
  async getStudentGradeHistory(
    data: GetStudentGradeHistoryDtoType,
    userId: string,
    userRole: UserRole,
  ): Promise<StudentGradeHistoryDto[]> {
    // Check permissions - students can only view their own history
    if (userRole === UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student || student.id !== data.studentId) {
        throw new ForbiddenException(
          'Cannot access other students grade history',
        );
      }
    }

    const whereClause: any = {
      studentId: data.studentId,
      deletedAt: null,
    };

    if (data.academicYear) {
      whereClause.academicYear = data.academicYear;
    }
    if (data.classId) {
      whereClause.classId = data.classId;
    }
    if (data.subjectId) {
      whereClause.subjectId = data.subjectId;
    }
    if (data.examType) {
      whereClause.examType = data.examType;
    }

    const gradeHistory = await this.prisma.studentGradeHistory.findMany({
      where: whereClause,
      include: {
        class: true,
        subject: true,
        gradedBy: true,
      },
      orderBy: [
        { academicYear: 'desc' },
        { examDate: 'desc' },
        { subject: { name: 'asc' } },
      ],
    });

    return gradeHistory.map(history => ({
      id: history.id,
      studentId: history.studentId,
      examResultId: history.examResultId,
      classId: history.classId,
      subjectId: history.subjectId,
      examSlotId: history.examSlotId,
      academicYear: history.academicYear,
      examType: history.examType,
      examName: history.examName,
      examDate: history.examDate,
      marksObtained: history.marksObtained
        ? Number(history.marksObtained)
        : undefined,
      maxMarks: Number(history.maxMarks),
      passMarks: Number(history.passMarks),
      percentage: history.percentage ? Number(history.percentage) : undefined,
      gradeObtained: history.gradeObtained || undefined,
      gradePoint: history.gradePoint ? Number(history.gradePoint) : undefined,
      isPassed: history.isPassed,
      isAbsent: history.isAbsent,
      remarks: history.remarks || undefined,
      gradedAt: history.gradedAt || undefined,
      gradedBy: history.gradedBy
        ? {
            id: history.gradedBy.id,
            fullName: history.gradedBy.fullName,
          }
        : undefined,
      class: {
        grade: history.class.grade,
        section: history.class.section,
      },
      subject: {
        name: history.subject.name,
        code: history.subject.code,
      },
    }));
  }

  // Grid Grading Methods
  async bulkGridGrading(
    data: BulkGridGradingDtoType,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let processedCount = 0;

    try {
      // Process each grade entry
      for (const gradeEntry of data.grades) {
        try {
          // Find the exam slot for this subject and calendar entry
          const examSlot = await this.prisma.examSlot.findFirst({
            where: {
              subjectId: gradeEntry.subjectId,
              examScheduleId: data.examScheduleId,
              dateslot: {
                calendarEntryId: data.calendarEntryId,
              },
            },
            include: {
              subject: true,
              dateslot: true,
            },
          });

          if (!examSlot) {
            errors.push(
              `No exam slot found for subject ${gradeEntry.subjectId}`,
            );
            continue;
          }

          // Check if result already exists
          const existingResult = await this.prisma.examResult.findFirst({
            where: {
              examSlotId: examSlot.id,
              studentId: gradeEntry.studentId,
              deletedAt: null,
            },
          });

          if (existingResult) {
            // Update existing result if modification reason is provided
            if (gradeEntry.modificationReason) {
              await this.updateExamResult(
                existingResult.id,
                {
                  marksObtained: gradeEntry.marksObtained,
                  remarks: gradeEntry.remarks,
                  isAbsent: gradeEntry.isAbsent,
                  modificationReason: gradeEntry.modificationReason,
                },
                userId,
                userRole,
                ipAddress,
                userAgent,
              );
              processedCount++;
            } else {
              errors.push(`Modification reason required for existing result`);
            }
          } else {
            // Create new result
            await this.createExamResult(
              {
                examSlotId: examSlot.id,
                studentId: gradeEntry.studentId,
                marksObtained: gradeEntry.marksObtained,
                remarks: gradeEntry.remarks,
                isAbsent: gradeEntry.isAbsent || false,
              },
              userId,
              userRole,
              ipAddress,
              userAgent,
            );
            processedCount++;
          }
        } catch (error) {
          console.error('Error processing grade entry:', error);
          errors.push(
            `Error processing grade for student ${gradeEntry.studentId}: ${error.message}`,
          );
        }
      }

      return {
        success: errors.length === 0 || processedCount > 0,
        processedCount,
        errors,
      };
    } catch (error) {
      console.error('Error in bulk grid grading:', error);
      throw new BadRequestException('Failed to process grid grading');
    }
  }

  // Report Generation Methods
  async generateStudentReport(
    studentId: string,
    calendarEntryId: string,
    academicYear: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Buffer> {
    // Verify permissions
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to generate reports',
      );
    }

    // Get student details
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    // Get exam schedules for this calendar entry
    const examSchedules = await this.prisma.examSchedule.findMany({
      where: {
        calendarEntryId,
        deletedAt: null,
      },
      include: {
        calendarEntry: true,
      },
    });

    // Get exam results for the student
    const examResults = await this.prisma.examResult.findMany({
      where: {
        studentId,
        deletedAt: null,
        examSlot: {
          dateslot: {
            calendarEntryId,
          },
        },
      },
      include: {
        examSlot: {
          include: {
            subject: true,
          },
        },
        grade: true,
      },
    });

    return await this.generatePDFReport({
      student,
      examSchedules,
      examResults,
      academicYear,
    });
  }

  async generateClassReports(
    classId: string,
    calendarEntryId: string,
    academicYear: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Buffer> {
    // Verify permissions
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to generate reports',
      );
    }

    // Get class and its students
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            user: true,
            parents: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classData || classData.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    // Get exam schedules for this calendar entry and class
    const examSchedules = await this.prisma.examSchedule.findMany({
      where: {
        calendarEntryId,
        classId,
        deletedAt: null,
      },
      include: {
        calendarEntry: true,
      },
    });

    // Generate individual reports for each student
    const reportBuffers: { filename: string; buffer: Buffer }[] = [];

    for (const student of classData.students) {
      try {
        console.log(
          `Generating report for student: ${student.user.fullName} (${student.id})`,
        );

        const examResults = await this.prisma.examResult.findMany({
          where: {
            studentId: student.id,
            deletedAt: null,
            examSlot: {
              dateslot: {
                calendarEntryId,
              },
            },
          },
          include: {
            examSlot: {
              include: {
                subject: true,
              },
            },
            grade: true,
          },
        });

        console.log(
          `Found ${examResults.length} exam results for student ${student.id}`,
        );

        // Only generate report if student has exam results
        if (examResults.length > 0) {
          const pdfBuffer = await this.generatePDFReport({
            student: {
              ...student,
              class: {
                id: classData.id,
                grade: classData.grade,
                section: classData.section,
              },
            },
            examSchedules,
            examResults,
            academicYear,
          });

          reportBuffers.push({
            filename: `${student.user.fullName}_${student.rollNumber}_Report.pdf`,
            buffer: pdfBuffer,
          });

          console.log(
            `Successfully generated report for student: ${student.user.fullName}`,
          );
        } else {
          console.log(
            `Skipping report for student ${student.user.fullName} - no exam results found`,
          );
        }
      } catch (error) {
        console.error(
          `Error generating report for student ${student.id}:`,
          error,
        );
        // Continue with other students even if one fails
      }
    }

    console.log(
      `Generated ${reportBuffers.length} reports out of ${classData.students.length} students`,
    );

    if (reportBuffers.length === 0) {
      throw new BadRequestException(
        'No reports could be generated. Please check if students have exam results for this calendar entry.',
      );
    }

    return await this.createZipArchive(reportBuffers);
  }

  private async generatePDFReport(data: {
    student: any;
    examSchedules: any[];
    examResults: any[];
    academicYear: string;
  }): Promise<Buffer> {
    const doc = new (PDFDocument as any)({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).font('Helvetica-Bold');
      doc.text('STUDENT EXAMINATION RESULT', { align: 'center' });
      doc.moveDown();

      // School info
      doc.fontSize(14).font('Helvetica');
      doc.text('School Management System', { align: 'center' });
      doc.text(`Academic Year: ${data.academicYear}`, { align: 'center' });
      doc.moveDown();

      // Student info
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('STUDENT INFORMATION');
      doc.font('Helvetica');
      doc.text(`Name: ${data.student.user.fullName}`);
      doc.text(`Roll Number: ${data.student.rollNumber}`);
      doc.text(
        `Class: ${data.student.class.grade}${data.student.class.section}`,
      );
      if (data.student.parents && data.student.parents.length > 0) {
        const parent = data.student.parents[0].parent;
        doc.text(`Parent: ${parent.user.fullName}`);
      }
      doc.moveDown();

      // Exam details
      if (data.examSchedules.length > 0) {
        const exam = data.examSchedules[0].calendarEntry;
        doc.font('Helvetica-Bold');
        doc.text('EXAMINATION DETAILS');
        doc.font('Helvetica');
        doc.text(`Exam: ${exam.name}`);
        doc.text(
          `Period: ${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}`,
        );
        doc.moveDown();
      }

      // Results table
      if (data.examResults.length > 0) {
        doc.font('Helvetica-Bold');
        doc.text('SUBJECT-WISE RESULTS');
        doc.moveDown(0.5);

        // Table headers
        const startY = doc.y;
        let currentY = startY;

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Subject', 50, currentY, { width: 150 });
        doc.text('Max Marks', 200, currentY, { width: 80, align: 'center' });
        doc.text('Marks Obtained', 280, currentY, {
          width: 80,
          align: 'center',
        });
        doc.text('Grade', 360, currentY, { width: 60, align: 'center' });
        doc.text('Status', 420, currentY, { width: 80, align: 'center' });

        currentY += 20;
        // Line under headers
        doc
          .moveTo(50, currentY - 5)
          .lineTo(500, currentY - 5)
          .stroke();

        // Table rows
        doc.font('Helvetica').fontSize(9);

        let totalMarks = 0;
        let totalObtained = 0;

        data.examResults.forEach((result: any) => {
          const subject = result.examSlot.subject;
          const maxMarks = Number(subject.maxMarks);
          const obtained = result.marksObtained
            ? Number(result.marksObtained)
            : 0;

          totalMarks += maxMarks;
          if (!result.isAbsent) totalObtained += obtained;

          doc.text(subject.name, 50, currentY, { width: 150 });
          doc.text(maxMarks.toString(), 200, currentY, {
            width: 80,
            align: 'center',
          });
          doc.text(
            result.isAbsent ? 'Absent' : obtained.toString(),
            280,
            currentY,
            { width: 80, align: 'center' },
          );
          doc.text(result.grade?.grade || '-', 360, currentY, {
            width: 60,
            align: 'center',
          });
          doc.text(result.isPassed ? 'Pass' : 'Fail', 420, currentY, {
            width: 80,
            align: 'center',
          });

          currentY += 15;
        });

        // Total row
        doc.moveTo(50, currentY).lineTo(500, currentY).stroke();
        currentY += 10;

        doc.font('Helvetica-Bold');
        doc.text('TOTAL', 50, currentY, { width: 150 });
        doc.text(totalMarks.toString(), 200, currentY, {
          width: 80,
          align: 'center',
        });
        doc.text(totalObtained.toString(), 280, currentY, {
          width: 80,
          align: 'center',
        });

        const percentage =
          totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
        doc.text(`${percentage}%`, 360, currentY, {
          width: 60,
          align: 'center',
        });

        const overallStatus = percentage >= 50 ? 'PASS' : 'FAIL';
        doc.text(overallStatus, 420, currentY, { width: 80, align: 'center' });

        // Overall result
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`OVERALL RESULT: ${overallStatus}`, { align: 'center' });
        doc.text(`PERCENTAGE: ${percentage}%`, { align: 'center' });
      } else {
        doc.text('No examination results found for this student.');
      }

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50,
      );
      doc.text('This is a computer-generated document.', { align: 'center' });

      doc.end();
    });
  }

  private async createZipArchive(
    files: { filename: string; buffer: Buffer }[],
  ): Promise<Buffer> {
    const zip = new JSZip();

    files.forEach(file => {
      zip.file(file.filename, file.buffer);
    });

    return await zip.generateAsync({ type: 'nodebuffer' });
  }
}
