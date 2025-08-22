import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  ActivateScheduleDto,
  CheckTeacherConflictDto,
  CreateScheduleDto,
  CreateScheduleSlotDto,
  ScheduleResponseDto,
  ScheduleSlotResponseDto,
  UpdateScheduleDto,
  UpdateScheduleSlotDto,
} from '@sms/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new schedule
   */
  async createSchedule(
    createScheduleDto: CreateScheduleDto,
    userId: string,
  ): Promise<ScheduleResponseDto> {
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

      // Parse dates
      const startDate = new Date(createScheduleDto.startDate);
      const endDate = new Date(createScheduleDto.endDate);
      const effectiveFrom = new Date(createScheduleDto.effectiveFrom);

      // Validate dates
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (effectiveFrom < startDate || effectiveFrom > endDate) {
        throw new BadRequestException(
          'Effective date must be within start and end dates',
        );
      }

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async tx => {
        // Create the schedule
        const schedule = await tx.classSchedule.create({
          data: {
            ...createScheduleDto,
            startDate,
            endDate,
            effectiveFrom,
            createdById: userId,
          },
        });

        // Auto-create schedule slots for all existing timeslots of this class
        await this.createScheduleSlotsForExistingTimeslots(
          tx,
          schedule,
          userId,
        );

        return schedule;
      });

      return result as ScheduleResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'This class already has an active schedule',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Auto-create schedule slots for all existing timeslots when creating a new schedule
   */
  private async createScheduleSlotsForExistingTimeslots(
    tx: Prisma.TransactionClient,
    schedule: { id: string; classId: string },
    userId: string,
  ): Promise<void> {
    // Get all timeslots for this class
    const timeslots = await tx.classTimeslot.findMany({
      where: {
        classId: schedule.classId,
        deletedAt: null,
      },
    });

    // Create schedule slots for each timeslot
    for (const timeslot of timeslots) {
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
   * Auto-create default schedule for a class if none exists
   */
  async ensureDefaultScheduleExists(
    classId: string,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    // Check if class already has an active schedule
    const existingSchedule = await this.prisma.classSchedule.findFirst({
      where: {
        classId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (existingSchedule) {
      return existingSchedule as ScheduleResponseDto;
    }

    // Create default schedule
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);
    const effectiveFrom = new Date();

    const defaultScheduleDto: CreateScheduleDto = {
      classId,
      name: `Default Schedule ${currentYear}`,
      academicYear: currentYear.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      effectiveFrom: effectiveFrom.toISOString(),
      status: 'active',
    };

    return this.createSchedule(defaultScheduleDto, userId);
  }

  /**
   * Get schedules by class ID
   */
  async getSchedulesByClass(classId: string): Promise<ScheduleResponseDto[]> {
    const schedules = await this.prisma.classSchedule.findMany({
      where: {
        classId,
        deletedAt: null,
      },
      orderBy: [
        { status: 'desc' }, // Active schedules first
        { effectiveFrom: 'desc' }, // Most recent first
      ],
    });

    return schedules as ScheduleResponseDto[];
  }

  /**
   * Get a schedule by ID with its slots
   */
  async getScheduleById(
    id: string,
  ): Promise<ScheduleResponseDto & { slots: ScheduleSlotResponseDto[] }> {
    const schedule = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: {
        scheduleSlots: {
          where: { deletedAt: null },
          include: {
            timeslot: true,
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            room: true,
          },
          orderBy: [{ day: 'asc' }, { timeslot: { startTime: 'asc' } }],
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Transform the response to include teacher name
    const transformedSlots = schedule.scheduleSlots.map(slot => ({
      ...slot,
      teacher: slot.teacher
        ? {
            ...slot.teacher,
            fullName: slot.teacher.user?.fullName || '',
            email: slot.teacher.user?.email || '',
          }
        : null,
    }));

    return {
      ...schedule,
      slots: transformedSlots as ScheduleSlotResponseDto[],
    } as ScheduleResponseDto & { slots: ScheduleSlotResponseDto[] };
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    try {
      // Check if schedule exists
      const existingSchedule = await this.prisma.classSchedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }

      // Parse dates if provided
      const data: Record<string, unknown> = { ...updateScheduleDto };

      if (updateScheduleDto.startDate) {
        data.startDate = new Date(updateScheduleDto.startDate);
      }

      if (updateScheduleDto.endDate) {
        data.endDate = new Date(updateScheduleDto.endDate);
      }

      if (updateScheduleDto.effectiveFrom) {
        data.effectiveFrom = new Date(updateScheduleDto.effectiveFrom);
      }

      // Validate dates if all are provided
      if (data.startDate && data.endDate && data.startDate > data.endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (data.effectiveFrom) {
        const startDate = data.startDate || existingSchedule.startDate;
        const endDate = data.endDate || existingSchedule.endDate;

        if (data.effectiveFrom < startDate || data.effectiveFrom > endDate) {
          throw new BadRequestException(
            'Effective date must be within start and end dates',
          );
        }
      }

      // Update the schedule
      const updatedSchedule = await this.prisma.classSchedule.update({
        where: { id },
        data: {
          ...data,
          updatedById: userId,
          updatedAt: new Date(),
        },
      });

      return updatedSchedule as ScheduleResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'This class already has an active schedule',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if schedule exists
    const existingSchedule = await this.prisma.classSchedule.findUnique({
      where: { id },
      include: {
        scheduleSlots: {
          where: { deletedAt: null },
        },
      },
    });

    if (!existingSchedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // If schedule is active, don't allow deletion
    if (existingSchedule.status === 'active') {
      throw new BadRequestException(
        'Cannot delete an active schedule. Deactivate it first.',
      );
    }

    // Delete all schedule slots first
    await this.prisma.scheduleSlot.updateMany({
      where: { scheduleId: id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Then delete the schedule
    await this.prisma.classSchedule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  }

  /**
   * Activate a schedule
   */
  async activateSchedule(
    activateDto: ActivateScheduleDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if schedule exists
    const existingSchedule = await this.prisma.classSchedule.findUnique({
      where: { id: activateDto.id },
      include: {
        scheduleSlots: {
          where: { deletedAt: null },
        },
      },
    });

    if (!existingSchedule) {
      throw new NotFoundException(
        `Schedule with ID ${activateDto.id} not found`,
      );
    }

    // Check if schedule has slots
    if (existingSchedule.scheduleSlots.length === 0) {
      throw new BadRequestException(
        'Cannot activate an empty schedule. Add slots first.',
      );
    }

    // Check for teacher conflicts
    const conflicts = await this.validateScheduleForConflicts(
      existingSchedule.id,
    );
    if (conflicts.hasConflicts) {
      throw new BadRequestException(
        `Schedule has ${conflicts.conflictCount} teacher conflicts. Please resolve them before activating.`,
      );
    }

    // Deactivate any currently active schedule for this class
    await this.prisma.classSchedule.updateMany({
      where: {
        classId: existingSchedule.classId,
        status: 'active',
        id: { not: activateDto.id },
      },
      data: {
        status: 'inactive',
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    // Activate this schedule
    await this.prisma.classSchedule.update({
      where: { id: activateDto.id },
      data: {
        status: 'active',
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Schedule activated successfully',
    };
  }

  /**
   * Create a schedule slot
   */
  async createScheduleSlot(
    createSlotDto: CreateScheduleSlotDto,
    userId: string,
  ): Promise<ScheduleSlotResponseDto> {
    try {
      // Check if schedule exists
      const scheduleExists = await this.prisma.classSchedule.findUnique({
        where: { id: createSlotDto.scheduleId },
      });

      if (!scheduleExists) {
        throw new NotFoundException(
          `Schedule with ID ${createSlotDto.scheduleId} not found`,
        );
      }

      // Check if timeslot exists
      const timeslotExists = await this.prisma.classTimeslot.findUnique({
        where: { id: createSlotDto.timeslotId },
      });

      if (!timeslotExists) {
        throw new NotFoundException(
          `Timeslot with ID ${createSlotDto.timeslotId} not found`,
        );
      }

      // Check if day matches timeslot day
      if (createSlotDto.day !== timeslotExists.day) {
        throw new BadRequestException(
          `Day mismatch: Timeslot is for ${timeslotExists.day}, but slot is for ${createSlotDto.day}`,
        );
      }

      // Check if subject exists if provided
      if (createSlotDto.subjectId) {
        const subjectExists = await this.prisma.subject.findUnique({
          where: { id: createSlotDto.subjectId },
        });

        if (!subjectExists) {
          throw new NotFoundException(
            `Subject with ID ${createSlotDto.subjectId} not found`,
          );
        }
      }

      // Check if teacher exists if provided
      if (createSlotDto.teacherId) {
        const teacherExists = await this.prisma.teacher.findUnique({
          where: { id: createSlotDto.teacherId },
        });

        if (!teacherExists) {
          throw new NotFoundException(
            `Teacher with ID ${createSlotDto.teacherId} not found`,
          );
        }
      }

      // Check if room exists if provided
      if (createSlotDto.roomId) {
        const roomExists = await this.prisma.classroom.findUnique({
          where: { id: createSlotDto.roomId },
        });

        if (!roomExists) {
          throw new NotFoundException(
            `Room with ID ${createSlotDto.roomId} not found`,
          );
        }
      }

      // Check for teacher conflicts
      let hasConflict = false;
      if (createSlotDto.teacherId) {
        const conflict = await this.checkTeacherConflict({
          teacherId: createSlotDto.teacherId,
          day: createSlotDto.day,
          startTime: timeslotExists.startTime,
          endTime: timeslotExists.endTime,
        });

        hasConflict = conflict.hasConflict;
      }

      // Create the schedule slot
      const slot = await this.prisma.scheduleSlot.create({
        data: {
          ...createSlotDto,
          hasConflict,
          createdById: userId,
        },
        include: {
          timeslot: true,
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          room: true,
        },
      });

      // Transform the response to include teacher name
      const transformedSlot = {
        ...slot,
        teacher: slot.teacher
          ? {
              ...slot.teacher,
              fullName: slot.teacher.user?.fullName || '',
              email: slot.teacher.user?.email || '',
            }
          : null,
      };

      return transformedSlot as ScheduleSlotResponseDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A schedule slot for this timeslot already exists',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get schedule slots by schedule ID
   */
  async getScheduleSlotsBySchedule(
    scheduleId: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        scheduleId,
        deletedAt: null,
      },
      include: {
        timeslot: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: [{ day: 'asc' }, { timeslot: { startTime: 'asc' } }],
    });

    // Transform the response to include teacher name
    const transformedSlots = slots.map(slot => ({
      ...slot,
      teacher: slot.teacher
        ? {
            ...slot.teacher,
            fullName: slot.teacher.user?.fullName || '',
            email: slot.teacher.user?.email || '',
          }
        : null,
    }));

    return transformedSlots as ScheduleSlotResponseDto[];
  }

  /**
   * Update a schedule slot
   */
  async updateScheduleSlot(
    id: string,
    updateSlotDto: UpdateScheduleSlotDto,
    userId: string,
  ): Promise<ScheduleSlotResponseDto> {
    // Check if slot exists
    const existingSlot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        timeslot: true,
      },
    });

    if (!existingSlot) {
      throw new NotFoundException(`Schedule slot with ID ${id} not found`);
    }

    // Check if timeslot exists if provided
    if (updateSlotDto.timeslotId) {
      const timeslotExists = await this.prisma.classTimeslot.findUnique({
        where: { id: updateSlotDto.timeslotId },
      });

      if (!timeslotExists) {
        throw new NotFoundException(
          `Timeslot with ID ${updateSlotDto.timeslotId} not found`,
        );
      }

      // Check if day matches timeslot day
      const day = updateSlotDto.day || existingSlot.day;
      if (day !== timeslotExists.day) {
        throw new BadRequestException(
          `Day mismatch: Timeslot is for ${timeslotExists.day}, but slot is for ${day}`,
        );
      }
    }

    // Check if subject exists if provided
    if (updateSlotDto.subjectId) {
      const subjectExists = await this.prisma.subject.findUnique({
        where: { id: updateSlotDto.subjectId },
      });

      if (!subjectExists) {
        throw new NotFoundException(
          `Subject with ID ${updateSlotDto.subjectId} not found`,
        );
      }
    }

    // Check for teacher conflicts if teacher is being updated
    let hasConflict = existingSlot.hasConflict;
    if (updateSlotDto.teacherId) {
      const teacherExists = await this.prisma.teacher.findUnique({
        where: { id: updateSlotDto.teacherId },
      });

      if (!teacherExists) {
        throw new NotFoundException(
          `Teacher with ID ${updateSlotDto.teacherId} not found`,
        );
      }

      // Get the timeslot to use for conflict checking
      let timeslotToUse = existingSlot.timeslot;
      if (updateSlotDto.timeslotId) {
        const newTimeslot = await this.prisma.classTimeslot.findUnique({
          where: { id: updateSlotDto.timeslotId },
        });

        if (newTimeslot) {
          timeslotToUse = newTimeslot;
        } else {
          throw new NotFoundException(
            `Timeslot with ID ${updateSlotDto.timeslotId} not found`,
          );
        }
      }

      const conflict = await this.checkTeacherConflict({
        teacherId: updateSlotDto.teacherId,
        day: updateSlotDto.day || existingSlot.day,
        startTime: timeslotToUse.startTime,
        endTime: timeslotToUse.endTime,
        excludeSlotId: id,
      });

      hasConflict = conflict.hasConflict;
    }

    // Check if room exists if provided
    if (updateSlotDto.roomId) {
      const roomExists = await this.prisma.classroom.findUnique({
        where: { id: updateSlotDto.roomId },
      });

      if (!roomExists) {
        throw new NotFoundException(
          `Room with ID ${updateSlotDto.roomId} not found`,
        );
      }
    }

    // Update the schedule slot
    const updatedSlot = await this.prisma.scheduleSlot.update({
      where: { id },
      data: {
        ...updateSlotDto,
        hasConflict,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        timeslot: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        room: true,
      },
    });

    // Transform the response to include teacher name
    const transformedSlot = {
      ...updatedSlot,
      teacher: updatedSlot.teacher
        ? {
            ...updatedSlot.teacher,
            fullName: updatedSlot.teacher.user?.fullName || '',
            email: updatedSlot.teacher.user?.email || '',
          }
        : null,
    };

    return transformedSlot as ScheduleSlotResponseDto;
  }

  /**
   * Delete a schedule slot
   */
  async deleteScheduleSlot(
    id: string,
    _userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if slot exists
    const existingSlot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
    });

    if (!existingSlot) {
      throw new NotFoundException(`Schedule slot with ID ${id} not found`);
    }

    // Hard delete the slot
    await this.prisma.scheduleSlot.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Schedule slot deleted successfully',
    };
  }

  /**
   * Check for teacher conflicts
   */
  async checkTeacherConflict(
    checkConflictDto: CheckTeacherConflictDto,
  ): Promise<{
    hasConflict: boolean;
    conflictingSlots?: Record<string, unknown>[];
  }> {
    // Find any slots where this teacher is assigned at the same time
    const conflictingSlots = await this.prisma.scheduleSlot.findMany({
      where: {
        teacherId: checkConflictDto.teacherId,
        day: checkConflictDto.day,
        deletedAt: null,
        id: checkConflictDto.excludeSlotId
          ? { not: checkConflictDto.excludeSlotId }
          : undefined,
        timeslot: {
          OR: [
            // Case 1: Existing slot starts during the new time range
            {
              AND: [
                { startTime: { gte: checkConflictDto.startTime } },
                { startTime: { lt: checkConflictDto.endTime } },
              ],
            },
            // Case 2: Existing slot ends during the new time range
            {
              AND: [
                { endTime: { gt: checkConflictDto.startTime } },
                { endTime: { lte: checkConflictDto.endTime } },
              ],
            },
            // Case 3: Existing slot completely contains the new time range
            {
              AND: [
                { startTime: { lte: checkConflictDto.startTime } },
                { endTime: { gte: checkConflictDto.endTime } },
              ],
            },
          ],
        },
      },
      include: {
        timeslot: true,
        schedule: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });

    return {
      hasConflict: conflictingSlots.length > 0,
      conflictingSlots:
        conflictingSlots.length > 0 ? conflictingSlots : undefined,
    };
  }

  /**
   * Validate a schedule for conflicts
   */
  private async validateScheduleForConflicts(scheduleId: string): Promise<{
    hasConflicts: boolean;
    conflictCount: number;
  }> {
    const conflictingSlots = await this.prisma.scheduleSlot.findMany({
      where: {
        scheduleId,
        hasConflict: true,
        deletedAt: null,
      },
    });

    return {
      hasConflicts: conflictingSlots.length > 0,
      conflictCount: conflictingSlots.length,
    };
  }
}
