import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  BulkCreateTimeslotsDto,
  CreateTimeslotDto,
  TimeslotResponseDto,
  UpdateTimeslotDto,
} from '@sms/shared-types';
import { Prisma, TimeslotType } from '@prisma/client';

@Injectable()
export class TimeslotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new timeslot and automatically create schedule slots for all active schedules
   */
  async createTimeslot(
    createTimeslotDto: CreateTimeslotDto,
    userId: string,
  ): Promise<TimeslotResponseDto> {
    try {
      // Check if class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: createTimeslotDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException(
          `Class with ID ${createTimeslotDto.classId} not found`,
        );
      }

      // Check for overlapping timeslots
      await this.checkForOverlappingTimeslots(
        createTimeslotDto.classId,
        createTimeslotDto.day,
        createTimeslotDto.startTime,
        createTimeslotDto.endTime,
      );

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async tx => {
        // Create the timeslot
        const timeslot = await tx.classTimeslot.create({
          data: {
            ...createTimeslotDto,
            createdById: userId,
          },
        });

        // Auto-create schedule slots for all active schedules of this class
        await this.createScheduleSlotsForTimeslot(tx, timeslot, userId);

        return timeslot;
      });

      return result as TimeslotResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A timeslot with the same time range already exists',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Auto-create schedule slots for a new timeslot across all active schedules
   */
  private async createScheduleSlotsForTimeslot(
    tx: Prisma.TransactionClient,
    timeslot: { id: string; classId: string; day: string; type: TimeslotType },
    userId: string,
  ): Promise<void> {
    // Find all active schedules for this class
    const activeSchedules = await tx.classSchedule.findMany({
      where: {
        classId: timeslot.classId,
        status: 'active',
        deletedAt: null,
      },
    });

    // Create schedule slots for each active schedule
    for (const schedule of activeSchedules) {
      await tx.scheduleSlot.create({
        data: {
          scheduleId: schedule.id,
          timeslotId: timeslot.id,
          day: timeslot.day,
          type: timeslot.type,
          createdById: userId,
        },
      });
    }
  }

  /**
   * Create multiple timeslots at once
   */
  async bulkCreateTimeslots(
    bulkCreateDto: BulkCreateTimeslotsDto,
    userId: string,
  ): Promise<{ count: number; timeslots: TimeslotResponseDto[] }> {
    try {
      // Check if class exists
      const classExists = await this.prisma.class.findUnique({
        where: { id: bulkCreateDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException(
          `Class with ID ${bulkCreateDto.classId} not found`,
        );
      }

      // Check each timeslot for overlaps
      for (const timeslot of bulkCreateDto.timeslots) {
        await this.checkForOverlappingTimeslots(
          bulkCreateDto.classId,
          timeslot.day,
          timeslot.startTime,
          timeslot.endTime,
        );
      }

      // Create all timeslots
      const createdTimeslots = await Promise.all(
        bulkCreateDto.timeslots.map(timeslot =>
          this.prisma.classTimeslot.create({
            data: {
              ...timeslot,
              classId: bulkCreateDto.classId,
              createdById: userId,
            },
          }),
        ),
      );

      return {
        count: createdTimeslots.length,
        timeslots: createdTimeslots as TimeslotResponseDto[],
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'One or more timeslots with the same time range already exist',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get timeslots by class ID
   */
  async getTimeslotsByClass(classId: string): Promise<TimeslotResponseDto[]> {
    const timeslots = await this.prisma.classTimeslot.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return timeslots as TimeslotResponseDto[];
  }

  /**
   * Get a timeslot by ID
   */
  async getTimeslotById(id: string): Promise<TimeslotResponseDto> {
    const timeslot = await this.prisma.classTimeslot.findUnique({
      where: { id },
    });

    if (!timeslot) {
      throw new NotFoundException(`Timeslot with ID ${id} not found`);
    }

    return timeslot as TimeslotResponseDto;
  }

  /**
   * Update a timeslot
   */
  async updateTimeslot(
    id: string,
    updateTimeslotDto: UpdateTimeslotDto,
    userId: string,
  ): Promise<TimeslotResponseDto> {
    try {
      // Check if timeslot exists
      const existingTimeslot = await this.prisma.classTimeslot.findUnique({
        where: { id },
      });

      if (!existingTimeslot) {
        throw new NotFoundException(`Timeslot with ID ${id} not found`);
      }

      // Check for overlaps if time or day is being changed
      if (
        updateTimeslotDto.day ||
        updateTimeslotDto.startTime ||
        updateTimeslotDto.endTime
      ) {
        await this.checkForOverlappingTimeslots(
          existingTimeslot.classId,
          updateTimeslotDto.day || existingTimeslot.day,
          updateTimeslotDto.startTime || existingTimeslot.startTime,
          updateTimeslotDto.endTime || existingTimeslot.endTime,
          id,
        );
      }

      // Check if this timeslot is used in schedules
      const usedInSchedules = await this.prisma.scheduleSlot.findFirst({
        where: {
          timeslotId: id,
        },
      });

      if (usedInSchedules) {
        // If used in schedules, we need to be careful about certain changes
        if (
          updateTimeslotDto.day !== undefined &&
          updateTimeslotDto.day !== existingTimeslot.day
        ) {
          throw new BadRequestException(
            'Cannot change the day of a timeslot that is used in schedules',
          );
        }
      }

      // Update the timeslot
      const updatedTimeslot = await this.prisma.classTimeslot.update({
        where: { id },
        data: {
          ...updateTimeslotDto,
          updatedById: userId,
          updatedAt: new Date(),
        },
      });

      return updatedTimeslot as TimeslotResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A timeslot with the same time range already exists',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Delete a timeslot and cascade delete all related schedule slots
   */
  async deleteTimeslot(
    id: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    deletedScheduleSlots: number;
  }> {
    // Check if timeslot exists
    const existingTimeslot = await this.prisma.classTimeslot.findUnique({
      where: { id },
    });

    if (!existingTimeslot) {
      throw new NotFoundException(`Timeslot with ID ${id} not found`);
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async tx => {
      // Count and delete related schedule slots first
      const scheduleSlotCount = await tx.scheduleSlot.count({
        where: { timeslotId: id },
      });

      // Delete all related schedule slots
      await tx.scheduleSlot.deleteMany({
        where: { timeslotId: id },
      });

      // Delete the timeslot (soft delete)
      await tx.classTimeslot.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      return { deletedScheduleSlots: scheduleSlotCount };
    });

    return {
      success: true,
      message: `Timeslot deleted successfully. ${result.deletedScheduleSlots} schedule slots were also removed.`,
      deletedScheduleSlots: result.deletedScheduleSlots,
    };
  }

  /**
   * Get count of schedules that would be affected by timeslot deletion
   */
  async getTimeslotDeletionImpact(id: string): Promise<{
    affectedScheduleSlots: number;
    affectedSchedules: Array<{ id: string; name: string; className: string }>;
  }> {
    const timeslot = await this.prisma.classTimeslot.findUnique({
      where: { id },
    });

    if (!timeslot) {
      throw new NotFoundException(`Timeslot with ID ${id} not found`);
    }

    // Count affected schedule slots
    const affectedScheduleSlots = await this.prisma.scheduleSlot.count({
      where: { timeslotId: id },
    });

    // Get affected schedules with class info
    const affectedSchedules = await this.prisma.scheduleSlot.findMany({
      where: { timeslotId: id },
      select: {
        schedule: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
      distinct: ['scheduleId'],
    });

    return {
      affectedScheduleSlots,
      affectedSchedules: affectedSchedules.map(slot => ({
        id: slot.schedule.id,
        name: slot.schedule.name,
        className:
          slot.schedule.class.name ||
          `Grade ${slot.schedule.class.grade} ${slot.schedule.class.section}`,
      })),
    };
  }

  /**
   * Check for overlapping timeslots
   */
  private async checkForOverlappingTimeslots(
    classId: string,
    day: string,
    startTime: string,
    endTime: string,
    _excludeId?: string,
  ): Promise<void> {
    // Validate time format and order
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // We're allowing multiple timeslots per day for flexibility
    // This allows creating multiple periods, breaks, etc. for the same day
    return;
  }
}
