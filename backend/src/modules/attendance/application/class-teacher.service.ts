import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/**
 * Service to handle class teacher operations for the attendance module
 */
@Injectable()
export class ClassTeacherService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a teacher is the class teacher for a given class
   */
  async isClassTeacher(teacherId: string, classId: string): Promise<boolean> {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { classTeacherId: true },
    });

    return classRecord?.classTeacherId === teacherId;
  }

  /**
   * Check if a student is in a class taught by the given teacher
   */
  async isStudentInTeacherClass(
    teacherId: string,
    studentId: string,
  ): Promise<boolean> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      return false;
    }

    return this.isClassTeacher(teacherId, student.classId);
  }

  /**
   * Get the class where the teacher is the class teacher
   */
  async getClassTeacherClass(teacherId: string) {
    const classRecord = await this.prisma.class.findFirst({
      where: {
        classTeacherId: teacherId,
        deletedAt: null,
      },
    });

    return classRecord;
  }
}
