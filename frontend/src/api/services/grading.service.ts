import { httpClient } from '../client/http-client';
import { ApiResponse } from '../types/common';

const BASE_URL = '/api/v1/grading';

// Grading Scale Types
export interface GradeDefinition {
  id: string;
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoint?: number;
  description?: string;
  color?: string;
}

export interface GradingScale {
  id: string;
  academicYear: string;
  name: string;
  description?: string;
  isDefault: boolean;
  gradeDefinitions: GradeDefinition[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExamResult {
  id: string;
  examSlotId: string;
  studentId: string;
  marksObtained?: number;
  grade?: GradeDefinition;
  remarks?: string;
  isAbsent: boolean;
  isPassed: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'LOCKED';
  gradedAt?: Date;
  gradedBy?: {
    id: string;
    fullName: string;
  };
  lastModifiedAt?: Date;
  lastModifiedBy?: {
    id: string;
    fullName: string;
  };
  modificationHistory?: any;
  student: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
    };
  };
  examSlot: {
    id: string;
    subject?: {
      id: string;
      name: string;
      code: string;
      maxMarks: number;
      passMarks: number;
    };
    dateslot: {
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  };
}

export interface ClassGradingData {
  class: {
    id: string;
    grade: number;
    section: string;
  };
  examSchedule: {
    id: string;
    name: string;
    academicYear: string;
  };
  subjects: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    examSlot?: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  }[];
  students: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
    };
    results: ExamResult[];
  }[];
  gradingScale?: GradingScale;
}

export interface SubjectGradingData {
  subject: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
  };
  classes: {
    id: string;
    grade: number;
    section: string;
    examSlot?: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
    students: {
      id: string;
      rollNumber: string;
      user: {
        fullName: string;
      };
      result?: ExamResult;
    }[];
  }[];
  gradingScale?: GradingScale;
}

// Request DTOs
export interface CreateGradingScaleRequest {
  academicYear: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  gradeDefinitions: {
    grade: string;
    minMarks: number;
    maxMarks: number;
    gradePoint?: number;
    description?: string;
    color?: string;
  }[];
}

export interface CreateExamResultRequest {
  examSlotId: string;
  studentId: string;
  marksObtained?: number;
  gradeId?: string;
  remarks?: string;
  isAbsent?: boolean;
}

export interface UpdateExamResultRequest {
  marksObtained?: number;
  gradeId?: string;
  remarks?: string;
  isAbsent?: boolean;
  modificationReason: string;
}

export interface BulkGradeStudentsRequest {
  examSlotId: string;
  results: {
    studentId: string;
    marksObtained?: number;
    gradeId?: string;
    remarks?: string;
    isAbsent?: boolean;
  }[];
}

// Grid Grading Types
export interface GridGradeEntry {
  studentId: string;
  subjectId: string;
  marksObtained?: number;
  gradeId?: string;
  remarks?: string;
  isAbsent?: boolean;
  modificationReason?: string;
}

export interface BulkGridGradingRequest {
  classId: string;
  examScheduleId: string;
  calendarEntryId: string;
  grades: GridGradeEntry[];
}

export interface GridGradingStudentData {
  id: string;
  rollNumber: string;
  user: {
    fullName: string;
  };
  subjects: {
    [subjectId: string]: {
      examSlotId: string;
      marksObtained?: number;
      maxMarks: number;
      passMarks: number;
      grade?: GradeDefinition;
      remarks?: string;
      isAbsent: boolean;
      isPassed: boolean;
      status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'LOCKED';
      resultId?: string;
      gradedAt?: Date;
      gradedBy?: {
        id: string;
        fullName: string;
      };
    };
  };
}

export interface GridGradingData {
  class: {
    id: string;
    grade: number;
    section: string;
  };
  examSchedule: {
    id: string;
    name: string;
    academicYear: string;
  };
  calendarEntry: {
    id: string;
    name: string;
    examType: string;
    startDate: Date;
    endDate: Date;
  };
  subjects: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    examSlot: {
      id: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
    };
  }[];
  students: GridGradingStudentData[];
  gradingScale?: GradingScale;
  statistics: {
    totalStudents: number;
    totalSubjects: number;
    gradedEntries: number;
    pendingEntries: number;
    absentEntries: number;
  };
}

