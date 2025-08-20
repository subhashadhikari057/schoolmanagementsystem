import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { ScheduleService } from '../services/schedule.service';
import {
  ActivateScheduleDto,
  CheckTeacherConflictDto,
  CreateScheduleDto,
  CreateScheduleSlotDto,
  GetScheduleSlotsByScheduleDto,
  GetSchedulesByClassDto,
  UpdateScheduleDto,
  UpdateScheduleSlotDto,
} from '@sms/shared-types';

@ApiTags('Schedules')
@Controller('api/v1/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new schedule' })
  async createSchedule(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.createSchedule(createScheduleDto, user.id);
  }

  @Get()
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get schedules by class ID' })
  async getSchedulesByClass(@Query() query: GetSchedulesByClassDto) {
    return this.scheduleService.getSchedulesByClass(query.classId);
  }

  @Get(':id')
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a schedule by ID' })
  async getScheduleById(@Param('id') id: string) {
    return this.scheduleService.getScheduleById(id);
  }

  @Put(':id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a schedule' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.updateSchedule(id, updateScheduleDto, user.id);
  }

  @Delete(':id')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a schedule' })
  async deleteSchedule(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scheduleService.deleteSchedule(id, user.id);
  }

  @Post(':id/activate')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a schedule' })
  async activateSchedule(@Param('id') id: string, @CurrentUser() user: any) {
    const activateDto: ActivateScheduleDto = { id };
    return this.scheduleService.activateSchedule(activateDto, user.id);
  }

  // Schedule Slots
  @Post('slots')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new schedule slot' })
  async createScheduleSlot(
    @Body() createSlotDto: CreateScheduleSlotDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.createScheduleSlot(createSlotDto, user.id);
  }

  @Get('slots')
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get schedule slots by schedule ID' })
  async getScheduleSlotsBySchedule(
    @Query() query: GetScheduleSlotsByScheduleDto,
  ) {
    return this.scheduleService.getScheduleSlotsBySchedule(query.scheduleId);
  }

  @Put('slots/:id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a schedule slot' })
  async updateScheduleSlot(
    @Param('id') id: string,
    @Body() updateSlotDto: UpdateScheduleSlotDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.updateScheduleSlot(id, updateSlotDto, user.id);
  }

  @Delete('slots/:id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a schedule slot' })
  async deleteScheduleSlot(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scheduleService.deleteScheduleSlot(id, user.id);
  }

  @Post('check-teacher-conflict')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check for teacher conflicts' })
  async checkTeacherConflict(
    @Body() checkConflictDto: CheckTeacherConflictDto,
  ) {
    return this.scheduleService.checkTeacherConflict(checkConflictDto);
  }
}
