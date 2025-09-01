import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateExamScheduleDto,
  UpdateExamScheduleDto,
  ExamScheduleResponseDto,
  BulkCreateExamSchedulesDto,
  ActivateExamScheduleDto,
  CreateExamSlotDto,
  UpdateExamSlotDto,
  ExamSlotResponseDto,
} from '@sms/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new exam schedule
   */
  async createExamSchedule(
    createScheduleDto: CreateExamScheduleDto,
    userId: string,
  ): Promise<ExamScheduleResponseDto> {
    try {
      // Check if class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: createScheduleDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException(
          `Class with ID ${createScheduleDto.classId} not found`,
        );
      }

      // Check if calendar entry exists and is an exam
      const calendarEntry = await this.prisma.calendarEntry.findUnique({
        where: { id: createScheduleDto.calendarEntryId },
      });

      if (!calendarEntry) {
        throw new NotFoundException(
          `Calendar entry with ID ${createScheduleDto.calendarEntryId} not found`,
        );
      }

      if (calendarEntry.type !== 'EXAM') {
        throw new BadRequestException(
          'Calendar entry must be of type EXAM to create exam schedules',
        );
      }

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async tx => {
        // Create the exam schedule
        const examSchedule = await tx.examSchedule.create({
          data: {
            ...createScheduleDto,
            createdById: userId,
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
            calendarEntry: {
              select: {
                id: true,
                name: true,
                type: true,
                examType: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });

        // Auto-create exam slots for all existing dateslots of this calendar entry
        await this.createExamSlotsForExistingDateslots(
          tx,
          examSchedule,
          userId,
        );

        return examSchedule;
      });

      return result as ExamScheduleResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'This class already has an exam schedule for this calendar entry',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Auto-create exam slots for all existing dateslots when creating a new exam schedule
   */
  private async createExamSlotsForExistingDateslots(
    tx: Prisma.TransactionClient,
    examSchedule: { id: string; calendarEntryId: string },
    userId: string,
  ): Promise<void> {
    // Get all dateslots for this calendar entry
    const dateslots = await tx.examDateslot.findMany({
      where: {
        calendarEntryId: examSchedule.calendarEntryId,
        deletedAt: null,
      },
    });

    // Create exam slots for each dateslot
    if (dateslots.length > 0) {
      await tx.examSlot.createMany({
        data: dateslots.map(dateslot => ({
          examScheduleId: examSchedule.id,
          dateslotId: dateslot.id,
          createdById: userId,
        })),
      });
    }
  }

  /**
   * Get all exam schedules for a class
   */
  async getExamSchedulesByClass(
    classId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    const examSchedules = await this.prisma.examSchedule.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        calendarEntry: {
          select: {
            id: true,
            name: true,
            type: true,
            examType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return examSchedules as ExamScheduleResponseDto[];
  }

  /**
   * Get all exam schedules for a calendar entry
   */
  async getExamSchedulesByCalendarEntry(
    calendarEntryId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    const examSchedules = await this.prisma.examSchedule.findMany({
      where: {
        calendarEntryId,
        deletedAt: null,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        calendarEntry: {
          select: {
            id: true,
            name: true,
            type: true,
            examType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [{ class: { grade: 'asc' } }, { class: { section: 'asc' } }],
    });

    return examSchedules as ExamScheduleResponseDto[];
  }

  /**
   * Update an exam schedule
   */
  async updateExamSchedule(
    id: string,
    updateScheduleDto: UpdateExamScheduleDto,
    userId: string,
  ): Promise<ExamScheduleResponseDto> {
    // Check if exam schedule exists
    const existingSchedule = await this.prisma.examSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new NotFoundException(`Exam schedule with ID ${id} not found`);
    }

    // Validate class if being updated
    if (updateScheduleDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: updateScheduleDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException(
          `Class with ID ${updateScheduleDto.classId} not found`,
        );
      }
    }

    // Validate calendar entry if being updated
    if (updateScheduleDto.calendarEntryId) {
      const calendarEntry = await this.prisma.calendarEntry.findUnique({
        where: { id: updateScheduleDto.calendarEntryId },
      });

      if (!calendarEntry) {
        throw new NotFoundException(
          `Calendar entry with ID ${updateScheduleDto.calendarEntryId} not found`,
        );
      }

      if (calendarEntry.type !== 'EXAM') {
        throw new BadRequestException('Calendar entry must be of type EXAM');
      }
    }

    const updatedSchedule = await this.prisma.examSchedule.update({
      where: { id },
      data: {
        ...updateScheduleDto,
        updatedAt: new Date(),
        updatedById: userId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        calendarEntry: {
          select: {
            id: true,
            name: true,
            type: true,
            examType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return updatedSchedule as ExamScheduleResponseDto;
  }

  /**
   * Delete an exam schedule
   */
  async deleteExamSchedule(id: string, userId: string): Promise<void> {
    // Check if exam schedule exists
    const existingSchedule = await this.prisma.examSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new NotFoundException(`Exam schedule with ID ${id} not found`);
    }

    await this.prisma.$transaction(async tx => {
      // Soft delete all exam slots first
      await tx.examSlot.updateMany({
        where: {
          examScheduleId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      // Soft delete the exam schedule
      await tx.examSchedule.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });
    });
  }

  /**
   * Bulk create exam schedules for multiple classes
   */
  async bulkCreateExamSchedules(
    bulkCreateDto: BulkCreateExamSchedulesDto,
    userId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    // Check if calendar entry exists and is an exam
    const calendarEntry = await this.prisma.calendarEntry.findUnique({
      where: { id: bulkCreateDto.calendarEntryId },
    });

    if (!calendarEntry) {
      throw new NotFoundException(
        `Calendar entry with ID ${bulkCreateDto.calendarEntryId} not found`,
      );
    }

    if (calendarEntry.type !== 'EXAM') {
      throw new BadRequestException(
        'Calendar entry must be of type EXAM to create exam schedules',
      );
    }

    // Check if all classes exist
    const classes = await this.prisma.class.findMany({
      where: {
        id: { in: bulkCreateDto.classIds },
      },
    });

    if (classes.length !== bulkCreateDto.classIds.length) {
      throw new NotFoundException('One or more classes not found');
    }

    // Check for existing schedules
    const existingSchedules = await this.prisma.examSchedule.findMany({
      where: {
        classId: { in: bulkCreateDto.classIds },
        calendarEntryId: bulkCreateDto.calendarEntryId,
        deletedAt: null,
      },
    });

    if (existingSchedules.length > 0) {
      throw new ConflictException(
        'Some classes already have exam schedules for this calendar entry',
      );
    }

    const createdSchedules = await this.prisma.$transaction(async tx => {
      // Create exam schedules for all classes
      const schedules = await Promise.all(
        bulkCreateDto.classIds.map(classId =>
          tx.examSchedule.create({
            data: {
              classId,
              calendarEntryId: bulkCreateDto.calendarEntryId,
              name: bulkCreateDto.name,
              academicYear: bulkCreateDto.academicYear,
              createdById: userId,
            },
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  grade: true,
                  section: true,
                },
              },
              calendarEntry: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  examType: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          }),
        ),
      );

      // Create exam slots for each schedule
      for (const schedule of schedules) {
        await this.createExamSlotsForExistingDateslots(tx, schedule, userId);
      }

      return schedules;
    });

    return createdSchedules as ExamScheduleResponseDto[];
  }

  /**
   * Activate an exam schedule
   */
  async activateExamSchedule(
    activateDto: ActivateExamScheduleDto,
    userId: string,
  ): Promise<ExamScheduleResponseDto> {
    // Check if exam schedule exists
    const existingSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: activateDto.id },
    });

    if (!existingSchedule) {
      throw new NotFoundException(
        `Exam schedule with ID ${activateDto.id} not found`,
      );
    }

    // Deactivate other schedules for the same class and calendar entry
    await this.prisma.$transaction(async tx => {
      await tx.examSchedule.updateMany({
        where: {
          classId: existingSchedule.classId,
          calendarEntryId: existingSchedule.calendarEntryId,
          status: 'active',
          deletedAt: null,
        },
        data: {
          status: 'draft',
          updatedAt: new Date(),
          updatedById: userId,
        },
      });

      // Activate the selected schedule
      await tx.examSchedule.update({
        where: { id: activateDto.id },
        data: {
          status: 'active',
          updatedAt: new Date(),
          updatedById: userId,
        },
      });
    });

    const activatedSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: activateDto.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        calendarEntry: {
          select: {
            id: true,
            name: true,
            type: true,
            examType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return activatedSchedule as ExamScheduleResponseDto;
  }

  /**
   * Create an exam slot
   */
  async createExamSlot(
    createSlotDto: CreateExamSlotDto,
    userId: string,
  ): Promise<ExamSlotResponseDto> {
    // Check if exam schedule exists
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id: createSlotDto.examScheduleId },
    });

    if (!examSchedule) {
      throw new NotFoundException(
        `Exam schedule with ID ${createSlotDto.examScheduleId} not found`,
      );
    }

    // Check if dateslot exists
    const dateslot = await this.prisma.examDateslot.findUnique({
      where: { id: createSlotDto.dateslotId },
    });

    if (!dateslot) {
      throw new NotFoundException(
        `Dateslot with ID ${createSlotDto.dateslotId} not found`,
      );
    }

    // Validate subject if provided
    if (createSlotDto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: createSlotDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException(
          `Subject with ID ${createSlotDto.subjectId} not found`,
        );
      }
    }

    // Validate room if provided
    if (createSlotDto.roomId) {
      const room = await this.prisma.classroom.findUnique({
        where: { id: createSlotDto.roomId },
      });

      if (!room) {
        throw new NotFoundException(
          `Room with ID ${createSlotDto.roomId} not found`,
        );
      }
    }

    const examSlot = await this.prisma.examSlot.create({
      data: {
        ...createSlotDto,
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

    return examSlot as ExamSlotResponseDto;
  }

  /**
   * Get exam slots by schedule
   */
  async getExamSlotsBySchedule(
    examScheduleId: string,
  ): Promise<ExamSlotResponseDto[]> {
    const examSlots = await this.prisma.examSlot.findMany({
      where: {
        examScheduleId,
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

    return examSlots as ExamSlotResponseDto[];
  }

  /**
   * Update an exam slot
   */
  async updateExamSlot(
    id: string,
    updateSlotDto: UpdateExamSlotDto,
    userId: string,
  ): Promise<ExamSlotResponseDto> {
    // Check if exam slot exists
    const existingSlot = await this.prisma.examSlot.findUnique({
      where: { id },
    });

    if (!existingSlot) {
      throw new NotFoundException(`Exam slot with ID ${id} not found`);
    }

    // Validate subject if being updated
    if (updateSlotDto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: updateSlotDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException(
          `Subject with ID ${updateSlotDto.subjectId} not found`,
        );
      }
    }

    // Validate room if being updated
    if (updateSlotDto.roomId) {
      const room = await this.prisma.classroom.findUnique({
        where: { id: updateSlotDto.roomId },
      });

      if (!room) {
        throw new NotFoundException(
          `Room with ID ${updateSlotDto.roomId} not found`,
        );
      }
    }

    const updatedSlot = await this.prisma.examSlot.update({
      where: { id },
      data: {
        ...updateSlotDto,
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

    return updatedSlot as ExamSlotResponseDto;
  }

  /**
   * Delete an exam slot
   */
  async deleteExamSlot(id: string, userId: string): Promise<void> {
    // Check if exam slot exists
    const existingSlot = await this.prisma.examSlot.findUnique({
      where: { id },
    });

    if (!existingSlot) {
      throw new NotFoundException(`Exam slot with ID ${id} not found`);
    }

    await this.prisma.examSlot.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  /**
   * Get a single exam schedule by ID
   */
  async getExamScheduleById(id: string): Promise<ExamScheduleResponseDto> {
    const examSchedule = await this.prisma.examSchedule.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        calendarEntry: {
          select: {
            id: true,
            name: true,
            type: true,
            examType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!examSchedule) {
      throw new NotFoundException(`Exam schedule with ID ${id} not found`);
    }

    return examSchedule as ExamScheduleResponseDto;
  }
}
