import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  ExamTimetableSlotDto,
  BulkExamTimetableOperationDto,
  GetExamTimetableDto,
  ValidateExamTimetableDto,
  AssignSubjectToExamDateslotDto,
  CopyExamTimetableDto,
  ExamTimetableSummaryDto,
} from '@sms/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamTimetableService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get complete exam timetable for a class and calendar entry
   */
  async getExamTimetable(
    getTimetableDto: GetExamTimetableDto,
  ): Promise<ExamTimetableSlotDto[]> {
    // Find the exam schedule
    let examSchedule;
    if (getTimetableDto.examScheduleId) {
      examSchedule = await this.prisma.examSchedule.findUnique({
        where: { id: getTimetableDto.examScheduleId },
      });
    } else {
      examSchedule = await this.prisma.examSchedule.findFirst({
        where: {
          classId: getTimetableDto.classId,
          calendarEntryId: getTimetableDto.calendarEntryId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!examSchedule) {
      throw new NotFoundException('Exam schedule not found');
    }

    // Get all exam slots with relations
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        examScheduleId: examSchedule.id,
        deletedAt: null,
      },
      include: {
        dateslot: {
          select: {
            id: true,
            examDate: true,
            startTime: true,
            endTime: true,
            label: true,
            type: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            maxMarks: true,
            passMarks: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            name: true,
            capacity: true,
            floor: true,
            building: true,
          },
        },
      },
      orderBy: [
        { dateslot: { examDate: 'asc' } },
        { dateslot: { startTime: 'asc' } },
      ],
    });

    return examSlots as any;
  }

  /**
   * Assign subject to exam dateslot
   */
  async assignSubjectToDateslot(
    assignDto: AssignSubjectToExamDateslotDto,
    userId: string,
  ): Promise<ExamTimetableSlotDto> {
    // Check if exam schedule exists
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: assignDto.examScheduleId },
    });

    if (!examSchedule) {
      throw new NotFoundException(
        `Exam schedule with ID ${assignDto.examScheduleId} not found`,
      );
    }

    // Check if dateslot exists
    const dateslot = await this.prisma.examDateslot.findUnique({
      where: { id: assignDto.dateslotId },
    });

    if (!dateslot) {
      throw new NotFoundException(
        `Dateslot with ID ${assignDto.dateslotId} not found`,
      );
    }

    // Check if subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: assignDto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException(
        `Subject with ID ${assignDto.subjectId} not found`,
      );
    }

    // Validate room if provided
    if (assignDto.roomId) {
      const room = await this.prisma.classroom.findUnique({
        where: { id: assignDto.roomId },
      });

      if (!room) {
        throw new NotFoundException(
          `Room with ID ${assignDto.roomId} not found`,
        );
      }
    }

    // Find existing exam slot for this dateslot
    const existingSlot = await this.prisma.examSlot.findFirst({
      where: {
        examScheduleId: assignDto.examScheduleId,
        dateslotId: assignDto.dateslotId,
        deletedAt: null,
      },
    });

    let examSlot;
    if (existingSlot) {
      // Update existing slot
      examSlot = await this.prisma.examSlot.update({
        where: { id: existingSlot.id },
        data: {
          subjectId: assignDto.subjectId,
          roomId: assignDto.roomId,
          duration: assignDto.duration,
          instructions: assignDto.instructions,
          updatedAt: new Date(),
          updatedById: userId,
        },
        include: {
          dateslot: {
            select: {
              id: true,
              examDate: true,
              startTime: true,
              endTime: true,
              label: true,
              type: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              maxMarks: true,
              passMarks: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              name: true,
              capacity: true,
              floor: true,
              building: true,
            },
          },
        },
      });
    } else {
      // Create new slot
      examSlot = await this.prisma.examSlot.create({
        data: {
          examScheduleId: assignDto.examScheduleId,
          dateslotId: assignDto.dateslotId,
          subjectId: assignDto.subjectId,
          roomId: assignDto.roomId,
          duration: assignDto.duration,
          instructions: assignDto.instructions,
          createdById: userId,
        },
        include: {
          dateslot: {
            select: {
              id: true,
              examDate: true,
              startTime: true,
              endTime: true,
              label: true,
              type: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              maxMarks: true,
              passMarks: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              name: true,
              capacity: true,
              floor: true,
              building: true,
            },
          },
        },
      });
    }

    return examSlot as ExamTimetableSlotDto;
  }

  /**
   * Remove subject from dateslot
   */
  async removeSubjectFromDateslot(
    slotId: string,
    userId: string,
  ): Promise<void> {
    // Check if exam slot exists
    const existingSlot = await this.prisma.examSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      throw new NotFoundException(`Exam slot with ID ${slotId} not found`);
    }

    // Update slot to remove subject assignment
    await this.prisma.examSlot.update({
      where: { id: slotId },
      data: {
        subjectId: null,
        roomId: null,
        duration: null,
        instructions: null,
        updatedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  /**
   * Bulk exam timetable operations
   */
  async bulkExamTimetableOperations(
    bulkOperationDto: BulkExamTimetableOperationDto,
    userId: string,
  ): Promise<ExamTimetableSlotDto[]> {
    // Check if exam schedule exists
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: bulkOperationDto.examScheduleId },
    });

    if (!examSchedule) {
      throw new NotFoundException(
        `Exam schedule with ID ${bulkOperationDto.examScheduleId} not found`,
      );
    }

    const results = await this.prisma.$transaction(async tx => {
      const operationResults: any[] = [];

      for (const operation of bulkOperationDto.operations) {
        switch (operation.action) {
          case 'create': {
            const createdSlot = await tx.examSlot.create({
              data: {
                examScheduleId: bulkOperationDto.examScheduleId,
                dateslotId: operation.slotData.dateslotId,
                subjectId: operation.slotData.subjectId,
                roomId: operation.slotData.roomId,
                duration: operation.slotData.duration,
                instructions: operation.slotData.instructions,
                createdById: userId,
              },
              include: {
                dateslot: {
                  select: {
                    id: true,
                    examDate: true,
                    startTime: true,
                    endTime: true,
                    label: true,
                    type: true,
                  },
                },
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    maxMarks: true,
                    passMarks: true,
                  },
                },
                room: {
                  select: {
                    id: true,
                    roomNo: true,
                    name: true,
                    capacity: true,
                    floor: true,
                    building: true,
                  },
                },
              },
            });
            operationResults.push(createdSlot);
            break;
          }

          case 'update': {
            if (!operation.slotData.id) {
              throw new BadRequestException(
                'Slot ID is required for update operation',
              );
            }
            const updatedSlot = await tx.examSlot.update({
              where: { id: operation.slotData.id },
              data: {
                dateslotId: operation.slotData.dateslotId,
                subjectId: operation.slotData.subjectId,
                roomId: operation.slotData.roomId,
                duration: operation.slotData.duration,
                instructions: operation.slotData.instructions,
                updatedAt: new Date(),
                updatedById: userId,
              },
              include: {
                dateslot: {
                  select: {
                    id: true,
                    examDate: true,
                    startTime: true,
                    endTime: true,
                    label: true,
                    type: true,
                  },
                },
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    maxMarks: true,
                    passMarks: true,
                  },
                },
                room: {
                  select: {
                    id: true,
                    roomNo: true,
                    name: true,
                    capacity: true,
                    floor: true,
                    building: true,
                  },
                },
              },
            });
            operationResults.push(updatedSlot);
            break;
          }

          case 'delete': {
            if (!operation.slotData.id) {
              throw new BadRequestException(
                'Slot ID is required for delete operation',
              );
            }
            await tx.examSlot.update({
              where: { id: operation.slotData.id },
              data: {
                deletedAt: new Date(),
                deletedById: userId,
              },
            });
            break;
          }
        }
      }

      return operationResults;
    });

    return results as ExamTimetableSlotDto[];
  }

  /**
   * Validate exam timetable
   */
  async validateExamTimetable(validateDto: ValidateExamTimetableDto): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if exam schedule exists
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: validateDto.examScheduleId },
      include: {
        calendarEntry: true,
        class: {
          include: {
            assignedSubjects: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!examSchedule) {
      errors.push('Exam schedule not found');
      return { isValid: false, errors, warnings };
    }

    // Get all exam slots
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        examScheduleId: validateDto.examScheduleId,
        deletedAt: null,
      },
      include: {
        dateslot: true,
        subject: true,
      },
    });

    // Get all dateslots for this calendar entry
    const allDateslots = await this.prisma.examDateslot.findMany({
      where: {
        calendarEntryId: examSchedule.calendarEntryId,
        deletedAt: null,
      },
    });

    if (validateDto.checkCompleteness) {
      // Check if all class subjects are assigned
      const classSubjects = examSchedule.class.assignedSubjects;
      const assignedSubjectIds = examSlots
        .filter(slot => slot.subjectId)
        .map(slot => slot.subjectId);

      const unassignedSubjects = classSubjects.filter(
        cs => !assignedSubjectIds.includes(cs.subjectId),
      );

      if (unassignedSubjects.length > 0) {
        warnings.push(
          `${unassignedSubjects.length} subjects are not assigned to any exam slot`,
        );
      }

      // Check if all EXAM type dateslots have subjects assigned
      // Only EXAM slots need subject assignment; BREAK, LUNCH, PREPARATION are gaps
      const unassignedExamDateslots = allDateslots.filter(
        dateslot =>
          dateslot.type === 'EXAM' &&
          !examSlots.some(
            slot => slot.dateslotId === dateslot.id && slot.subjectId,
          ),
      );

      if (unassignedExamDateslots.length > 0) {
        warnings.push(
          `${unassignedExamDateslots.length} exam dateslots do not have subjects assigned`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Copy exam timetable to other classes
   */
  async copyExamTimetable(
    copyDto: CopyExamTimetableDto,
    userId: string,
  ): Promise<ExamTimetableSlotDto[]> {
    // Check if source exam schedule exists
    const sourceSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: copyDto.sourceExamScheduleId },
      include: {
        examSlots: {
          where: { deletedAt: null },
          include: {
            dateslot: true,
            subject: true,
            room: true,
          },
        },
      },
    });

    if (!sourceSchedule) {
      throw new NotFoundException(
        `Source exam schedule with ID ${copyDto.sourceExamScheduleId} not found`,
      );
    }

    // Check if target classes exist
    const targetClasses = await this.prisma.class.findMany({
      where: {
        id: { in: copyDto.targetClassIds },
      },
    });

    if (targetClasses.length !== copyDto.targetClassIds.length) {
      throw new NotFoundException('One or more target classes not found');
    }

    // Get or create exam schedules for target classes
    const targetSchedules = await this.prisma.$transaction(async tx => {
      const schedules: any[] = [];

      for (const classId of copyDto.targetClassIds) {
        let schedule = await tx.examSchedule.findFirst({
          where: {
            classId,
            calendarEntryId: sourceSchedule.calendarEntryId,
            deletedAt: null,
          },
        });

        if (!schedule) {
          schedule = await tx.examSchedule.create({
            data: {
              classId,
              calendarEntryId: sourceSchedule.calendarEntryId,
              name: sourceSchedule.name,
              academicYear: sourceSchedule.academicYear,
              createdById: userId,
            },
          });
        }

        schedules.push(schedule);
      }

      return schedules;
    });

    // Copy exam slots to target schedules
    const copiedSlots = await this.prisma.$transaction(async tx => {
      const allCopiedSlots: any[] = [];

      for (const targetSchedule of targetSchedules) {
        // Delete existing slots if any
        await tx.examSlot.updateMany({
          where: {
            examScheduleId: targetSchedule.id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById: userId,
          },
        });

        // Copy slots from source
        for (const sourceSlot of sourceSchedule.examSlots) {
          const slotData: any = {
            examScheduleId: targetSchedule.id,
            dateslotId: sourceSlot.dateslotId,
            createdById: userId,
          };

          if (copyDto.copySubjects && sourceSlot.subjectId) {
            slotData.subjectId = sourceSlot.subjectId;
          }

          if (copyDto.copyRooms && sourceSlot.roomId) {
            slotData.roomId = sourceSlot.roomId;
          }

          if (copyDto.copyInstructions && sourceSlot.instructions) {
            slotData.instructions = sourceSlot.instructions;
          }

          if (sourceSlot.duration) {
            slotData.duration = sourceSlot.duration;
          }

          const copiedSlot = await tx.examSlot.create({
            data: slotData,
            include: {
              dateslot: {
                select: {
                  id: true,
                  examDate: true,
                  startTime: true,
                  endTime: true,
                  label: true,
                  type: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                  maxMarks: true,
                  passMarks: true,
                },
              },
              room: {
                select: {
                  id: true,
                  roomNo: true,
                  name: true,
                  capacity: true,
                  floor: true,
                  building: true,
                },
              },
            },
          });

          allCopiedSlots.push(copiedSlot);
        }
      }

      return allCopiedSlots;
    });

    return copiedSlots as ExamTimetableSlotDto[];
  }

  /**
   * Get exam timetable summary
   */
  async getExamTimetableSummary(
    examScheduleId: string,
  ): Promise<ExamTimetableSummaryDto> {
    // Check if exam schedule exists
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
    });

    if (!examSchedule) {
      throw new NotFoundException(
        `Exam schedule with ID ${examScheduleId} not found`,
      );
    }

    // Get all exam slots
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        examScheduleId,
        deletedAt: null,
      },
      include: {
        dateslot: true,
        subject: true,
      },
    });

    // Get all dateslots for this calendar entry
    const allDateslots = await this.prisma.examDateslot.findMany({
      where: {
        calendarEntryId: examSchedule.calendarEntryId,
        deletedAt: null,
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    const totalSlots = allDateslots.length;
    const assignedSlots = examSlots.filter(slot => slot.subjectId).length;
    const unassignedSlots = totalSlots - assignedSlots;

    // Group subjects by assignment count
    const subjectAssignments = new Map<
      string,
      { subject: any; count: number }
    >();
    examSlots.forEach(slot => {
      if (slot.subject) {
        const existing = subjectAssignments.get(slot.subject.id);
        if (existing) {
          existing.count++;
        } else {
          subjectAssignments.set(slot.subject.id, {
            subject: slot.subject,
            count: 1,
          });
        }
      }
    });

    const subjects = Array.from(subjectAssignments.values()).map(
      ({ subject, count }) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        assignedSlots: count,
      }),
    );

    // Group dateslots with assignment counts
    const dateslots = allDateslots.map(dateslot => {
      const assignedSubjects = examSlots.filter(
        slot => slot.dateslotId === dateslot.id && slot.subjectId,
      ).length;

      return {
        id: dateslot.id,
        examDate: dateslot.examDate,
        startTime: dateslot.startTime,
        endTime: dateslot.endTime,
        label: dateslot.label,
        type: dateslot.type,
        assignedSubjects,
      };
    });

    return {
      examScheduleId,
      totalSlots,
      assignedSlots,
      unassignedSlots,
      subjects,
      dateslots,
    } as ExamTimetableSummaryDto;
  }
}
