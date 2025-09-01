import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ExamDateslotService } from '../services/exam-dateslot.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { UserId } from '../../../shared/decorators/user.decorator';
import {
  CreateExamDateslotDto,
  UpdateExamDateslotDto,
  ExamDateslotResponseDto,
  GetDateslotsByCalendarEntryDto,
  BulkCreateExamDateslotsDto,
  GenerateDateslotsFromRangeDto,
  createExamDateslotSchema,
  updateExamDateslotSchema,
  getDateslotsByCalendarEntrySchema,
  bulkCreateExamDateslotsSchema,
  generateDateslotsFromRangeSchema,
} from '@sms/shared-types';

@Controller('api/v1/exam-dateslots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamDateslotController {
  constructor(private readonly examDateslotService: ExamDateslotService) {}

  /**
   * Create a new exam dateslot
   */
  @Post()
  @RoleAccess.Academic()
  async createDateslot(
    @Body(new ValidationPipe({ transform: true }))
    createDateslotDto: CreateExamDateslotDto,
    @UserId() userId: string,
  ): Promise<ExamDateslotResponseDto> {
    // Validate the DTO
    const validatedDto = createExamDateslotSchema.parse(createDateslotDto);
    return this.examDateslotService.createDateslot(validatedDto, userId);
  }

  /**
   * Get all dateslots for a calendar entry
   */
  @Get('calendar-entry/:calendarEntryId')
  @RoleAccess.Academic()
  async getDateslotsByCalendarEntry(
    @Param('calendarEntryId') calendarEntryId: string,
  ): Promise<ExamDateslotResponseDto[]> {
    // Validate the parameter
    const validatedDto = getDateslotsByCalendarEntrySchema.parse({
      calendarEntryId,
    });
    return this.examDateslotService.getDateslotsByCalendarEntry(
      validatedDto.calendarEntryId,
    );
  }

  /**
   * Get a single dateslot by ID
   */
  @Get(':id')
  @RoleAccess.Academic()
  async getDateslotById(
    @Param('id') id: string,
  ): Promise<ExamDateslotResponseDto> {
    return this.examDateslotService.getDateslotById(id);
  }

  /**
   * Update an exam dateslot
   */
  @Put(':id')
  @RoleAccess.Academic()
  async updateDateslot(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true }))
    updateDateslotDto: UpdateExamDateslotDto,
    @UserId() userId: string,
  ): Promise<ExamDateslotResponseDto> {
    // Validate the DTO
    const validatedDto = updateExamDateslotSchema.parse(updateDateslotDto);
    return this.examDateslotService.updateDateslot(id, validatedDto, userId);
  }

  /**
   * Delete an exam dateslot
   */
  @Delete(':id')
  @RoleAccess.Academic()
  async deleteDateslot(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<{ message: string }> {
    await this.examDateslotService.deleteDateslot(id, userId);
    return { message: 'Exam dateslot deleted successfully' };
  }

  /**
   * Bulk create exam dateslots
   */
  @Post('bulk')
  @RoleAccess.Academic()
  async bulkCreateDateslots(
    @Body(new ValidationPipe({ transform: true }))
    bulkCreateDto: BulkCreateExamDateslotsDto,
    @UserId() userId: string,
  ): Promise<ExamDateslotResponseDto[]> {
    // Validate the DTO
    const validatedDto = bulkCreateExamDateslotsSchema.parse(bulkCreateDto);
    return this.examDateslotService.bulkCreateDateslots(validatedDto, userId);
  }

  /**
   * Generate dateslots from date range
   */
  @Post('generate-from-range')
  @RoleAccess.Academic()
  async generateDateslotsFromRange(
    @Body(new ValidationPipe({ transform: true }))
    generateDto: GenerateDateslotsFromRangeDto,
    @UserId() userId: string,
  ): Promise<ExamDateslotResponseDto[]> {
    // Validate the DTO
    const validatedDto = generateDateslotsFromRangeSchema.parse(generateDto);
    return this.examDateslotService.generateDateslotsFromRange(
      validatedDto,
      userId,
    );
  }
}
