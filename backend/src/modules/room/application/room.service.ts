import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import {
  CreateRoomDtoType,
  UpdateRoomDtoType,
  RoomQueryDtoType,
} from '../dto/room.dto';

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new room
   */
  async create(
    data: CreateRoomDtoType,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      // Check if room number already exists
      const existingRoom = await this.prisma.classroom.findUnique({
        where: { roomNo: data.roomNo },
      });

      if (existingRoom) {
        throw new ConflictException(
          `Room with number ${data.roomNo} already exists`,
        );
      }

      // Create room
      const room = await this.prisma.classroom.create({
        data: {
          ...data,
          createdById: userId,
        },
      });

      // Log audit
      await this.auditService.record({
        userId,
        action: 'CREATE_ROOM',
        module: 'room',
        status: 'SUCCESS',
        details: { roomNo: room.roomNo, roomId: room.id },
        ipAddress: ip,
        userAgent,
      });

      return room;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  /**
   * Get all rooms with optional filtering and pagination
   */
  async findAll(query?: RoomQueryDtoType) {
    const {
      page = 1,
      limit = 10,
      floor,
      building,
      isAvailable,
      search,
    } = query || {};

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null, // Only get non-deleted rooms
    };

    if (floor !== undefined) {
      where.floor = floor;
    }

    if (building) {
      where.building = building;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (search) {
      where.OR = [
        { roomNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rooms, totalCount] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }],
        include: {
          classes: {
            select: {
              id: true,
              grade: true,
              section: true,
            },
          },
        },
      }),
      this.prisma.classroom.count({ where }),
    ]);

    return {
      rooms,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get room by ID
   */
  async findById(id: string) {
    const room = await this.prisma.classroom.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        classes: {
          select: {
            id: true,
            grade: true,
            section: true,
            capacity: true,
            students: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  /**
   * Update room
   */
  async update(
    id: string,
    data: UpdateRoomDtoType,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Check if room exists
    const existingRoom = await this.findById(id);

    // Check if room number is being changed and if it conflicts
    if (data.roomNo && data.roomNo !== existingRoom.roomNo) {
      const conflictRoom = await this.prisma.classroom.findUnique({
        where: { roomNo: data.roomNo },
      });

      if (conflictRoom && conflictRoom.id !== id) {
        throw new ConflictException(
          `Room with number ${data.roomNo} already exists`,
        );
      }
    }

    try {
      const updatedRoom = await this.prisma.classroom.update({
        where: { id },
        data: {
          ...data,
          updatedById: userId,
          updatedAt: new Date(),
        },
      });

      // Log audit
      await this.auditService.record({
        userId,
        action: 'UPDATE_ROOM',
        module: 'room',
        status: 'SUCCESS',
        details: {
          roomNo: updatedRoom.roomNo,
          roomId: id,
          updatedFields: Object.keys(data),
        },
        ipAddress: ip,
        userAgent,
      });

      return updatedRoom;
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  /**
   * Soft delete room
   */
  async softDelete(
    id: string,
    userId: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Check if room exists
    const room = await this.findById(id);

    // Check if room has active classes
    const activeClasses = await this.prisma.class.count({
      where: {
        roomId: id,
        deletedAt: null,
      },
    });

    if (activeClasses > 0) {
      throw new ConflictException(
        'Cannot delete room that has active classes assigned to it',
      );
    }

    try {
      const deletedRoom = await this.prisma.classroom.update({
        where: { id },
        data: {
          deletedById: userId,
          deletedAt: new Date(),
        },
      });

      // Log audit
      await this.auditService.record({
        userId,
        action: 'DELETE_ROOM',
        module: 'room',
        status: 'SUCCESS',
        details: { roomNo: room.roomNo, roomId: id },
        ipAddress: ip,
        userAgent,
      });

      return {
        message: 'Room deleted successfully',
        room: deletedRoom,
      };
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  /**
   * Get available rooms (not assigned to any class)
   */
  async getAvailableRooms() {
    return this.prisma.classroom.findMany({
      where: {
        deletedAt: null,
        isAvailable: true,
        classes: {
          none: {
            deletedAt: null,
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }],
    });
  }

  /**
   * Get rooms by floor
   */
  async getRoomsByFloor(floor: number) {
    return this.prisma.classroom.findMany({
      where: {
        floor,
        deletedAt: null,
      },
      orderBy: { roomNo: 'asc' },
      include: {
        classes: {
          select: {
            id: true,
            grade: true,
            section: true,
          },
        },
      },
    });
  }
}
