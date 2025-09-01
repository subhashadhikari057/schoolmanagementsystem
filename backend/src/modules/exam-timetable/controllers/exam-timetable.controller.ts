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
import { ExamTimetableService } from '../services/exam-timetable.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/guards/jwt-auth.guard';
import {
  ExamTimetableSlotDto,
  BulkExamTimetableOperationDto,
  GetExamTimetableDto,
  ValidateExamTimetableDto,
  AssignSubjectToExamDateslotDto,
  RemoveSubjectFromDateslotDto,
  CopyExamTimetableDto,
  ExamTimetableSummaryDto,
  getExamTimetableSchema,
  validateExamTimetableSchema,
  assignSubjectToExamDateslotSchema,
  removeSubjectFromDateslotSchema,
  copyExamTimetableSchema,
  bulkExamTimetableOperationSchema,
} from '@sms/shared-types';

@Controller('api/v1/exam-timetables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamTimetableController {
  constructor(private readonly examTimetableService: ExamTimetableService) {}

  /**
   * Get complete exam timetable for a class and calendar entry
   */
  @Get()
  @RoleAccess.Academic()
  async getExamTimetable(
    @Query('classId') classId: string,
    @Query('calendarEntryId') calendarEntryId: string,
    @Query('examScheduleId') examScheduleId?: string,
  ): Promise<ExamTimetableSlotDto[]> {
    // Validate the query parameters
    const validatedDto = getExamTimetableSchema.parse({
      classId,
      calendarEntryId,
      examScheduleId,
    });
    return this.examTimetableService.getExamTimetable(validatedDto);
  }

  /**
   * Assign subject to exam dateslot
   */
  @Post('assign-subject')
  @RoleAccess.Academic()
  async assignSubjectToDateslot(
    @Body(new ValidationPipe({ transform: true }))
    assignDto: AssignSubjectToExamDateslotDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExamTimetableSlotDto> {
    // Validate the DTO
    const validatedDto = assignSubjectToExamDateslotSchema.parse(assignDto);
    return this.examTimetableService.assignSubjectToDateslot(
      validatedDto,
      user.id,
    );
  }

  /**
   * Remove subject from dateslot
   */
  @Delete('remove-subject/:slotId')
  @RoleAccess.Academic()
  async removeSubjectFromDateslot(
    @Param('slotId') slotId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    // Validate the parameter
    const validatedDto = removeSubjectFromDateslotSchema.parse({ slotId });
    await this.examTimetableService.removeSubjectFromDateslot(
      validatedDto.slotId,
      user.id,
    );
    return { message: 'Subject removed from dateslot successfully' };
  }

  /**
   * Bulk exam timetable operations
   */
  @Post('bulk-operations')
  @RoleAccess.Academic()
  async bulkExamTimetableOperations(
    @Body(new ValidationPipe({ transform: true }))
    bulkOperationDto: BulkExamTimetableOperationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExamTimetableSlotDto[]> {
    // Validate the DTO
    const validatedDto =
      bulkExamTimetableOperationSchema.parse(bulkOperationDto);
    return this.examTimetableService.bulkExamTimetableOperations(
      validatedDto,
      user.id,
    );
  }

  /**
   * Validate exam timetable
   */
  @Post('validate')
  @RoleAccess.Academic()
  async validateExamTimetable(
    @Body(new ValidationPipe({ transform: true }))
    validateDto: ValidateExamTimetableDto,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    // Validate the DTO
    const validatedDto = validateExamTimetableSchema.parse(validateDto);
    return this.examTimetableService.validateExamTimetable(validatedDto);
  }

  /**
   * Copy exam timetable to other classes
   */
  @Post('copy')
  @RoleAccess.Academic()
  async copyExamTimetable(
    @Body(new ValidationPipe({ transform: true }))
    copyDto: CopyExamTimetableDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExamTimetableSlotDto[]> {
    // Validate the DTO
    const validatedDto = copyExamTimetableSchema.parse(copyDto);
    return this.examTimetableService.copyExamTimetable(validatedDto, user.id);
  }

  /**
   * Get exam timetable summary
   */
  @Get('summary/:examScheduleId')
  @RoleAccess.Academic()
  async getExamTimetableSummary(
    @Param('examScheduleId') examScheduleId: string,
  ): Promise<ExamTimetableSummaryDto> {
    return this.examTimetableService.getExamTimetableSummary(examScheduleId);
  }
}
