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

@ApiTags('Timeslots')
@Controller('api/v1/timeslots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeslotController {
  constructor(private readonly timeslotService: TimeslotService) {}

  @Post()
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new timeslot' })
  async createTimeslot(
    @Body() createTimeslotDto: CreateTimeslotDto,
    @CurrentUser() user: any,
  ) {
    return this.timeslotService.createTimeslot(createTimeslotDto, user.id);
  }

  @Post('bulk')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple timeslots at once' })
  async bulkCreateTimeslots(
    @Body() bulkCreateDto: BulkCreateTimeslotsDto,
    @CurrentUser() user: any,
  ) {
    return this.timeslotService.bulkCreateTimeslots(bulkCreateDto, user.id);
  }

  @Get()
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get timeslots by class ID' })
  async getTimeslotsByClass(@Query() query: Record<string, unknown>) {
    // Handle both direct query params and nested params object
    let params: GetTimeslotsByClassDto;

    if (query.params) {
      // If params are nested (coming from axios serialization)
      try {
        params =
          typeof query.params === 'string'
            ? JSON.parse(query.params)
            : (query.params as GetTimeslotsByClassDto);
      } catch {
        params = query as GetTimeslotsByClassDto;
      }
    } else {
      // Direct query parameters
      params = query as GetTimeslotsByClassDto;
    }

    return this.timeslotService.getTimeslotsByClass(params.classId);
  }

  @Get(':id')
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a timeslot by ID' })
  async getTimeslotById(@Param('id') id: string) {
    return this.timeslotService.getTimeslotById(id);
  }

  @Put(':id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a timeslot' })
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
  @ApiOperation({ summary: 'Delete a timeslot' })
  async deleteTimeslot(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeslotService.deleteTimeslot(id, user.id);
  }
}
