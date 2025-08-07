import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { RoomService } from '../application/room.service';
import {
  CreateRoomDto,
  CreateRoomDtoType,
  UpdateRoomDto,
  UpdateRoomDtoType,
  RoomQueryDto,
  RoomQueryDtoType,
} from '../dto/room.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';

@Controller('api/v1/rooms')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Create a new room
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateRoomDto)) body: CreateRoomDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.roomService.create(
      body,
      user.id,
      req.ip || undefined,
      req.headers['user-agent'] || undefined,
    );
  }

  /**
   * Get all rooms with optional filtering and pagination
   */
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(RoomQueryDto)) query: RoomQueryDtoType,
  ) {
    return this.roomService.findAll(query);
  }

  /**
   * Get available rooms (not assigned to any class)
   */
  @Get('available')
  async getAvailableRooms() {
    return this.roomService.getAvailableRooms();
  }

  /**
   * Get rooms by floor
   */
  @Get('floor/:floor')
  async getRoomsByFloor(@Param('floor') floor: string) {
    const floorNumber = parseInt(floor, 10);
    if (isNaN(floorNumber)) {
      throw new Error('Invalid floor number');
    }
    return this.roomService.getRoomsByFloor(floorNumber);
  }

  /**
   * Get room by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  /**
   * Update room
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoomDto)) body: UpdateRoomDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.roomService.update(
      id,
      body,
      user.id,
      req.ip || undefined,
      req.headers['user-agent'] || undefined,
    );
  }

  /**
   * Soft delete room
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.roomService.softDelete(
      id,
      user.id,
      req.ip || undefined,
      req.headers['user-agent'] || undefined,
    );
  }
}
