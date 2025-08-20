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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { TimeslotService } from '../services/timeslot.service';
import {
  BulkCreateTimeslotsDto,
  CreateTimeslotDto,
  GetTimeslotsByClassDto,
  UpdateTimeslotDto,
} from '@sms/shared-types';

@ApiTags('Class Timeslots')
@Controller('api/v1/class-timeslots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassTimeslotController {
  constructor(private readonly timeslotService: TimeslotService) {}

  @Post()
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new class timeslot' })
  async createTimeslot(
    @Body() createTimeslotDto: CreateTimeslotDto,
    @CurrentUser() user: any,
  ) {
    return this.timeslotService.createTimeslot(createTimeslotDto, user.id);
  }

  @Post('bulk')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple class timeslots at once' })
  async bulkCreateTimeslots(
    @Body() bulkCreateDto: BulkCreateTimeslotsDto,
    @CurrentUser() user: any,
  ) {
    return this.timeslotService.bulkCreateTimeslots(bulkCreateDto, user.id);
  }

  @Get()
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get class timeslots by class ID' })
  async getTimeslotsByClass(@Query() query: GetTimeslotsByClassDto) {
    return this.timeslotService.getTimeslotsByClass(query.classId);
  }

  @Get(':id')
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a class timeslot by ID' })
  async getTimeslotById(@Param('id') id: string) {
    return this.timeslotService.getTimeslotById(id);
  }

  @Put(':id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a class timeslot' })
  async updateTimeslot(
    @Param('id') id: string,
    @Body() updateTimeslotDto: UpdateTimeslotDto,
    @CurrentUser() user: any,
  ) {
    return this.timeslotService.updateTimeslot(id, updateTimeslotDto, user.id);
  }

  @Delete(':id')
  @RoleAccess.AdminLevel()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a class timeslot' })
  async deleteTimeslot(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeslotService.deleteTimeslot(id, user.id);
  }
}
