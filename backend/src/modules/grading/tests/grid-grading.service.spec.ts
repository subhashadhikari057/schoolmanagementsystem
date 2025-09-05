import { Test, TestingModule } from '@nestjs/testing';
import { GradingService } from '../services/grading.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuditService } from '../../../shared/logger/audit.service';
import { UserRole } from '@sms/shared-types';
import { ExamResultStatus } from '../dto/grading.dto';

describe('GradingService - Grid Grading', () => {
  let service: GradingService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    examSchedule: {
      findUnique: jest.fn(),
    },
    examSlot: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    examResult: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    gradingScale: {
      findFirst: jest.fn(),
    },
    // @ts-ignore - Mock for new model
    studentGradeHistory: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<GradingService>(GradingService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGridGradingData', () => {
    it('should return grid grading data successfully', async () => {
      const mockExamSchedule = {
        id: 'schedule-1',
        classId: 'class-1',
        calendarEntryId: 'calendar-1',
        academicYear: '2024-2025',
        name: 'Midterm Exam',
        class: {
          id: 'class-1',
          grade: 10,
          section: 'A',
        },
        calendarEntry: {
          id: 'calendar-1',
          name: 'Midterm Exam',
          examType: 'MIDTERM',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-10'),
        },
      };

      const mockExamSlots = [
        {
          id: 'slot-1',
          subjectId: 'subject-1',
          subject: {
            id: 'subject-1',
            name: 'Mathematics',
            code: 'MATH',
            maxMarks: 100,
            passMarks: 40,
          },
          dateslot: {
            examDate: new Date('2024-03-01'),
            startTime: '09:00',
            endTime: '12:00',
          },
        },
      ];

      const mockStudents = [
        {
          id: 'student-1',
          rollNumber: '001',
          user: {
            fullName: 'John Doe',
          },
          examResults: [],
        },
      ];

      mockPrismaService.examSchedule.findUnique.mockResolvedValue(
        mockExamSchedule,
      );
      mockPrismaService.examSlot.findMany.mockResolvedValue(mockExamSlots);
      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);
      mockPrismaService.gradingScale.findFirst.mockResolvedValue(null);

      const result = await service.getGridGradingData(
        {
          classId: 'class-1',
          examScheduleId: 'schedule-1',
          calendarEntryId: 'calendar-1',
        },
        'user-1',
        UserRole.TEACHER,
      );

      expect(result).toBeDefined();
      expect(result.class.id).toBe('class-1');
      expect(result.subjects).toHaveLength(1);
      expect(result.students).toHaveLength(1);
      expect(result.statistics.totalStudents).toBe(1);
      expect(result.statistics.totalSubjects).toBe(1);
    });

    it('should throw NotFoundException when exam schedule not found', async () => {
      mockPrismaService.examSchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.getGridGradingData(
          {
            classId: 'class-1',
            examScheduleId: 'schedule-1',
            calendarEntryId: 'calendar-1',
          },
          'user-1',
          UserRole.TEACHER,
        ),
      ).rejects.toThrow('Exam schedule not found');
    });
  });

  describe('bulkGridGrading', () => {
    it('should process bulk grid grading successfully', async () => {
      const mockExamSchedule = {
        id: 'schedule-1',
        classId: 'class-1',
        calendarEntryId: 'calendar-1',
        academicYear: '2024-2025',
        class: { id: 'class-1', grade: 10, section: 'A' },
        calendarEntry: {
          id: 'calendar-1',
          name: 'Midterm',
          examType: 'MIDTERM',
        },
      };

      const mockExamSlot = {
        id: 'slot-1',
        subject: {
          id: 'subject-1',
          name: 'Mathematics',
          maxMarks: 100,
          passMarks: 40,
        },
        dateslot: { examDate: new Date('2024-03-01') },
      };

      mockPrismaService.examSchedule.findUnique.mockResolvedValue(
        mockExamSchedule,
      );
      mockPrismaService.examSlot.findFirst.mockResolvedValue(mockExamSlot);
      mockPrismaService.examResult.findUnique.mockResolvedValue(null);
      mockPrismaService.examResult.create.mockResolvedValue({
        id: 'result-1',
        studentId: 'student-1',
        examSlotId: 'slot-1',
        marksObtained: 85,
        isPassed: true,
        isAbsent: false,
      });
      mockPrismaService.gradingScale.findFirst.mockResolvedValue(null);

      // Mock the checkGradingPermission method
      jest
        .spyOn(service as any, 'checkGradingPermission')
        .mockResolvedValue(true);

      const result = await service.bulkGridGrading(
        {
          classId: 'class-1',
          examScheduleId: 'schedule-1',
          calendarEntryId: 'calendar-1',
          grades: [
            {
              studentId: 'student-1',
              subjectId: 'subject-1',
              marksObtained: 85,
              isAbsent: false,
            },
          ],
        },
        'user-1',
        UserRole.TEACHER,
      );

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockAuditService.record).toHaveBeenCalled();
    });
  });
});
