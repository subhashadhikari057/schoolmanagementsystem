/**
 * =============================================================================
 * Staff API Types
 * =============================================================================
 * TypeScript type definitions for staff-related API operations
 * =============================================================================
 */

// User sub-schema
export interface CreateStaffUserData {
  fullName: string;
  email: string;
  phone?: string;
  password?: string; // Will be auto-generated if not provided
}

// Profile sub-schema
export interface CreateStaffProfileData {
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
  employmentDate: string; // YYYY-MM-DD
  salary?: number;
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

// Bank details sub-schema
export interface CreateStaffBankData {
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;
}

export interface CreateStaffRequest {
  user: CreateStaffUserData;
  profile: CreateStaffProfileData;
  bankDetails?: CreateStaffBankData;
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
  bankDetails?: UpdateStaffBankData;
}
