import { HttpClient } from '../client/http-client';
import { ApiResponse } from '../types';

// Promotion endpoints
export const PROMOTION_ENDPOINTS = {
  PREVIEW_PROMOTIONS: 'api/promotions/preview',
  EXECUTE_PROMOTIONS: 'api/promotions/execute',
  INDIVIDUAL_PROMOTION: 'api/promotions/individual',
  GET_PROMOTION_PROGRESS: 'api/promotions/progress',
  REVERT_PROMOTION: 'api/promotions/revert',
  GET_PROMOTION_BATCHES: 'api/promotions/batches',
  GET_PROMOTION_BATCH: 'api/promotions/batch',
  GET_ACADEMIC_YEARS: 'api/promotions/academic-years',
  GET_CURRENT_ACADEMIC_YEAR: 'api/promotions/academic-years/current',
  CREATE_ACADEMIC_YEAR: 'api/promotions/academic-years',
  CLEANUP_STUCK_BATCHES: 'api/promotions/debug/cleanup-stuck-batches',
} as const;

// Types for promotion service
export interface PromotionPreviewRequest {
  academicYear: string;
  excludedStudentIds?: string[];
}

export interface PromotionStudentInfo {
  id: string;
  fullName: string;
  rollNumber: string;
  studentId: string | null;
  className: string;
  currentGrade: number;
  section: string;
  academicStatus: string;
  isEligible: boolean;
  ineligibilityReasons: string[];
  feeStatus: string | null;
  attendancePercentage: number | null;
  gpa: number | null;
  promotionType: 'PROMOTED' | 'RETAINED' | 'GRADUATED';
  targetGrade: number | null;
  targetSection: string | null;
}

export interface PromotionSummary {
  fromGrade: number;
  toGrade: number | 'Graduate';
  className: string;
  section: string;
  totalStudents: number;
  eligibleStudents: number;
  ineligibleStudents: number;
  promotingStudents: number;
  stayingStudents: number;
  graduatingStudents: number;
  targetClassName: string;
}

export interface PromotionPreviewResponse {
  fromAcademicYear: string;
  toAcademicYear: string;
  summaryByGrade: PromotionSummary[];
  promotionStudents: PromotionStudentInfo[];
  totalStats: {
    totalStudents: number;
    totalPromoting: number;
    totalStaying: number;
    totalGraduating: number;
    totalIneligible: number;
  };
  metadata?: {
    hasClasses: boolean;
    hasStudents: boolean;
    message?: string;
  };
}

export interface ExecutePromotionRequest {
  academicYear: string;
  toAcademicYear: string;
  excludedStudentIds?: string[];
  reason?: string;
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
  success: boolean;
  batchId: string;
  message: string;
  totalProcessed: number;
  promoted: number;
  retained: number;
  graduated: number;
  failed: number;
  errors?: string[];
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

export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAcademicYearRequest {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface IndividualPromotionRequest {
  studentId: string;
  academicYear: string;
  toAcademicYear: string;
  reason?: string;
}

export interface IndividualPromotionResponse {
  success: boolean;
  message: string;
  studentId: string;
  studentName: string;
  fromClass: string;
  toClass: string;
  promotionType: 'PROMOTED' | 'GRADUATED';
  promotionDate: string;
}

export interface PromotionProgressResponse {
  batchId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalStudents: number;
  processedStudents: number;
  promotedStudents: number;
  retainedStudents: number;
  graduatedStudents: number;
  failedStudents: number;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  errors: string[];
}

export interface RevertPromotionResponse {
  success: boolean;
  message: string;
  revertedCount: number;
  failedRevertCount: number;
  errors: string[];
}

export interface CleanupStuckBatchesResponse {
  message: string;
  cleanedBatches: Array<{
    id: string;
    fromAcademicYear: string;
    toAcademicYear: string;
    createdAt: string;
    wasStuckFor: string;
  }>;
}

export interface PromotionBatch {
  id: string;
  fromAcademicYear: string;
  toAcademicYear: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalStudents: number;
  promotedStudents: number;
  retainedStudents: number;
  graduatedStudents: number;
  startedAt: string | null;
  completedAt: string | null;
  executedBy: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string | null;
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
   * Get promotion batches
   */
  async getPromotionBatches(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PromotionBatch[]>> {
    return this.httpClient.get(
      PROMOTION_ENDPOINTS.GET_PROMOTION_BATCHES,
      params,
      { requiresAuth: true },
    );
  }

  /**
   * Get specific promotion batch
   */
  async getPromotionBatch(
    batchId: string,
  ): Promise<ApiResponse<PromotionBatch>> {
    return this.httpClient.get(
      `${PROMOTION_ENDPOINTS.GET_PROMOTION_BATCH}/${batchId}`,
      {},
      { requiresAuth: true },
    );
  }

  /**
   * Get all academic years
   */
  async getAcademicYears(): Promise<ApiResponse<AcademicYear[]>> {
    return this.httpClient.get(
      PROMOTION_ENDPOINTS.GET_ACADEMIC_YEARS,
      {},
      { requiresAuth: true },
    );
  }

  /**
   * Get current academic year
   */
  async getCurrentAcademicYear(): Promise<ApiResponse<AcademicYear>> {
    return this.httpClient.get(
      PROMOTION_ENDPOINTS.GET_CURRENT_ACADEMIC_YEAR,
      {},
      { requiresAuth: true },
    );
  }

  /**
   * Create new academic year
   */
  async createAcademicYear(
    request: CreateAcademicYearRequest,
  ): Promise<ApiResponse<AcademicYear>> {
    return this.httpClient.post(
      PROMOTION_ENDPOINTS.CREATE_ACADEMIC_YEAR,
      request,
      { requiresAuth: true },
    );
  }

  /**
   * Promote individual student
   */
  async promoteIndividualStudent(
    request: IndividualPromotionRequest,
  ): Promise<ApiResponse<IndividualPromotionResponse>> {
    return this.httpClient.post<IndividualPromotionResponse>(
      PROMOTION_ENDPOINTS.INDIVIDUAL_PROMOTION,
      request,
      { requiresAuth: true },
    );
  }

  /**
   * Get promotion progress
   */
  async getPromotionProgress(
    batchId: string,
  ): Promise<ApiResponse<PromotionProgressResponse>> {
    return this.httpClient.get<PromotionProgressResponse>(
      `${PROMOTION_ENDPOINTS.GET_PROMOTION_PROGRESS}/${batchId}`,
      {},
      { requiresAuth: true },
    );
  }

  /**
   * Revert promotion batch
   */
  async revertPromotionBatch(
    batchId: string,
  ): Promise<ApiResponse<RevertPromotionResponse>> {
    return this.httpClient.post<RevertPromotionResponse>(
      `${PROMOTION_ENDPOINTS.REVERT_PROMOTION}/${batchId}`,
      {},
      { requiresAuth: true },
    );
  }

  /**
   * Clean up stuck promotion batches (debug endpoint)
   */
  async cleanupStuckBatches(): Promise<
    ApiResponse<CleanupStuckBatchesResponse>
  > {
    return this.httpClient.post<CleanupStuckBatchesResponse>(
      PROMOTION_ENDPOINTS.CLEANUP_STUCK_BATCHES,
      {},
      { requiresAuth: true },
    );
  }
}

// Export a singleton instance
export const promotionService = new PromotionService();
