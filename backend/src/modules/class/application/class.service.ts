import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { CreateClassDtoType, UpdateClassDtoType } from '../dto/class.dto';

@Injectable()
export class ClassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new class (no section logic anymore)
   */
  async create(
    dto: CreateClassDtoType,
    createdById: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Check if class with same grade, section, and shift already exists (excluding soft deleted)
    const exists = await this.prisma.class.findFirst({
      where: {
        grade: dto.grade,
        section: dto.section,
        shift: dto.shift,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new ConflictException(
        `Class with Grade ${dto.grade} Section ${dto.section} in ${dto.shift.toLowerCase()} shift already exists`,
      );
    }

    // Check if the room is already assigned to another class in the same shift
    const roomConflict = await this.prisma.class.findFirst({
      where: {
        roomId: dto.roomId,
        shift: dto.shift,
        deletedAt: null,
      },
      include: {
        room: {
          select: { roomNo: true },
        },
      },
    });

    if (roomConflict) {
      throw new ConflictException(
        `Room ${roomConflict.room.roomNo} is already assigned to another class in ${dto.shift.toLowerCase()} shift`,
      );
    }

    // Check if teacher is already assigned as class teacher to another class
    const teacherConflict = await this.prisma.class.findFirst({
      where: {
        classTeacherId: dto.classTeacherId,
        deletedAt: null,
      },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (teacherConflict) {
      throw new ConflictException(
        `${teacherConflict.classTeacher?.user?.fullName || 'This teacher'} is already assigned as class teacher to Grade ${teacherConflict.grade} Section ${teacherConflict.section}`,
      );
    }

    const newClass = await this.prisma.class.create({
      data: {
        name: dto.name || `Grade ${dto.grade} Section ${dto.section}`,
        grade: dto.grade,
        section: dto.section,
        capacity: dto.capacity,
        shift: dto.shift,
        roomId: dto.roomId,
        classTeacherId: dto.classTeacherId,
        createdById: createdById,
      },
    });

    await this.audit.record({
      userId: createdById,
      action: 'CREATE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: {
        id: newClass.id,
        grade: dto.grade,
        section: dto.section,
        shift: dto.shift,
      },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class created successfully', class: newClass };
  }

  /**
   * Get all active classes
   */
  async findAll() {
    // Get all active classes
    const classes = await this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        room: {
          select: { roomNo: true, name: true, floor: true, building: true },
        },
        students: {
          where: { deletedAt: null },
          select: { id: true },
        },
        _count: {
          select: { students: { where: { deletedAt: null } } },
        },
      },
      orderBy: { grade: 'asc' },
    });

    // Sync enrollment counts for all classes
    await Promise.all(classes.map(cls => this.syncEnrollmentCount(cls.id)));

    // Fetch the updated classes
    return this.prisma.class.findMany({
      where: { deletedAt: null },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        room: {
          select: { roomNo: true, name: true, floor: true, building: true },
        },
        students: {
          where: { deletedAt: null },
          select: { id: true },
        },
        _count: {
          select: { students: { where: { deletedAt: null } } },
        },
      },
      orderBy: { grade: 'asc' },
    });
  }

  /**
   * Get comprehensive class details with students, parents, and guardians
   */
  async getClassDetailsWithStudents(id: string) {
    // First sync the enrollment count
    await this.syncEnrollmentCount(id);

    const classRecord = await this.prisma.class.findUnique({
      where: { id },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        room: {
          select: { roomNo: true, name: true, floor: true, building: true },
        },
        students: {
          where: { deletedAt: null },
          select: {
            id: true,
            rollNumber: true,
            address: true,
            street: true,
            city: true,
            state: true,
            pinCode: true,
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
            parents: {
              where: { deletedAt: null },
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        fullName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
            guardians: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                relation: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    return classRecord;
  }

  /**
   * Get a class by ID
   */
  async findById(id: string) {
    // First sync the enrollment count
    await this.syncEnrollmentCount(id);

    const classRecord = await this.prisma.class.findUnique({
      where: { id },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        room: {
          select: { roomNo: true, name: true, floor: true, building: true },
        },
        students: {
          where: { deletedAt: null },
          select: {
            id: true,
            rollNumber: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    return classRecord;
  }

  /**
   * Update a class by ID (only name now)
   */
  async update(
    id: string,
    dto: UpdateClassDtoType,
    updatedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const classRecord = await this.prisma.class.findUnique({ where: { id } });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found');
    }

    // Check for duplicate class if grade, section, or shift is being updated
    if (
      (dto.grade && dto.grade !== classRecord.grade) ||
      (dto.section && dto.section !== classRecord.section) ||
      (dto.shift && dto.shift !== classRecord.shift)
    ) {
      const exists = await this.prisma.class.findFirst({
        where: {
          grade: dto.grade || classRecord.grade,
          section: dto.section || classRecord.section,
          shift: dto.shift || classRecord.shift,
          deletedAt: null,
          id: { not: id }, // Exclude current class from check
        },
      });

      if (exists) {
        throw new ConflictException(
          `Class with Grade ${dto.grade || classRecord.grade} Section ${dto.section || classRecord.section} in ${(dto.shift || classRecord.shift).toLowerCase()} shift already exists`,
        );
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...dto,
        updatedById,
        updatedAt: new Date(),
      },
    });

    await this.audit.record({
      userId: updatedById,
      action: 'UPDATE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: { id, updates: dto },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class updated successfully', class: updated };
  }

  /**
   * Soft-delete a class by ID
   */
  async softDelete(
    id: string,
    deletedById: string,
    ip?: string,
    userAgent?: string,
  ) {
    const classRecord = await this.prisma.class.findUnique({ where: { id } });

    if (!classRecord || classRecord.deletedAt) {
      throw new NotFoundException('Class not found or already deleted');
    }

    await this.prisma.class.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });

    await this.audit.record({
      userId: deletedById,
      action: 'DELETE_CLASS',
      module: 'class',
      status: 'SUCCESS',
      details: { id },
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Class deleted successfully', id };
  }

  /**
   * Get available rooms for a specific shift
   */
  async getAvailableRoomsForShift(shift: 'MORNING' | 'DAY') {
    // Get all rooms
    const allRooms = await this.prisma.classroom.findMany({
      where: {
        deletedAt: null,
        isAvailable: true,
      },
      include: {
        classes: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            grade: true,
            section: true,
            shift: true,
          },
        },
      },
    });

    // Filter rooms that are available for the specified shift
    const availableRooms = allRooms.filter(room => {
      // If room has no classes, it's available
      if (!room.classes || room.classes.length === 0) {
        return true;
      }

      // Check if room is already assigned to a class in the same shift
      const hasConflictingShift = room.classes.some(cls => cls.shift === shift);

      return !hasConflictingShift;
    });

    return availableRooms.map(room => ({
      id: room.id,
      roomNo: room.roomNo,
      name: room.name,
      floor: room.floor,
      building: room.building,
      capacity: room.capacity,
      assignedClasses: room.classes.map(cls => ({
        id: cls.id,
        grade: cls.grade,
        section: cls.section,
        shift: cls.shift,
      })),
    }));
  }

  /**
   * Get available teachers (not already assigned as class teachers)
   */
  async getAvailableTeachers() {
    // Get teachers who are not already assigned as class teachers
    const availableTeachers = await this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        classesAsTeacher: {
          none: {
            deletedAt: null,
          },
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return availableTeachers.map(teacher => ({
      id: teacher.id,
      fullName: teacher.user?.fullName || '',
      email: teacher.user?.email || '',
      employeeId: teacher.employeeId,
    }));
  }

  /**
   * Sync enrollment count with actual number of active students
   */
  async syncEnrollmentCount(id: string) {
    // Get the actual count of active students
    const studentCount = await this.prisma.student.count({
      where: {
        classId: id,
        deletedAt: null,
      },
    });

    // Update the class with the correct count
    await this.prisma.class.update({
      where: { id },
      data: {
        currentEnrollment: studentCount,
      },
    });

    return studentCount;
  }
}
