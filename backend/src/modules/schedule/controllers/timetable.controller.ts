import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/guards/jwt-auth.guard';
import { TimetableService } from '../services/timetable.service';
import {
  BulkTimetableOperationDto,
  GetTimetableDto,
  ValidateTimetableDto,
  AssignSubjectToTimeslotDto,
  AssignTeacherToSlotDto,
} from '@sms/shared-types';

@ApiTags('Timetable')
@Controller('api/v1/timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get complete timetable for a class' })
  async getTimetable(@Query() query: Record<string, unknown>) {
    // Handle both direct query params and nested params object
    let params: GetTimetableDto;

    if (query.params) {
      // If params are nested (coming from axios serialization)
      try {
        params =
          typeof query.params === 'string'
            ? JSON.parse(query.params)
            : (query.params as GetTimetableDto);
      } catch {
        params = query as GetTimetableDto;
      }
    } else {
      // Direct query parameters
      params = query as GetTimetableDto;
    }

    return this.timetableService.getTimetable(params);
  }

  @Post('assign-subject')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign subject to a timeslot' })
  async assignSubjectToTimeslot(
    @Body() assignDto: AssignSubjectToTimeslotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.assignSubjectToTimeslot(assignDto, user.id);
  }

  @Post('assign-teacher')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign teacher to a schedule slot' })
  async assignTeacherToSlot(
    @Body() assignDto: AssignTeacherToSlotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.assignTeacherToSlot(assignDto, user.id);
  }

  @Delete('slot/:id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove assignment from slot' })
  async removeSlotAssignment(
    @Param('id') slotId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.timetableService.removeSlotAssignment(slotId, user.id);
    return { message: 'Slot assignment removed successfully' };
  }

  @Post('bulk-operations')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform bulk timetable operations' })
  async bulkTimetableOperations(
    @Body() bulkDto: BulkTimetableOperationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.bulkTimetableOperations(bulkDto, user.id);
  }

  @Post('validate')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate timetable for conflicts and completeness',
  })
  async validateTimetable(@Body() validateDto: ValidateTimetableDto) {
    return this.timetableService.validateTimetable(validateDto);
  }

  @Get('export')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export timetables as CSV, XLSX, or PDF' })
  async exportTimetables(@Query() query: Record<string, string>) {
    const format = (query.format || 'csv') as 'csv' | 'xlsx' | 'pdf';
    const scope = (query.scope || 'class') as 'all' | 'class';
    const classId = query.classId;
    const result = await this.timetableService.exportTimetables(
      format,
      scope,
      classId,
    );
    return {
      filename: result.filename,
      mime: result.mime,
      // Return base64 to simplify transport; frontend will decode
      data: result.buffer.toString('base64'),
    };
  }
}
