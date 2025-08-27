/**
 * =============================================================================
 * Calendar Service
 * =============================================================================
 * Handles business logic for calendar management operations
 * =============================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { WorkingDaysService } from '../../attendance/application/working-days.service';
import {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntriesQueryDto,
  CalendarEntryResponseDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarEntryType,
  HolidayType,
  ExamType,
  EmergencyClosureType,
} from '../dto/calendar.dto';
import { CalendarEntry, Prisma } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workingDaysService: WorkingDaysService,
  ) {}

  /**
   * Create a new calendar entry
   */
  async create(
    dto: CreateCalendarEntryDto,
    userId: string,
  ): Promise<CalendarEntryResponseDto> {
    // Calendar entry creation logic

    try {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      const data: Prisma.CalendarEntryCreateInput = {
        name: dto.name,
        type: dto.type as any, // Type conversion needed due to enum mismatch
        startDate,
        endDate,
        venue: dto.venue,
        eventScope: dto.eventScope,
        holidayType: dto.holidayType as any,
        startTime: dto.startTime,
        endTime: dto.endTime,
        examType: dto.examType as any,
        examDetails: dto.examDetails,
        emergencyClosureType: dto.emergencyClosureType as any,
        emergencyReason: dto.emergencyReason,
        affectedAreas: dto.affectedAreas,
        createdById: userId,
      };

      const entry = await this.prisma.calendarEntry.create({
        data,
      });

      // Recalculate working days for affected months
      await this.workingDaysService.recalculateForEvent(startDate, endDate);

      return this.mapToResponseDto(entry);
    } catch (error) {
      console.error('Error creating calendar entry:', error);
      throw new BadRequestException('Failed to create calendar entry');
    }
  }

  /**
   * Get calendar entries with filtering and pagination
   */
  async findMany(
    query: CalendarEntriesQueryDto,
  ): Promise<CalendarEntriesResponseDto> {
    const {
      page = 1,
      limit = 20,
      type,
      examType,
      startDate,
      endDate,
      month,
      year,
      search,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CalendarEntryWhereInput = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (examType) {
      where.examType = examType;
    }

    if (startDate && endDate) {
      where.AND = [
        { startDate: { gte: new Date(startDate) } },
        { startDate: { lte: new Date(endDate) } },
      ];
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.startDate = { lte: new Date(endDate) };
    }

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      where.AND = [
        { startDate: { gte: startOfMonth } },
        { startDate: { lte: endOfMonth } },
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { examDetails: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [entries, total] = await Promise.all([
        this.prisma.calendarEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startDate: 'asc' },
        }),
        this.prisma.calendarEntry.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: CalendarEntriesResponseDto = {
        entries: entries.map(entry => this.mapToResponseDto(entry)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      return response;
    } catch {
      throw new BadRequestException('Failed to fetch calendar entries');
    }
  }

  /**
   * Get a single calendar entry by ID
   */
  async findOne(id: string): Promise<CalendarEntryResponseDto> {
    const entry = await this.prisma.calendarEntry.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entry) {
      throw new NotFoundException('Calendar entry not found');
    }

    return this.mapToResponseDto(entry);
  }

  /**
   * Update a calendar entry
   */
  async update(
    id: string,
    dto: UpdateCalendarEntryDto,
    userId: string,
  ): Promise<CalendarEntryResponseDto> {
    // Check if entry exists
    const existingEntry = await this.prisma.calendarEntry.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('Calendar entry not found');
    }

    try {
      const updateData: Prisma.CalendarEntryUpdateInput = {
        updatedById: userId,
      };

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.startDate !== undefined)
        updateData.startDate = new Date(dto.startDate);
      if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
      if (dto.venue !== undefined) updateData.venue = dto.venue;
      if (dto.holidayType !== undefined)
        updateData.holidayType = dto.holidayType;
      if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
      if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
      if (dto.examType !== undefined) updateData.examType = dto.examType;
      if (dto.examDetails !== undefined)
        updateData.examDetails = dto.examDetails;

      const updatedEntry = await this.prisma.calendarEntry.update({
        where: { id },
        data: updateData,
      });

      // Recalculate working days for affected months
      // Use both old and new dates to ensure all affected months are recalculated
      const oldStartDate = existingEntry.startDate;
      const oldEndDate = existingEntry.endDate;
      const newStartDate = dto.startDate
        ? new Date(dto.startDate)
        : oldStartDate;
      const newEndDate = dto.endDate ? new Date(dto.endDate) : oldEndDate;

      // Recalculate for old date range (in case event was moved)
      await this.workingDaysService.recalculateForEvent(
        oldStartDate,
        oldEndDate,
      );

      // Recalculate for new date range (in case dates changed)
      if (
        newStartDate.getTime() !== oldStartDate.getTime() ||
        newEndDate.getTime() !== oldEndDate.getTime()
      ) {
        await this.workingDaysService.recalculateForEvent(
          newStartDate,
          newEndDate,
        );
      }

      return this.mapToResponseDto(updatedEntry);
    } catch {
      throw new BadRequestException('Failed to update calendar entry');
    }
  }

  /**
   * Delete a calendar entry (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.prisma.calendarEntry.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entry) {
      throw new NotFoundException('Calendar entry not found');
    }

    try {
      await this.prisma.calendarEntry.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      // Recalculate working days for the affected months after deletion
      await this.workingDaysService.recalculateForEvent(
        entry.startDate,
        entry.endDate,
      );
    } catch {
      throw new BadRequestException('Failed to delete calendar entry');
    }
  }

  /**
   * Bulk operations on calendar entries
   */
  async bulkOperation(
    dto: BulkCalendarOperationDto,
    userId: string,
  ): Promise<{ success: number; failed: number }> {
    const { entryIds, action } = dto;
    let success = 0;
    let failed = 0;

    for (const entryId of entryIds) {
      try {
        const entry = await this.prisma.calendarEntry.findFirst({
          where: {
            id: entryId,
            deletedAt: null,
          },
        });

        if (!entry) {
          failed++;
          continue;
        }

        switch (action) {
          case 'delete':
            await this.prisma.calendarEntry.update({
              where: { id: entryId },
              data: { deletedAt: new Date(), deletedById: userId },
            });
            break;
        }

        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get upcoming events (for dashboard/widgets)
   */
  async getUpcoming(limit: number = 10): Promise<CalendarEntryResponseDto[]> {
    const entries = await this.prisma.calendarEntry.findMany({
      where: {
        deletedAt: null,
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    });

    return entries.map(entry => this.mapToResponseDto(entry));
  }

  /**
   * Get calendar statistics
   */
  async getStatistics(): Promise<{
    total: number;
    holidays: number;
    events: number;
    exams: number;
    thisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [total, holidays, events, exams, thisMonth] = await Promise.all([
      this.prisma.calendarEntry.count({
        where: { deletedAt: null },
      }),
      this.prisma.calendarEntry.count({
        where: { deletedAt: null, type: CalendarEntryType.HOLIDAY },
      }),
      this.prisma.calendarEntry.count({
        where: { deletedAt: null, type: CalendarEntryType.EVENT },
      }),
      this.prisma.calendarEntry.count({
        where: { deletedAt: null, type: CalendarEntryType.EXAM },
      }),
      this.prisma.calendarEntry.count({
        where: {
          deletedAt: null,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    return {
      total,
      holidays,
      events,
      exams,
      thisMonth,
    };
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(entry: CalendarEntry): CalendarEntryResponseDto {
    return {
      id: entry.id,
      name: entry.name,
      type: entry.type as CalendarEntryType,
      startDate: entry.startDate.toISOString(),
      endDate: entry.endDate.toISOString(),
      venue: entry.venue || undefined,
      holidayType: entry.holidayType as HolidayType | undefined,
      startTime: entry.startTime || undefined,
      endTime: entry.endTime || undefined,
      examType: entry.examType as ExamType | undefined,
      examDetails: entry.examDetails || undefined,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt?.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
      createdById: entry.createdById || undefined,
      updatedById: entry.updatedById || undefined,
      deletedById: entry.deletedById || undefined,
    };
  }
}
