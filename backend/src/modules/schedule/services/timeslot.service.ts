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
import { Prisma } from '@prisma/client';

@Injectable()
export class TimeslotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new timeslot
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

      // Create the timeslot
      const timeslot = await this.prisma.classTimeslot.create({
        data: {
          ...createTimeslotDto,
          createdById: userId,
        },
      });

      return timeslot as TimeslotResponseDto;
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

      // Create all timeslots in a transaction
      const createdTimeslots = await this.prisma.$transaction(
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

      // If updating time or day, check for overlaps
      if (
        updateTimeslotDto.day ||
        updateTimeslotDto.startTime ||
        updateTimeslotDto.endTime
      ) {
        const day = updateTimeslotDto.day || existingTimeslot.day;
        const startTime =
          updateTimeslotDto.startTime || existingTimeslot.startTime;
        const endTime = updateTimeslotDto.endTime || existingTimeslot.endTime;

        await this.checkForOverlappingTimeslots(
          existingTimeslot.classId,
          day,
          startTime,
          endTime,
          id,
        );
      }

      // Check if this timeslot is used in any schedules
      const usedInSchedules = await this.prisma.scheduleSlot.findFirst({
        where: {
          timeslotId: id,
          deletedAt: null,
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
   * Delete a timeslot
   */
  async deleteTimeslot(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if timeslot exists
    const existingTimeslot = await this.prisma.classTimeslot.findUnique({
      where: { id },
    });

    if (!existingTimeslot) {
      throw new NotFoundException(`Timeslot with ID ${id} not found`);
    }

    // Check if this timeslot is used in any schedules
    const usedInSchedules = await this.prisma.scheduleSlot.findFirst({
      where: {
        timeslotId: id,
        deletedAt: null,
      },
    });

    if (usedInSchedules) {
      throw new BadRequestException(
        'Cannot delete a timeslot that is used in schedules. Please remove it from all schedules first.',
      );
    }

    // Hard delete the timeslot
    await this.prisma.classTimeslot.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Timeslot deleted successfully',
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
    excludeId?: string,
  ): Promise<void> {
    // Validate time format and order
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // We're no longer checking for overlapping timeslots to allow multiple periods per day
    // This allows creating multiple periods, breaks, etc. for the same day
    return;
  }
}
