import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Promotion endpoints
export const PROMOTION_ENDPOINTS = {
  PREVIEW_PROMOTIONS: 'api/v1/promotions/preview',
  EXECUTE_PROMOTIONS: 'api/v1/promotions/execute',
  GET_PROMOTION_HISTORY: 'api/v1/promotions/history',
  GET_ELIGIBLE_STUDENTS: 'api/v1/promotions/eligible',
  BULK_UPDATE_STATUS: 'api/v1/promotions/bulk-status',
} as const;

// Types for promotion service
export interface PromotionPreviewRequest {
  academicYear: string;
  fromGrade?: number;
  toGrade?: number;
  classIds?: string[];
  excludeStudentIds?: string[];
}

export interface PromotionStudentInfo {
  id: string;
  fullName: string;
  rollNumber: string;
  studentId?: string;
  className: string;
  currentGrade: number;
  section: string;
  academicStatus: string;
  isEligible: boolean;
  ineligibilityReasons?: string[];
  feeStatus?: string;
  attendancePercentage?: number;
  gpa?: number;
}

export interface PromotionSummary {
  fromGrade: number;
  toGrade: number | 'Graduate';
  totalStudents: number;
  eligibleStudents: number;
  ineligibleStudents: number;
  promotingStudents: number;
  stayingStudents: number;
}

export interface PromotionPreviewResponse {
  academicYear: string;
  summaryByGrade: PromotionSummary[];
  students: PromotionStudentInfo[];
  totalStats: {
    totalStudents: number;
    totalPromoting: number;
    totalStaying: number;
    totalIneligible: number;
  };
}

export interface ExecutePromotionRequest {
  academicYear: string;
  newAcademicYear: string;
  promotions: Array<{
    studentId: string;
    fromClassId: string;
    toClassId?: string; // null for graduates
    action: 'promote' | 'stay' | 'graduate';
    notes?: string;
  }>;
  dryRun?: boolean;
}

export interface PromotionResult {
  studentId: string;
  fullName: string;
  action: 'promoted' | 'stayed' | 'graduated';
  fromClass: string;
  toClass?: string;
  success: boolean;
  error?: string;
}

export interface ExecutePromotionResponse {
  executionId: string;
  academicYear: string;
  newAcademicYear: string;
  timestamp: string;
  summary: {
    totalProcessed: number;
    promoted: number;
    stayed: number;
    graduated: number;
    failed: number;
  };
  results: PromotionResult[];
  errors: string[];
}

export interface PromotionHistoryEntry {
  id: string;
  executionId: string;
  academicYear: string;
  newAcademicYear: string;
  executedAt: string;
  executedBy: string;
  summary: {
    totalProcessed: number;
    promoted: number;
    stayed: number;
    graduated: number;
  };
  status: 'completed' | 'failed' | 'partial';
}

export interface EligibleStudentsResponse {
  students: PromotionStudentInfo[];
  summary: {
    totalEligible: number;
    byGrade: Record<number, number>;
  };
}

export class PromotionService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  /**
   * Preview promotions for the academic year
   */
  async previewPromotions(
    request: PromotionPreviewRequest,
  ): Promise<ApiResponse<PromotionPreviewResponse>> {
    return this.httpClient.post<PromotionPreviewResponse>(
      PROMOTION_ENDPOINTS.PREVIEW_PROMOTIONS,
      request,
      { requiresAuth: true },
    );
  }

  /**
   * Execute student promotions
   */
  async executePromotions(
    request: ExecutePromotionRequest,
  ): Promise<ApiResponse<ExecutePromotionResponse>> {
    return this.httpClient.post<ExecutePromotionResponse>(
      PROMOTION_ENDPOINTS.EXECUTE_PROMOTIONS,
      request,
      { requiresAuth: true },
    );
  }

  /**
   * Get promotion history
   */
  async getPromotionHistory(params?: {
    academicYear?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      data: PromotionHistoryEntry[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    return this.httpClient.get(
      PROMOTION_ENDPOINTS.GET_PROMOTION_HISTORY,
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Get eligible students for promotion
   */
  async getEligibleStudents(params?: {
    grade?: number;
    classId?: string;
    academicYear?: string;
  }): Promise<ApiResponse<EligibleStudentsResponse>> {
    return this.httpClient.get(
      PROMOTION_ENDPOINTS.GET_ELIGIBLE_STUDENTS,
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Bulk update student academic status
   */
  async bulkUpdateStatus(request: {
    studentIds: string[];
    status: 'active' | 'suspended' | 'graduated' | 'transferred';
    reason?: string;
  }): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return this.httpClient.post(
      PROMOTION_ENDPOINTS.BULK_UPDATE_STATUS,
      request,
      { requiresAuth: true },
    );
  }

  /**
   * Mock implementation for preview (to be replaced with real API)
   */
  async mockPreviewPromotions(
    academicYear: string = '2024-25',
  ): Promise<PromotionPreviewResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData: PromotionPreviewResponse = {
      academicYear,
      summaryByGrade: [
        {
          fromGrade: 9,
          toGrade: 10,
          totalStudents: 45,
          eligibleStudents: 42,
          ineligibleStudents: 3,
          promotingStudents: 40,
          stayingStudents: 5,
        },
        {
          fromGrade: 10,
          toGrade: 11,
          totalStudents: 38,
          eligibleStudents: 36,
          ineligibleStudents: 2,
          promotingStudents: 35,
          stayingStudents: 3,
        },
        {
          fromGrade: 11,
          toGrade: 12,
          totalStudents: 32,
          eligibleStudents: 30,
          ineligibleStudents: 2,
          promotingStudents: 28,
          stayingStudents: 4,
        },
        {
          fromGrade: 12,
          toGrade: 'Graduate',
          totalStudents: 28,
          eligibleStudents: 26,
          ineligibleStudents: 2,
          promotingStudents: 24,
          stayingStudents: 4,
        },
      ],
      students: [], // Would be populated with actual student data
      totalStats: {
        totalStudents: 143,
        totalPromoting: 127,
        totalStaying: 16,
        totalIneligible: 9,
      },
    };

    return mockData;
  }
}

// Export a singleton instance
export const promotionService = new PromotionService();
