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
// Note: For now using console logging, can be replaced with proper audit service later
import {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntriesQueryDto,
  CalendarEntryResponseDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CalendarEntryType,
} from '../dto/calendar.dto';
import { CalendarEntry, Prisma } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new calendar entry
   */
  async create(
    dto: CreateCalendarEntryDto,
    userId: string,
  ): Promise<CalendarEntryResponseDto> {
    // Simple logging without audit for now
    console.log('Creating calendar entry', { dto, userId });

    try {
      const data: Prisma.CalendarEntryCreateInput = {
        name: dto.name,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        venue: dto.venue,
        holidayType: dto.holidayType,
        createdById: userId,
      };

      const entry = await this.prisma.calendarEntry.create({
        data,
      });

      console.log('Calendar entry created successfully', { entryId: entry.id });
      return this.mapToResponseDto(entry);
    } catch (error) {
      console.error('Failed to create calendar entry', {
        error: error.message,
        dto,
      });
      throw new BadRequestException('Failed to create calendar entry');
    }
  }

  /**
   * Get calendar entries with filtering and pagination
   */
  async findMany(
    query: CalendarEntriesQueryDto,
  ): Promise<CalendarEntriesResponseDto> {
    console.log('Fetching calendar entries', { query });

    const {
      page = 1,
      limit = 20,
      type,
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

      console.log('Calendar entries fetched successfully', {
        count: entries.length,
        total,
      });

      return response;
    } catch (error) {
      console.error('Failed to fetch calendar entries', {
        error: error.message,
        query,
      });
      throw new BadRequestException('Failed to fetch calendar entries');
    }
  }

  /**
   * Get a single calendar entry by ID
   */
  async findOne(id: string): Promise<CalendarEntryResponseDto> {
    console.log('Fetching calendar entry', { id });

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
    console.log('Updating calendar entry', { id, dto, userId });

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

      const updatedEntry = await this.prisma.calendarEntry.update({
        where: { id },
        data: updateData,
      });

      console.log('Calendar entry updated successfully', { id });
      return this.mapToResponseDto(updatedEntry);
    } catch (error) {
      console.error('Failed to update calendar entry', {
        error: error.message,
        id,
        dto,
      });
      throw new BadRequestException('Failed to update calendar entry');
    }
  }

  /**
   * Delete a calendar entry (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    console.log('Deleting calendar entry', { id, userId });

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

      console.log('Calendar entry deleted successfully', { id });
    } catch (error) {
      console.error('Failed to delete calendar entry', {
        error: error.message,
        id,
      });
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
    console.log('Performing bulk operation', { dto, userId });

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
      } catch (error) {
        console.error('Bulk operation failed for entry', {
          error: error.message,
          entryId,
        });
        failed++;
      }
    }

    console.log('Bulk operation completed', { success, failed, action });
    return { success, failed };
  }

  /**
   * Get upcoming events (for dashboard/widgets)
   */
  async getUpcoming(limit: number = 10): Promise<CalendarEntryResponseDto[]> {
    console.log('Fetching upcoming events', { limit });

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
    thisMonth: number;
  }> {
    console.log('Fetching calendar statistics');

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

    const [total, holidays, events, thisMonth] = await Promise.all([
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
      type: entry.type as any,
      startDate: entry.startDate.toISOString(),
      endDate: entry.endDate.toISOString(),
      venue: entry.venue || undefined,
      holidayType: entry.holidayType as any,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt?.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
      createdById: entry.createdById || undefined,
      updatedById: entry.updatedById || undefined,
      deletedById: entry.deletedById || undefined,
    };
  }
}