export interface StudentGradeHistory {
  id: string;
  studentId: string;
  examResultId: string;
  classId: string;
  subjectId: string;
  examSlotId: string;
  academicYear: string;
  examType: string;
  examName: string;
  examDate: Date;
  marksObtained?: number;
  maxMarks: number;
  passMarks: number;
  percentage?: number;
  gradeObtained?: string;
  gradePoint?: number;
  isPassed: boolean;
  isAbsent: boolean;
  remarks?: string;
  gradedAt?: Date;
  gradedBy?: {
    id: string;
    fullName: string;
  };
  class: {
    grade: number;
    section: string;
  };
  subject: {
    name: string;
    code: string;
  };
}

export interface PublishResultsRequest {
  calendarEntryId: string;
  publishRemarks?: string;
}

// API Service
export const gradingService = {
  // Grading Scale Management
  createGradingScale: async (
    data: CreateGradingScaleRequest,
  ): Promise<ApiResponse<GradingScale>> => {
    return await httpClient.post<GradingScale>(`${BASE_URL}/scales`, data, {
      requiresAuth: true,
    });
  },

  getGradingScales: async (
    academicYear?: string,
  ): Promise<ApiResponse<GradingScale[]>> => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    return await httpClient.get<GradingScale[]>(
      `${BASE_URL}/scales${params}`,
      undefined,
      { requiresAuth: true },
    );
  },

  getDefaultGradingScale: async (
    academicYear: string,
  ): Promise<ApiResponse<GradingScale | null>> => {
    return await httpClient.get<GradingScale | null>(
      `${BASE_URL}/scales/default/${academicYear}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Class-wise Grading
  getClassGradingData: async (
    classId: string,
    calendarEntryId: string,
    examScheduleId?: string,
  ): Promise<ApiResponse<ClassGradingData>> => {
    const params: Record<string, string> = {
      classId,
      calendarEntryId,
    };
    if (examScheduleId) {
      params.examScheduleId = examScheduleId;
    }

    return await httpClient.get<ClassGradingData>(
      `${BASE_URL}/class-data`,
      params,
      { requiresAuth: true },
    );
  },

  // Subject-wise Grading
  getSubjectGradingData: async (
    subjectId: string,
    calendarEntryId: string,
    classIds?: string[],
  ): Promise<ApiResponse<SubjectGradingData>> => {
    const params = new URLSearchParams({
      subjectId,
      calendarEntryId,
      ...(classIds && { classIds: classIds.join(',') }),
    });

    return await httpClient.get<SubjectGradingData>(
      `${BASE_URL}/subject-data?${params}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Individual Result Management
  createExamResult: async (
    data: CreateExamResultRequest,
  ): Promise<ApiResponse<ExamResult>> => {
    return await httpClient.post<ExamResult>(`${BASE_URL}/results`, data, {
      requiresAuth: true,
    });
  },

  updateExamResult: async (
    resultId: string,
    data: UpdateExamResultRequest,
  ): Promise<ApiResponse<ExamResult>> => {
    return await httpClient.put<ExamResult>(
      `${BASE_URL}/results/${resultId}`,
      data,
      { requiresAuth: true },
    );
  },

  bulkGradeStudents: async (
    data: BulkGradeStudentsRequest,
  ): Promise<ApiResponse<ExamResult[]>> => {
    return await httpClient.post<ExamResult[]>(
      `${BASE_URL}/results/bulk`,
      data,
      { requiresAuth: true },
    );
  },

  publishResults: async (
    data: PublishResultsRequest,
  ): Promise<ApiResponse<{ message: string; publishedCount: number }>> => {
    return await httpClient.post<{ message: string; publishedCount: number }>(
      `${BASE_URL}/results/publish`,
      data,
      { requiresAuth: true },
    );
  },

  // Get exam results
  getExamSlotResults: async (
    examSlotId: string,
  ): Promise<ApiResponse<ExamResult[]>> => {
    return await httpClient.get<ExamResult[]>(
      `${BASE_URL}/results/exam-slot/${examSlotId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  getStudentResults: async (
    studentId: string,
    academicYear?: string,
    examSlotId?: string,
  ): Promise<ApiResponse<ExamResult[]>> => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (examSlotId) params.append('examSlotId', examSlotId);

    const queryString = params.toString();
    const url = `${BASE_URL}/results/student/${studentId}${queryString ? `?${queryString}` : ''}`;

    return await httpClient.get<ExamResult[]>(url, undefined, {
      requiresAuth: true,
    });
  },

  // Permission Management
  createGradingPermission: async (data: {
    teacherId: string;
    subjectId: string;
    classId: string;
    canGrade?: boolean;
    canModify?: boolean;
  }): Promise<ApiResponse<any>> => {
    return await httpClient.post<any>(`${BASE_URL}/permissions`, data, {
      requiresAuth: true,
    });
  },

  getTeacherGradingPermissions: async (
    teacherId: string,
  ): Promise<ApiResponse<any[]>> => {
    return await httpClient.get<any[]>(
      `${BASE_URL}/permissions/teacher/${teacherId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  updateGradingScale: async (
    scaleId: string,
    data: Partial<CreateGradingScaleRequest>,
  ): Promise<ApiResponse<GradingScale>> => {
    return await httpClient.put<GradingScale>(
      `${BASE_URL}/scales/${scaleId}`,
      data,
      { requiresAuth: true },
    );
  },

  deleteGradingScale: async (
    scaleId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/scales/${scaleId}`,
      { requiresAuth: true },
    );
  },

  updateGradingPermission: async (
    permissionId: string,
    data: Partial<{
      teacherId: string;
      subjectId: string;
      classId: string;
      canGrade: boolean;
      canModify: boolean;
    }>,
  ): Promise<ApiResponse<Blob | null>> => {
    return await httpClient.put<any>(
      `${BASE_URL}/permissions/${permissionId}`,
      data,
      { requiresAuth: true },
    );
  },

  deleteGradingPermission: async (
    permissionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/permissions/${permissionId}`,
      { requiresAuth: true },
    );
  },

  lockResults: async (
    data: PublishResultsRequest,
  ): Promise<ApiResponse<{ message: string; lockedCount: number }>> => {
    return await httpClient.post<{ message: string; lockedCount: number }>(
      `${BASE_URL}/results/lock`,
      data,
      { requiresAuth: true },
    );
  },

  // Grid Grading Methods
  getGridGradingData: async (
    classId: string,
    examScheduleId: string,
    calendarEntryId: string,
  ): Promise<ApiResponse<GridGradingData>> => {
    const params = new URLSearchParams({
      classId,
      examScheduleId,
      calendarEntryId,
    });

    return await httpClient.get<GridGradingData>(
      `${BASE_URL}/grid-data?${params}`,
      undefined,
      { requiresAuth: true },
    );
  },

  bulkGridGrading: async (
    data: BulkGridGradingRequest,
  ): Promise<
    ApiResponse<{ success: boolean; processedCount: number; errors: string[] }>
  > => {
    return await httpClient.post<{
      success: boolean;
      processedCount: number;
      errors: string[];
    }>(`${BASE_URL}/grid-bulk`, data, { requiresAuth: true });
  },

  // Grade History Methods
  getStudentGradeHistory: async (
    studentId: string,
    academicYear?: string,
    classId?: string,
    subjectId?: string,
    examType?: string,
  ): Promise<ApiResponse<StudentGradeHistory[]>> => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (classId) params.append('classId', classId);
    if (subjectId) params.append('subjectId', subjectId);
    if (examType) params.append('examType', examType);

    const queryString = params.toString();
    const url = `${BASE_URL}/history/student/${studentId}${queryString ? `?${queryString}` : ''}`;

    return await httpClient.get<StudentGradeHistory[]>(url, undefined, {
      requiresAuth: true,
    });
  },

  // Report Generation
  generateStudentReport: async (
    studentId: string,
    calendarEntryId: string,
    academicYear: string,
  ): Promise<ApiResponse<Blob | null>> => {
    const params = { calendarEntryId, academicYear };

    return await httpClient.get<Blob>(
      `${BASE_URL}/reports/student/${studentId}`,
      params,
      {
        requiresAuth: true,
        responseType: 'blob',
      },
    );
  },

  generateClassReports: async (
    classId: string,
    calendarEntryId: string,
    academicYear: string,
  ): Promise<ApiResponse<Blob | null>> => {
    const params = { calendarEntryId, academicYear };

    return await httpClient.get<Blob>(
      `${BASE_URL}/reports/class/${classId}`,
      params,
      {
        requiresAuth: true,
        responseType: 'blob',
      },
    );
  },
};
