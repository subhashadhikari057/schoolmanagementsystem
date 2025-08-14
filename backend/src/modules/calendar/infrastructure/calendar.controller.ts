/**
 * =============================================================================
 * Calendar Controller
 * =============================================================================
 * REST API endpoints for calendar management
 * =============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CalendarService } from '../application/calendar.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { User, UserId } from '../../../shared/decorators/user.decorator';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
  CalendarEntriesQueryDto,
  CalendarEntryResponseDto,
  CalendarEntriesResponseDto,
  BulkCalendarOperationDto,
  CreateCalendarEntrySchema,
  UpdateCalendarEntrySchema,
  CalendarEntriesQuerySchema,
  BulkCalendarOperationSchema,
} from '../dto/calendar.dto';

@Controller('api/calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Create a new calendar entry
   * Only Admin and Super Admin can create calendar entries
   */
  @Post()
  @RoleAccess.AdminLevel()
  async create(
    @Body(new ZodValidationPipe(CreateCalendarEntrySchema))
    dto: CreateCalendarEntryDto,
    @UserId() userId: string,
  ): Promise<CalendarEntryResponseDto> {
    return this.calendarService.create(dto, userId);
  }

  /**
   * Get all calendar entries with filtering and pagination
   * All authenticated users can view published entries
   * Admin and Super Admin can view all entries including unpublished
   */
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(CalendarEntriesQuerySchema))
    query: CalendarEntriesQueryDto,
    @User() user: any,
  ): Promise<CalendarEntriesResponseDto> {
    // All users can see all calendar entries

    return this.calendarService.findMany(query);
  }

  /**
   * Get upcoming calendar entries (for dashboard widgets)
   * All authenticated users can access this
   */
  @Get('upcoming')
  async getUpcoming(
    @Query('limit') limit?: string,
  ): Promise<CalendarEntryResponseDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.calendarService.getUpcoming(parsedLimit);
  }

  /**
   * Get calendar statistics
   * Only Admin and Super Admin can access statistics
   */
  @Get('statistics')
  @RoleAccess.AdminLevel()
  async getStatistics(): Promise<{
    total: number;
    holidays: number;
    events: number;
    thisMonth: number;
  }> {
    return this.calendarService.getStatistics();
  }

  /**
   * Get a specific calendar entry by ID
   * All authenticated users can view published entries
   * Admin and Super Admin can view any entry
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: any,
  ): Promise<CalendarEntryResponseDto> {
    const entry = await this.calendarService.findOne(id);

    // All users can access calendar entries

    return entry;
  }

  /**
   * Update a calendar entry
   * Only Admin and Super Admin can update calendar entries
   */
  @Patch(':id')
  @RoleAccess.AdminLevel()
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCalendarEntrySchema))
    dto: UpdateCalendarEntryDto,
    @UserId() userId: string,
  ): Promise<CalendarEntryResponseDto> {
    return this.calendarService.update(id, dto, userId);
  }

  /**
   * Delete a calendar entry
   * Only Admin and Super Admin can delete calendar entries
   */
  @Delete(':id')
  @RoleAccess.AdminLevel()
  async remove(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<{ message: string }> {
    await this.calendarService.remove(id, userId);
    return { message: 'Calendar entry deleted successfully' };
  }

  /**
   * Bulk operations on calendar entries
   * Only Admin and Super Admin can perform bulk operations
   */
  @Post('bulk')
  @RoleAccess.AdminLevel()
  async bulkOperation(
    @Body(new ZodValidationPipe(BulkCalendarOperationSchema))
    dto: BulkCalendarOperationDto,
    @UserId() userId: string,
  ): Promise<{ success: number; failed: number }> {
    return this.calendarService.bulkOperation(dto, userId);
  }
}
