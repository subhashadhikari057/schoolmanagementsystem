import { apiClient } from '../client/apiClient';

export interface UserProfile {
  parents?: Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    relationship: string;
    isPrimary: boolean;
  }>;
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  teacherData?: {
    employeeId: string;
    designation: string;
    department: string;
    joiningDate: string;
    qualification: string;
    experienceYears: number;
    basicSalary: number;
    profile?: {
      contactInfo?: {
        address?: string;
      };
    };
  };
  studentData?: {
    studentId: string;
    rollNumber: string;
    classId: string;
    admissionDate: string;
    academicStatus: string;
    profile?: {
      additionalData?: {
        address?: string;
      };
      interests?: {
        hobbies?: string;
      };
    };
  };
  parentData?: {
    occupation: string;
    workPlace: string;
    profile?: {
      contactInfo?: {
        address?: string;
      };
    };
  };
  staffData?: {
    employeeId: string;
    designation: string;
    department: string;
    joiningDate: string;
    profile?: Record<string, unknown>;
  };
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  teacherData?: {
    designation?: string;
    qualification?: string;
    address?: string;
  };
  studentData?: {
    address?: string;
    interests?: string;
  };
  parentData?: {
    occupation?: string;
    workPlace?: string;
    address?: string;
  };
  staffData?: {
    designation?: string;
    address?: string;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AccountActivity {
  id: string;
  action: string;
  module: string;
  status: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/api/v1/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/api/v1/profile', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.post('/api/v1/profile/change-password', data);
  },

  /**
   * Get account activity
   */
  getAccountActivity: async (): Promise<AccountActivity[]> => {
    const response = await apiClient.get<AccountActivity[]>(
      '/api/v1/profile/activity',
    );
    return response.data;
  },
};
