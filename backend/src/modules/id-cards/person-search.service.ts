import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  PersonSearchDto,
  PersonSearchResult,
  PersonSearchResponse,
  PersonType,
} from './dto/person-search.dto';

@Injectable()
export class PersonSearchService {
  constructor(private prisma: PrismaService) {}

  async searchPersons(dto: PersonSearchDto): Promise<PersonSearchResponse> {
    const { type, search } = dto;
    // Ensure page and limit are numbers
    const page =
      typeof dto.page === 'string' ? parseInt(dto.page) : dto.page || 1;
    const limit =
      typeof dto.limit === 'string' ? parseInt(dto.limit) : dto.limit || 20;
    const skip = (page - 1) * limit;

    switch (type) {
      case PersonType.STUDENT:
        return this.searchStudents(search, skip, limit, page);
      case PersonType.TEACHER:
        return this.searchTeachers(search, skip, limit, page);
      case PersonType.STAFF:
        return this.searchStaff(search, skip, limit, page);
      default:
        throw new Error('Invalid person type');
    }
  }

  private async searchStudents(
    search?: string,
    skip: number = 0,
    limit: number = 20,
    page: number = 1,
  ): Promise<PersonSearchResponse> {
    const whereClause: any = {
      deletedAt: null,
      // Include all academic statuses except 'expelled' or 'withdrawn'
      academicStatus: {
        not: {
          in: ['expelled', 'withdrawn'],
        },
      },
    };

    if (search) {
      whereClause.OR = [
        {
          user: {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          rollNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          studentId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          class: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: whereClause,
        include: {
          user: true,
          class: true,
        },
        skip,
        take: limit,
        orderBy: {
          user: {
            fullName: 'asc',
          },
        },
      }),
      this.prisma.student.count({ where: whereClause }),
    ]);

    const persons: PersonSearchResult[] = students.map(student => ({
      id: student.id,
      name: student.user?.fullName || 'Unknown Student',
      type: PersonType.STUDENT,
      info: student.class
        ? `Grade ${student.class.grade} - ${student.class.section}`
        : 'No Class Assigned',
      rollNumber: student.rollNumber,
      email: student.email,
      avatar: student.profilePhotoUrl || undefined,
    }));

    return {
      persons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async searchTeachers(
    search?: string,
    skip: number = 0,
    limit: number = 20,
    page: number = 1,
  ): Promise<PersonSearchResponse> {
    const whereClause: any = {
      deletedAt: null,
      // Include all employment statuses except 'terminated'
      employmentStatus: {
        not: 'terminated',
      },
    };

    if (search) {
      whereClause.OR = [
        {
          user: {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          employeeId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          department: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          designation: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        skip,
        take: limit,
        orderBy: {
          user: {
            fullName: 'asc',
          },
        },
      }),
      this.prisma.teacher.count({ where: whereClause }),
    ]);

    const persons: PersonSearchResult[] = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.user?.fullName || 'Unknown Teacher',
      type: PersonType.TEACHER,
      info: teacher.department || teacher.designation || 'No Department',
      employeeId: teacher.employeeId || undefined,
      email: teacher.user?.email,
      avatar: teacher.imageUrl || undefined,
    }));

    return {
      persons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async searchStaff(
    search?: string,
    skip: number = 0,
    limit: number = 20,
    page: number = 1,
  ): Promise<PersonSearchResponse> {
    const whereClause: any = {
      deletedAt: null,
      // Include all employment statuses except 'terminated'
      employmentStatus: {
        not: 'terminated',
      },
    };

    if (search) {
      whereClause.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          employeeId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          department: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          designation: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        skip,
        take: limit,
        orderBy: {
          fullName: 'asc',
        },
      }),
      this.prisma.staff.count({ where: whereClause }),
    ]);

    const persons: PersonSearchResult[] = staff.map(staffMember => ({
      id: staffMember.id,
      name: staffMember.fullName,
      type: PersonType.STAFF,
      info:
        staffMember.department || staffMember.designation || 'No Department',
      employeeId: staffMember.employeeId || undefined,
      email: staffMember.email,
      avatar: undefined, // Staff might not have profile photos in the main record
    }));

    return {
      persons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific person by ID and type for ID card generation
   */
  async getPersonById(
    personId: string,
    type: PersonType,
  ): Promise<PersonSearchResult | null> {
    switch (type) {
      case PersonType.STUDENT:
        return this.getStudentById(personId);
      case PersonType.TEACHER:
        return this.getTeacherById(personId);
      case PersonType.STAFF:
        return this.getStaffById(personId);
      default:
        return null;
    }
  }

  private async getStudentById(
    studentId: string,
  ): Promise<PersonSearchResult | null> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        academicStatus: 'active',
      },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) return null;

    return {
      id: student.id,
      name: student.user?.fullName || 'Unknown Student',
      type: PersonType.STUDENT,
      info: student.class
        ? `Grade ${student.class.grade} - ${student.class.section}`
        : 'No Class Assigned',
      rollNumber: student.rollNumber,
      email: student.email,
      avatar: student.profilePhotoUrl || undefined,
    };
  }

  private async getTeacherById(
    teacherId: string,
  ): Promise<PersonSearchResult | null> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id: teacherId,
        deletedAt: null,
        employmentStatus: 'active',
      },
      include: {
        user: true,
      },
    });

    if (!teacher) return null;

    return {
      id: teacher.id,
      name: teacher.user?.fullName || 'Unknown Teacher',
      type: PersonType.TEACHER,
      info: teacher.department || teacher.designation || 'No Department',
      employeeId: teacher.employeeId || undefined,
      email: teacher.user?.email,
      avatar: teacher.imageUrl || undefined,
    };
  }

  private async getStaffById(
    staffId: string,
  ): Promise<PersonSearchResult | null> {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        deletedAt: null,
        employmentStatus: 'active',
      },
      include: {
        user: true,
      },
    });

    if (!staff) return null;

    return {
      id: staff.id,
      name: staff.fullName,
      type: PersonType.STAFF,
      info: staff.department || staff.designation || 'No Department',
      employeeId: staff.employeeId || undefined,
      email: staff.email,
      avatar: undefined,
    };
  }
}
