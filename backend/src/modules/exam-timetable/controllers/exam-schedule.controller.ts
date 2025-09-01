import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ExamScheduleService } from '../services/exam-schedule.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';

import { UserId } from '../../../shared/decorators/user.decorator';
import {
  CreateExamScheduleDto,
  UpdateExamScheduleDto,
  ExamScheduleResponseDto,
  BulkCreateExamSchedulesDto,
  CreateExamSlotDto,
  UpdateExamSlotDto,
  ExamSlotResponseDto,
  createExamScheduleSchema,
  updateExamScheduleSchema,
  getExamSchedulesByClassSchema,
  getExamSchedulesByCalendarEntrySchema,
  bulkCreateExamSchedulesSchema,
  activateExamScheduleSchema,
  createExamSlotSchema,
  updateExamSlotSchema,
  getExamSlotsByScheduleSchema,
} from '@sms/shared-types';

@Controller('api/v1/exam-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamScheduleController {
  constructor(private readonly examScheduleService: ExamScheduleService) {}

  /**
   * Create a new exam schedule
   */
  @Post()
  @RoleAccess.Academic()
  async createExamSchedule(
    @Body(new ValidationPipe({ transform: true }))
    createScheduleDto: CreateExamScheduleDto,
    @UserId() userId: string,
  ): Promise<ExamScheduleResponseDto> {
    // Validate the DTO
    const validatedDto = createExamScheduleSchema.parse(createScheduleDto);
    return this.examScheduleService.createExamSchedule(validatedDto, userId);
  }

  /**
   * Get all exam schedules for a class
   */
  @Get('class/:classId')
  @RoleAccess.Academic()
  async getExamSchedulesByClass(
    @Param('classId') classId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    // Validate the parameter
    const validatedDto = getExamSchedulesByClassSchema.parse({ classId });
    return this.examScheduleService.getExamSchedulesByClass(
      validatedDto.classId,
    );
  }

  /**
   * Get all exam schedules for a calendar entry
   */
  @Get('calendar-entry/:calendarEntryId')
  @RoleAccess.Academic()
  async getExamSchedulesByCalendarEntry(
    @Param('calendarEntryId') calendarEntryId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    // Validate the parameter
    const validatedDto = getExamSchedulesByCalendarEntrySchema.parse({
      calendarEntryId,
    });
    return this.examScheduleService.getExamSchedulesByCalendarEntry(
      validatedDto.calendarEntryId,
    );
  }

  /**
   * Get a single exam schedule by ID
   */
  @Get(':id')
  @RoleAccess.Academic()
  async getExamScheduleById(
    @Param('id') id: string,
  ): Promise<ExamScheduleResponseDto> {
    return this.examScheduleService.getExamScheduleById(id);
  }

  /**
   * Update an exam schedule
   */
  @Put(':id')
  @RoleAccess.Academic()
  async updateExamSchedule(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true }))
    updateScheduleDto: UpdateExamScheduleDto,
    @UserId() userId: string,
  ): Promise<ExamScheduleResponseDto> {
    // Validate the DTO
    const validatedDto = updateExamScheduleSchema.parse(updateScheduleDto);
    return this.examScheduleService.updateExamSchedule(
      id,
      validatedDto,
      userId,
    );
  }

  /**
   * Delete an exam schedule
   */
  @Delete(':id')
  @RoleAccess.Academic()
  async deleteExamSchedule(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<{ message: string }> {
    await this.examScheduleService.deleteExamSchedule(id, userId);
    return { message: 'Exam schedule deleted successfully' };
  }

  /**
   * Bulk create exam schedules for multiple classes
   */
  @Post('bulk')
  @RoleAccess.Academic()
  async bulkCreateExamSchedules(
    @Body(new ValidationPipe({ transform: true }))
    bulkCreateDto: BulkCreateExamSchedulesDto,
    @UserId() userId: string,
  ): Promise<ExamScheduleResponseDto[]> {
    // Validate the DTO
    const validatedDto = bulkCreateExamSchedulesSchema.parse(bulkCreateDto);
    return this.examScheduleService.bulkCreateExamSchedules(
      validatedDto,
      userId,
    );
  }

  /**
   * Activate an exam schedule
   */
  @Post(':id/activate')
  @RoleAccess.Academic()
  async activateExamSchedule(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<ExamScheduleResponseDto> {
    // Validate the parameter
    const validatedDto = activateExamScheduleSchema.parse({ id });
    return this.examScheduleService.activateExamSchedule(validatedDto, userId);
  }

  /**
   * Create an exam slot
   */
  @Post('slots')
  @RoleAccess.Academic()
  async createExamSlot(
    @Body(new ValidationPipe({ transform: true }))
    createSlotDto: CreateExamSlotDto,
    @UserId() userId: string,
  ): Promise<ExamSlotResponseDto> {
    // Validate the DTO
    const validatedDto = createExamSlotSchema.parse(createSlotDto);
    return this.examScheduleService.createExamSlot(validatedDto, userId);
  }

  /**
   * Get exam slots by schedule
   */
  @Get(':examScheduleId/slots')
  @RoleAccess.Academic()
  async getExamSlotsBySchedule(
    @Param('examScheduleId') examScheduleId: string,
  ): Promise<ExamSlotResponseDto[]> {
    // Validate the parameter
    const validatedDto = getExamSlotsByScheduleSchema.parse({ examScheduleId });
    return this.examScheduleService.getExamSlotsBySchedule(
      validatedDto.examScheduleId,
    );
  }

  /**
   * Update an exam slot
   */
  @Put('slots/:id')
  @RoleAccess.Academic()
  async updateExamSlot(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true }))
    updateSlotDto: UpdateExamSlotDto,
    @UserId() userId: string,
  ): Promise<ExamSlotResponseDto> {
    // Validate the DTO
    const validatedDto = updateExamSlotSchema.parse(updateSlotDto);
    return this.examScheduleService.updateExamSlot(id, validatedDto, userId);
  }

  /**
   * Delete an exam slot
   */
  @Delete('slots/:id')
  @RoleAccess.Academic()
  async deleteExamSlot(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<{ message: string }> {
    await this.examScheduleService.deleteExamSlot(id, userId);
    return { message: 'Exam slot deleted successfully' };
  }
}
