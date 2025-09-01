import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface QRVerificationResult {
  valid: boolean;
  data?: {
    userId: string;
    userType: 'student' | 'teacher' | 'staff';
    name: string;
    id: string; // studentId, employeeId, etc.
    profilePicture?: string;
    additionalInfo: Record<string, any>;
    idCardInfo: {
      templateName: string;
      issuedDate: string;
      expiryDate: string;
      isActive: boolean;
    };
  };
  error?: string;
}

@Injectable()
export class QRVerificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify QR code and return user information
   */
  async verifyQRCode(qrData: string): Promise<QRVerificationResult> {
    try {
      // Extract user info from QR data URL
      const url = new URL(qrData);
      const pathParts = url.pathname.split('/');

      if (pathParts[1] !== 'verify') {
        return { valid: false, error: 'Invalid QR code format' };
      }

      const userType = pathParts[2];
      const identifier = pathParts[3];

      // Verify based on user type
      switch (userType) {
        case 'student':
          return await this.verifyStudent(
            identifier,
            pathParts[2] === 'roll'
              ? 'rollNumber'
              : pathParts[2] === 'admission'
                ? 'admissionNumber'
                : 'studentId',
          );

        case 'teacher':
          return await this.verifyTeacher(identifier);

        case 'employee':
          return await this.verifyEmployee(identifier);

        case 'staff':
          return await this.verifyStaff(identifier);

        default:
          return { valid: false, error: 'Unknown user type in QR code' };
      }
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  private async verifyStudent(
    identifier: string,
    fieldType: string = 'studentId',
  ): Promise<QRVerificationResult> {
    const whereClause =
      fieldType === 'rollNumber'
        ? { rollNumber: identifier }
        : fieldType === 'admissionNumber'
          ? { admissionNumber: identifier }
          : { studentId: identifier };

    const student = await this.prisma.student.findFirst({
      where: {
        ...whereClause,
        deletedAt: null,
      },
      include: {
        user: true,
        class: true,
        profile: true,
      },
    });

    if (!student) {
      return { valid: false, error: 'Student not found' };
    }

    // Get latest ID card
    const idCard = await this.prisma.iDCard.findFirst({
      where: {
        issuedForId: student.userId,
        type: 'STUDENT',
      },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      valid: true,
      data: {
        userId: student.userId,
        userType: 'student',
        name: student.user.fullName,
        id: student.studentId || '',
        profilePicture:
          (student.profile?.profilePhotoUrl || student.profilePhotoUrl) ??
          undefined,
        additionalInfo: {
          class: student.class?.name,
          section: student.class?.section,
          rollNumber: student.rollNumber,
          academicStatus: student.academicStatus,
        },
        idCardInfo: {
          templateName: idCard?.template?.name || 'Unknown',
          issuedDate: idCard?.createdAt?.toISOString() || '',
          expiryDate: idCard?.expiryDate?.toISOString() || '',
          isActive: !idCard?.expiryDate || idCard.expiryDate > new Date(),
        },
      },
    };
  }

  private async verifyTeacher(
    identifier: string,
  ): Promise<QRVerificationResult> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        OR: [{ employeeId: identifier }, { userId: identifier }],
        deletedAt: null,
      },
      include: {
        user: true,
        profile: true,
      },
    });

    if (!teacher) {
      return { valid: false, error: 'Teacher not found' };
    }

    const idCard = await this.prisma.iDCard.findFirst({
      where: {
        issuedForId: teacher.userId,
        type: 'TEACHER',
      },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      valid: true,
      data: {
        userId: teacher.userId,
        userType: 'teacher',
        name: teacher.user.fullName,
        id: teacher.employeeId || '',
        profilePicture: teacher.profile?.profilePhotoUrl ?? undefined,
        additionalInfo: {
          designation: teacher.designation,
          department: teacher.department,
          qualification: teacher.qualification,
          experience: teacher.experienceYears,
        },
        idCardInfo: {
          templateName: idCard?.template?.name || 'Unknown',
          issuedDate: idCard?.createdAt?.toISOString() || '',
          expiryDate: idCard?.expiryDate?.toISOString() || '',
          isActive: !idCard?.expiryDate || idCard.expiryDate > new Date(),
        },
      },
    };
  }

  private async verifyEmployee(
    identifier: string,
  ): Promise<QRVerificationResult> {
    // Try teacher first
    const teacherResult = await this.verifyTeacher(identifier);
    if (teacherResult.valid) {
      return teacherResult;
    }

    // Try staff
    return await this.verifyStaff(identifier);
  }

  private async verifyStaff(identifier: string): Promise<QRVerificationResult> {
    const staff = await this.prisma.staff.findFirst({
      where: {
        OR: [{ employeeId: identifier }, { userId: identifier }],
        deletedAt: null,
      },
      include: {
        user: true,
        profile: true,
      },
    });

    if (!staff) {
      return { valid: false, error: 'Staff not found' };
    }

    const idCard = await this.prisma.iDCard.findFirst({
      where: {
        issuedForId: staff.userId ?? '',
        OR: [{ type: 'STAFF' }, { type: 'STAFF_NO_LOGIN' }],
      },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      valid: true,
      data: {
        userId: staff.userId ?? '',
        userType: 'staff',
        name: staff.user?.fullName ?? '',
        id: staff.employeeId ?? '',
        profilePicture: staff.profile?.profilePhotoUrl ?? undefined,
        additionalInfo: {
          designation: staff.designation,
          department: staff.department,
          employmentDate: staff.employmentDate?.toISOString(),
        },
        idCardInfo: {
          templateName: idCard?.template?.name || 'Unknown',
          issuedDate: idCard?.createdAt?.toISOString() || '',
          expiryDate: idCard?.expiryDate?.toISOString() || '',
          isActive: !idCard?.expiryDate || idCard.expiryDate > new Date(),
        },
      },
    };
  }
}
