/**
 * =============================================================================
 * Staff API Types
 * =============================================================================
 * TypeScript type definitions for staff-related API operations
 * =============================================================================
 */

// User sub-schema
export interface CreateStaffUserData {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  password?: string; // Will be auto-generated if not provided
  createLoginAccount: boolean; // Controls whether to create a user account
}

// Profile sub-schema
export interface CreateStaffProfileData {
  employeeId?: string;
  qualification: string;
  designation: string;
  department:
    | 'administration'
    | 'finance'
    | 'hr'
    | 'maintenance'
    | 'security'
    | 'library'
    | 'canteen'
    | 'transport'
    | 'it_support'
    | 'academic_support';
  experienceYears?: number;
  joiningDate: string; // YYYY-MM-DD
  employmentDate: string; // YYYY-MM-DD
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  maritalStatus?: string;
  bio?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  profilePhotoUrl?: string;
}

// Bank details sub-schema
export interface CreateStaffBankData {
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;
}

// Salary information
export interface CreateStaffSalaryData {
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;
}

export interface CreateStaffRequest {
  user: CreateStaffUserData;
  profile: CreateStaffProfileData;
  salary?: CreateStaffSalaryData;
  bankDetails?: CreateStaffBankData;
  permissions?: string[];
}

// Update interfaces
export interface UpdateStaffUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateStaffProfileData {
  qualification?: string;
  designation?: string;
  department?: string;
  experienceYears?: number;
  employmentDate?: string;
  salary?: number;
  employmentStatus?: 'active' | 'on_leave' | 'resigned' | 'terminated';
  bio?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface UpdateStaffBankData {
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;
}

export interface UpdateStaffRequest {
  user?: UpdateStaffUserData;
  profile?: UpdateStaffProfileData;
  salary?: CreateStaffSalaryData;
  bankDetails?: UpdateStaffBankData;
  permissions?: string[];
}

// Salary history types
export interface StaffSalaryHistory {
  id: string;
  staffId: string;
  effectiveMonth: string;
  basicSalary: number;
  allowances: number;
  totalSalary: number;
  changeType: 'INITIAL' | 'PROMOTION' | 'DEMOTION' | 'ADJUSTMENT';
  changeReason?: string;
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export interface UpdateStaffSalaryRequest {
  basicSalary: number;
  allowances: number;
  changeType?: 'INITIAL' | 'PROMOTION' | 'DEMOTION' | 'ADJUSTMENT';
  changeReason?: string;
  effectiveMonth?: string;
}

export interface UpdateStaffSalaryResponse {
  message: string;
  data: {
    staff: {
      id: string;
      basicSalary: number;
      allowances: number;
      totalSalary: number;
    };
    salaryHistory: StaffSalaryHistory;
  };
}

export interface StaffSalaryHistoryResponse {
  message: string;
  data: StaffSalaryHistory[];
}
