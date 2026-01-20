import { z } from 'zod';
import { apiClient } from '../client';

// Schemas (mirror backend)
export const feeStructureListParamsSchema = z.object({
  classId: z.string().uuid().optional(),
  academicYear: z.string().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type FeeStructureListParams = z.infer<
  typeof feeStructureListParamsSchema
>;

export interface FeeStructureItemSnapshot {
  category: string;
  label: string;
  amount: string;
  frequency: string;
}
export interface FeeStructure {
  id: string;
  classId: string;
  academicYear: string;
  name: string;
  status: string;
  effectiveFrom: string;
  grade?: number;
  section?: string;
  assignedClasses: Array<{
    id: string;
    grade: number | null;
    section: string | null;
  }>;
  studentCount: number;
  items: Array<{ id: string; label: string; amount: number }>;
  totalAnnual?: number;
  latestVersion: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// DTOs (mirror backend shared-types; keep minimal fields used by UI)
export interface FeeStructureItemInput {
  category: string;
  label: string;
  amount: number;
  frequency: string;
}
export interface CreateFeeStructureDto {
  classId: string;
  academicYear: string;
  name: string;
  effectiveFrom: string;
  items: FeeStructureItemInput[];
}
export interface ReviseFeeStructureDto {
  effectiveFrom: string;
  changeReason?: string;
  items: FeeStructureItemInput[];
}
export interface CreateScholarshipDto {
  name: string;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  type?: string;
}
export interface AssignScholarshipDto {
  scholarshipId: string;
  studentIds: string[];
  effectiveFrom: string;
  expiresAt?: string;
}
export interface CreateChargeDto {
  name: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  type?: string;
  category?: string;
  isRecurring?: boolean;
}
export interface ApplyChargeDto {
  chargeId: string;
  studentIds: string[];
  appliedMonth: string;
  reason?: string;
}

export interface ScholarshipDefinition {
  id: string;
  name: string;
  type: string;
  valueType: string;
  value: string;
  isActive: boolean;
  createdAt: string;
}
export interface ChargeDefinition {
  id: string;
  name: string;
  type: string;
  valueType: string;
  value: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ScholarshipDetails {
  id: string;
  name: string;
  description?: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eligibilityCriteria?: string;
  deadline?: string;
  totalAmount?: number;
  assignments: ScholarshipAssignment[];
}

export interface ScholarshipAssignment {
  id: string;
  effectiveFrom: string;
  expiresAt?: string;
  isActive: boolean;
  student: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
      email: string;
    };
    class: {
      name: string;
      grade: number;
      section: string;
    };
  };
}

export interface StudentFeeBreakdown {
  version: number;
  baseAmount: number;
  scholarshipDeduction: number;
  extraCharges: number;
  finalPayable: number;
  breakdown?: unknown;
}

export interface CurrentStudentFeeResponse {
  studentId: string;
  currentMonth: string; // YYYY-MM
  student: {
    fullName: string;
    rollNumber: string;
    class: { id: string; name?: string | null };
  };
  computedFee?: StudentFeeBreakdown;
  message?: string;
}

export const feeService = {
  async listStructures(params: FeeStructureListParams) {
    const qp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qp.append(k, String(v));
    });
    const response = await apiClient.get<Paginated<FeeStructure>>(
      `/api/v1/fees/structures/list?${qp.toString()}`,
    );
    return response; // Return the full response, not response.data
  },
  async history(structureId: string) {
    const response = await apiClient.get<
      {
        id: string;
        version: number;
        effectiveFrom: string;
        totalAnnual?: string;
        changeReason?: string;
      }[]
    >(`/api/v1/fees/structures/${structureId}/history`);
    return response.data;
  },
  async createStructure(payload: CreateFeeStructureDto) {
    // refine with zod if needed
    const response = await apiClient.post<FeeStructure>(
      `/api/v1/fees/structures`,
      payload,
    );
    return response.data;
  },
  async reviseStructure(id: string, payload: ReviseFeeStructureDto) {
    const response = await apiClient.post<{
      version: number;
      totalAnnual: string;
    }>(`/api/v1/fees/structures/${id}/revise`, payload);
    return response.data;
  },
  async computeMonth(payload: {
    classId: string;
    month: string;
    includeExisting?: boolean;
  }) {
    const response = await apiClient.post<{ count: number }>(
      `/api/v1/fees/compute/month`,
      payload,
    );
    return response.data;
  },
  async createScholarship(payload: CreateScholarshipDto) {
    const response = await apiClient.post(`/api/v1/fees/scholarships`, payload);
    return response.data;
  },
  async listScholarships() {
    const response = await apiClient.get<ScholarshipDefinition[]>(
      `/api/v1/fees/scholarships/list?includeInactive=true`,
    );
    return response.data;
  },
  async assignScholarship(payload: AssignScholarshipDto) {
    const response = await apiClient.post(
      `/api/v1/fees/scholarships/assign`,
      payload,
    );
    return response.data;
  },
  async deactivateScholarship(id: string) {
    const response = await apiClient.put(
      `/api/v1/fees/scholarships/${id}/deactivate`,
    );
    return response.data;
  },
  async reactivateScholarship(id: string) {
    const response = await apiClient.put(
      `/api/v1/fees/scholarships/${id}/reactivate`,
    );
    return response.data;
  },
  async createCharge(payload: CreateChargeDto) {
    const response = await apiClient.post(`/api/v1/fees/charges`, payload);
    return response.data;
  },
  async listCharges() {
    const response = await apiClient.get<ChargeDefinition[]>(
      `/api/v1/fees/charges/list?includeInactive=true`,
    );
    return response.data;
  },
  async applyCharge(payload: ApplyChargeDto) {
    const response = await apiClient.post(
      `/api/v1/fees/charges/apply`,
      payload,
    );
    return response.data;
  },
  async deactivateCharge(id: string) {
    const response = await apiClient.put(
      `/api/v1/fees/charges/${id}/deactivate`,
    );
    return response.data;
  },
  async reactivateCharge(id: string) {
    const response = await apiClient.put(
      `/api/v1/fees/charges/${id}/reactivate`,
    );
    return response.data;
  },
  async getScholarshipDetails(id: string) {
    try {
      const response = await apiClient.get<ScholarshipDetails>(
        `/api/v1/fees/scholarships/${id}/details`,
      );
      return response.data;
    } catch (error) {
      // For development: If endpoint doesn't exist, throw a descriptive error
      console.warn(
        'Scholarship details endpoint not implemented yet, falling back to mock data',
      );
      throw new Error('Scholarship details endpoint not available');
    }
  },
  async toggleScholarshipAssignment(assignmentId: string, isActive: boolean) {
    try {
      const response = await apiClient.put(
        `/api/v1/fees/scholarships/assignments/${assignmentId}/toggle`,
        { isActive },
      );
      return response.data;
    } catch (error) {
      // For development: If endpoint doesn't exist, throw a descriptive error
      console.warn(
        'Scholarship assignment toggle endpoint not implemented yet',
      );
      throw new Error('Scholarship assignment toggle endpoint not available');
    }
  },
  async getCurrentFeesForParentChild(
    studentId: string,
  ): Promise<CurrentStudentFeeResponse> {
    const response = await apiClient.get<CurrentStudentFeeResponse>(
      `/api/v1/fees/parent/children/${studentId}/current`,
    );
    return response.data;
  },
};
