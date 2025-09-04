import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateExamDateslotDto,
  UpdateExamDateslotDto,
  ExamDateslotResponseDto,
  BulkCreateExamDateslotsDto,
  GenerateDateslotsFromRangeDto,
} from '@sms/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamDateslotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new exam dateslot
   */
  async createDateslot(
    createDateslotDto: CreateExamDateslotDto,
    userId: string,
  ): Promise<ExamDateslotResponseDto> {
    try {
      // Check if calendar entry exists and is an exam
      const calendarEntry = await this.prisma.calendarEntry.findUnique({
        where: { id: createDateslotDto.calendarEntryId },
      });

      if (!calendarEntry) {
        throw new NotFoundException(
          `Calendar entry with ID ${createDateslotDto.calendarEntryId} not found`,
        );
      }

      if (calendarEntry.type !== 'EXAM') {
        throw new BadRequestException(
          'Calendar entry must be of type EXAM to create dateslots',
        );
      }

      // Parse exam date
      const examDate = new Date(createDateslotDto.examDate);

      // Validate exam date is within calendar entry range
      if (
        examDate < calendarEntry.startDate ||
        examDate > calendarEntry.endDate
      ) {
        throw new BadRequestException(
          'Exam date must be within the calendar entry date range',
        );
      }

      // Validate time range if provided
      if (createDateslotDto.startTime && createDateslotDto.endTime) {
        if (createDateslotDto.startTime >= createDateslotDto.endTime) {
          throw new BadRequestException('Start time must be before end time');
        }
      }

      const dateslot = await this.prisma.examDateslot.create({
        data: {
          calendarEntryId: createDateslotDto.calendarEntryId,
          examDate,
          startTime: createDateslotDto.startTime,
          endTime: createDateslotDto.endTime,

          type: createDateslotDto.type,
          createdById: userId,
        },
        include: {
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

      return dateslot as ExamDateslotResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A dateslot with the same date and time already exists for this exam',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get all dateslots for a calendar entry
   */
  async getDateslotsByCalendarEntry(
    calendarEntryId: string,
  ): Promise<ExamDateslotResponseDto[]> {
    const dateslots = await this.prisma.examDateslot.findMany({
      where: {
        calendarEntryId,
        deletedAt: null,
      },
      include: {
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
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    return dateslots as ExamDateslotResponseDto[];
  }

  /**
   * Update an exam dateslot
   */
  async updateDateslot(
    id: string,
    updateDateslotDto: UpdateExamDateslotDto,
    userId: string,
  ): Promise<ExamDateslotResponseDto> {
    // Check if dateslot exists
    const existingDateslot = await this.prisma.examDateslot.findUnique({
      where: { id },
      include: { calendarEntry: true },
    });

    if (!existingDateslot) {
      throw new NotFoundException(`Dateslot with ID ${id} not found`);
    }

    // Validate exam date if being updated
    if (updateDateslotDto.examDate) {
      const examDate = new Date(updateDateslotDto.examDate);
      if (
        examDate < existingDateslot.calendarEntry.startDate ||
        examDate > existingDateslot.calendarEntry.endDate
      ) {
        throw new BadRequestException(
          'Exam date must be within the calendar entry date range',
        );
      }
    }

    // Validate time range if being updated
    const startTime = updateDateslotDto.startTime ?? existingDateslot.startTime;
    const endTime = updateDateslotDto.endTime ?? existingDateslot.endTime;
    if (startTime && endTime && startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const updatedDateslot = await this.prisma.examDateslot.update({
      where: { id },
      data: {
        ...updateDateslotDto,
        examDate: updateDateslotDto.examDate
          ? new Date(updateDateslotDto.examDate)
          : undefined,
        updatedAt: new Date(),
        updatedById: userId,
      },
      include: {
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

    return updatedDateslot as ExamDateslotResponseDto;
  }

  /**
   * Delete an exam dateslot
   */
  async deleteDateslot(id: string, userId: string): Promise<void> {
    // Check if dateslot exists
    const existingDateslot = await this.prisma.examDateslot.findUnique({
      where: { id },
    });

    if (!existingDateslot) {
      throw new NotFoundException(`Dateslot with ID ${id} not found`);
    }

    // Check if dateslot is being used in any exam slots
    const examSlotsCount = await this.prisma.examSlot.count({
      where: {
        dateslotId: id,
        deletedAt: null,
      },
    });

    if (examSlotsCount > 0) {
      throw new BadRequestException(
        'Cannot delete dateslot that is being used in exam schedules',
      );
    }

    await this.prisma.examDateslot.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  /**
   * Bulk create exam dateslots
   */
  async bulkCreateDateslots(
    bulkCreateDto: BulkCreateExamDateslotsDto,
    userId: string,
  ): Promise<ExamDateslotResponseDto[]> {
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
        'Calendar entry must be of type EXAM to create dateslots',
      );
    }

    // Validate all dateslots
    for (const dateslot of bulkCreateDto.dateslots) {
      const examDate = new Date(dateslot.examDate);
      if (
        examDate < calendarEntry.startDate ||
        examDate > calendarEntry.endDate
      ) {
        throw new BadRequestException(
          `Exam date ${dateslot.examDate} must be within the calendar entry date range`,
        );
      }

      if (
        dateslot.startTime &&
        dateslot.endTime &&
        dateslot.startTime >= dateslot.endTime
      ) {
        throw new BadRequestException(
          `Start time must be before end time for dateslot on ${dateslot.examDate}`,
        );
      }
    }

    const createdDateslots = await this.prisma.$transaction(
      bulkCreateDto.dateslots.map(dateslot =>
        this.prisma.examDateslot.create({
          data: {
            calendarEntryId: bulkCreateDto.calendarEntryId,
            examDate: new Date(dateslot.examDate),
            startTime: dateslot.startTime,
            endTime: dateslot.endTime,

            type: dateslot.type,
            createdById: userId,
          },
          include: {
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

    return createdDateslots as ExamDateslotResponseDto[];
  }

  /**
   * Generate dateslots from date range
   */
  async generateDateslotsFromRange(
    generateDto: GenerateDateslotsFromRangeDto,
    userId: string,
  ): Promise<ExamDateslotResponseDto[]> {
    // Check if calendar entry exists and is an exam
    const calendarEntry = await this.prisma.calendarEntry.findUnique({
      where: { id: generateDto.calendarEntryId },
    });

    if (!calendarEntry) {
      throw new NotFoundException(
        `Calendar entry with ID ${generateDto.calendarEntryId} not found`,
      );
    }

    if (calendarEntry.type !== 'EXAM') {
      throw new BadRequestException(
        'Calendar entry must be of type EXAM to create dateslots',
      );
    }

    const startDate = new Date(generateDto.startDate);
    const endDate = new Date(generateDto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Generate all dates between start and end date
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create dateslots for each date and time slot combination
    const dateslotsToCreate: any[] = [];

    for (const date of dates) {
      if (generateDto.timeSlots && generateDto.timeSlots.length > 0) {
        // Create multiple slots per day with different time ranges
        for (const timeSlot of generateDto.timeSlots) {
          dateslotsToCreate.push({
            calendarEntryId: generateDto.calendarEntryId,
            examDate: date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            label: timeSlot.label,
            createdById: userId,
          });
        }
      } else {
        // Create one slot per day without specific time
        dateslotsToCreate.push({
          calendarEntryId: generateDto.calendarEntryId,
          examDate: date,
          createdById: userId,
        });
      }
    }

    const createdDateslots = await this.prisma.$transaction(
      dateslotsToCreate.map(dateslot =>
        this.prisma.examDateslot.create({
          data: dateslot,
          include: {
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

    return createdDateslots as ExamDateslotResponseDto[];
  }

  /**
   * Get a single dateslot by ID
   */
  async getDateslotById(id: string): Promise<ExamDateslotResponseDto> {
    const dateslot = await this.prisma.examDateslot.findUnique({
      where: { id },
      include: {
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

    if (!dateslot) {
      throw new NotFoundException(`Dateslot with ID ${id} not found`);
    }

    return dateslot as ExamDateslotResponseDto;
  }
}
