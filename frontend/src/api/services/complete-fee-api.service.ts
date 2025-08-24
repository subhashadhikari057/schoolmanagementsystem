/**
 * Complete Fee Management API Service
 * Single source of truth for all fee-related operations
 */

// CSRF token management
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  try {
    const response = await fetch('/api/v1/csrf/token', {
      credentials: 'include',
    });
    const data = await response.json();
    csrfToken = data.token;
    return csrfToken!;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw new Error('CSRF token retrieval failed');
  }
}

// Enhanced fetch wrapper with CSRF protection
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add CSRF token for mutation operations
  const method = options.method || 'GET';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    headers['X-CSRF-Token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

// Core Types
export interface Student {
  id: string;
  fullName: string;
  rollNumber: string;
  classId: string;
  className?: string;
  email?: string;
}

export interface FeeStructure {
  id: string;
  classId: string;
  academicYear: string;
  name: string;
  status: string;
  effectiveFrom: string;
  createdAt: string;
  items: FeeStructureItem[];
}

export interface FeeStructureItem {
  id: string;
  category: string;
  label: string;
  amount: number;
  frequency: string;
}

export interface ScholarshipDefinition {
  id: string;
  name: string;
  type: string;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChargeDefinition {
  id: string;
  name: string;
  type: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ScholarshipAssignment {
  id: string;
  scholarshipId: string;
  studentId: string;
  effectiveFrom: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ChargeAssignment {
  id: string;
  chargeId: string;
  studentId: string;
  appliedMonth: string;
  reason?: string;
  createdAt: string;
}

export interface StudentFeeHistory {
  id: string;
  studentId: string;
  feeStructureId: string;
  periodMonth: string;
  version: number;
  baseAmount: number;
  scholarshipAmount: number;
  extraChargesAmount: number;
  finalPayable: number;
  breakdown: Record<string, any>;
  createdAt: string;
}

// Request/Response DTOs
export interface CreateScholarshipDto {
  name: string;
  type: string;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface AssignScholarshipDto {
  scholarshipId: string;
  studentIds: string[];
  effectiveFrom: string;
  expiresAt?: string;
}

export interface CreateChargeDto {
  name: string;
  type: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  isRecurring?: boolean;
}

export interface ApplyChargeDto {
  chargeId: string;
  studentIds: string[];
  appliedMonth: string;
  reason?: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Complete Fee Management API Service
 */
export const feeManagementApi = {
  // ==================== STUDENT OPERATIONS ====================

  /**
   * Search for students with filtering and pagination
   */
  async searchStudents(
    params: {
      search?: string;
      classId?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<Student>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiCall<Paginated<Student>>(
      `/api/v1/students?${queryParams.toString()}`,
    );
  },

  /**
   * Get a specific student by ID
   */
  async getStudent(studentId: string): Promise<Student> {
    return apiCall<Student>(`/api/v1/students/${studentId}`);
  },

  // ==================== SCHOLARSHIP OPERATIONS ====================

  /**
   * Create a new scholarship definition
   */
  async createScholarship(
    dto: CreateScholarshipDto,
  ): Promise<ScholarshipDefinition> {
    return apiCall<ScholarshipDefinition>('/api/v1/fees/scholarships', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Get all scholarship definitions
   */
  async getScholarships(): Promise<ScholarshipDefinition[]> {
    return apiCall<ScholarshipDefinition[]>('/api/v1/fees/scholarships/list');
  },

  /**
   * Assign scholarship to students
   */
  async assignScholarship(
    dto: AssignScholarshipDto,
  ): Promise<{ message: string; assignedCount: number }> {
    return apiCall('/api/v1/fees/scholarships/assign', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Get student's scholarships
   */
  async getStudentScholarships(
    studentId: string,
  ): Promise<ScholarshipAssignment[]> {
    return apiCall<ScholarshipAssignment[]>(
      `/api/v1/fees/scholarships/students/${studentId}`,
    );
  },

  /**
   * Remove scholarship assignment
   */
  async removeScholarshipAssignment(
    assignmentId: string,
  ): Promise<{ message: string }> {
    return apiCall(`/api/v1/fees/scholarships/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  // ==================== CHARGE OPERATIONS ====================

  /**
   * Create a new charge definition
   */
  async createCharge(dto: CreateChargeDto): Promise<ChargeDefinition> {
    return apiCall<ChargeDefinition>('/api/v1/fees/charges', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Get all charge definitions
   */
  async getCharges(): Promise<ChargeDefinition[]> {
    return apiCall<ChargeDefinition[]>('/api/v1/fees/charges/list');
  },

  /**
   * Apply charge to students
   */
  async applyCharge(
    dto: ApplyChargeDto,
  ): Promise<{ message: string; appliedCount: number }> {
    return apiCall('/api/v1/fees/charges/apply', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Get student's charges for a specific period
   */
  async getStudentCharges(
    studentId: string,
    params: {
      fromMonth?: string;
      toMonth?: string;
    } = {},
  ): Promise<ChargeAssignment[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const url =
      `/api/v1/fees/charges/students/${studentId}` +
      (queryParams.toString() ? `?${queryParams.toString()}` : '');

    return apiCall<ChargeAssignment[]>(url);
  },

  /**
   * Remove charge assignment
   */
  async removeChargeAssignment(
    assignmentId: string,
  ): Promise<{ message: string }> {
    return apiCall(`/api/v1/fees/charges/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  // ==================== FEE STRUCTURE OPERATIONS ====================

  /**
   * Get fee structures with filtering
   */
  async getFeeStructures(
    params: {
      classId?: string;
      academicYear?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<Paginated<FeeStructure>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiCall<Paginated<FeeStructure>>(
      `/api/v1/fees/structures?${queryParams.toString()}`,
    );
  },

  // ==================== STUDENT FEE HISTORY OPERATIONS ====================

  /**
   * Get student's current month fee
   */
  async getStudentCurrentFee(studentId: string): Promise<{
    student: Student;
    feeStructure: FeeStructure;
    computedFee: StudentFeeHistory;
    scholarships: ScholarshipAssignment[];
    charges: ChargeAssignment[];
  }> {
    return apiCall(`/api/student-fees/${studentId}/current`);
  },

  /**
   * Get student's fee history
   */
  async getStudentFeeHistory(
    studentId: string,
    params: {
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<{
    student: Student;
    summary: {
      totalPaid: number;
      totalScholarships: number;
      totalCharges: number;
      averageMonthlyFee: number;
    };
    history: StudentFeeHistory[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiCall(
      `/api/student-fees/${studentId}/history?${queryParams.toString()}`,
    );
  },

  /**
   * Get student's fee for specific month
   */
  async getStudentMonthlyFee(
    studentId: string,
    month: string,
  ): Promise<{
    student: Student;
    feeHistory: {
      current: StudentFeeHistory;
      allVersions: StudentFeeHistory[];
    };
    breakdown: {
      baseAmount: number;
      scholarships: Array<{
        scholarship: ScholarshipDefinition;
        assignment: ScholarshipAssignment;
        deductionAmount: number;
      }>;
      charges: Array<{
        charge: ChargeDefinition;
        assignment: ChargeAssignment;
        chargeAmount: number;
      }>;
      finalPayable: number;
    };
  }> {
    return apiCall(`/api/student-fees/${studentId}/month/${month}`);
  },

  /**
   * Get bulk student fees for a month
   */
  async getBulkStudentFees(
    month: string,
    params: {
      classId?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<{
    month: string;
    summary: {
      totalStudents: number;
      totalCollection: number;
      totalScholarships: number;
      totalCharges: number;
      averageFeePerStudent: number;
      classBreakdown: Array<{
        classId: string;
        className: string;
        studentCount: number;
        totalCollection: number;
      }>;
    };
    students: Array<{
      student: Student;
      feeHistory: StudentFeeHistory;
      scholarships: ScholarshipAssignment[];
      charges: ChargeAssignment[];
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiCall(`/api/student-fees/bulk/${month}?${queryParams.toString()}`);
  },

  /**
   * Compute monthly fees for a class
   */
  async computeMonthlyFees(dto: {
    classId: string;
    month: string;
    includeExisting?: boolean;
  }): Promise<{ message: string; count: number }> {
    return apiCall('/api/v1/fees/compute/month', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

// Re-export for backward compatibility (will be removed later)
export const feeService = {
  listScholarships: () => feeManagementApi.getScholarships(),
  listCharges: () => feeManagementApi.getCharges(),
  createScholarship: (dto: CreateScholarshipDto) =>
    feeManagementApi.createScholarship(dto),
  createCharge: (dto: CreateChargeDto) => feeManagementApi.createCharge(dto),
  assignScholarship: (dto: AssignScholarshipDto) =>
    feeManagementApi.assignScholarship(dto),
  applyCharge: (dto: ApplyChargeDto) => feeManagementApi.applyCharge(dto),
};

export default feeManagementApi;
