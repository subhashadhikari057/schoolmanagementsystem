/**
 * =============================================================================
 * Teacher API Types
 * =============================================================================
 * TypeScript type definitions for teacher-related API operations
 * =============================================================================
 */

// ============================================================================
// Create Teacher Request Types
// ============================================================================

export interface CreateTeacherUserData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
}

export interface CreateTeacherPersonalData {
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface CreateTeacherProfessionalData {
  employeeId?: string;
  joiningDate: string;
  experienceYears?: number;
  highestQualification: string;
  specialization?: string;
  designation?: string;
  department?: string;
}

export interface CreateTeacherSubjectData {
  subjects?: string[];
  isClassTeacher?: boolean;
}

export interface CreateTeacherSalaryData {
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;
}

export interface CreateTeacherAdditionalData {
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

// Bank and legal details
export interface CreateTeacherBankData {
  bankName?: string;
  accountNumber?: string;
  branch?: string;
  panNumber?: string;
  citizenshipNumber?: string;
}

export interface CreateTeacherRequest {
  user: CreateTeacherUserData;
  personal?: CreateTeacherPersonalData;
  professional: CreateTeacherProfessionalData;
  subjects?: CreateTeacherSubjectData;
  salary?: CreateTeacherSalaryData;
  bankDetails?: CreateTeacherBankData;
  additional?: CreateTeacherAdditionalData;
}

// ============================================================================
// Teacher Response Types
// ============================================================================

export interface TeacherResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  employeeId?: string;
  profilePhotoUrl?: string;
}

export interface CreateTeacherResponse {
  message: string;
  teacher: TeacherResponse;
  temporaryPassword?: string;
}

export interface TeacherListResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  employmentStatus: string;
  employmentDate?: string;
  experienceYears?: number;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  address?: string;

  // Salary Information (for admin view)
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;

  // Bank and Legal Information
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;

  // Class Teacher Status
  isClassTeacher: boolean;

  // Additional Information
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;

  // Profile Information
  profilePhotoUrl?: string;
  bio?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };

  // System fields
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;

  // Subject assignments
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
  }>;

  // Class assignments (if class teacher)
  classAssignments?: Array<{
    id: string;
    className: string;
    section: string;
  }>;
}

// ============================================================================
// Update Teacher Request Types
// ============================================================================

export interface UpdateTeacherByAdminRequest {
  user?: Partial<CreateTeacherUserData>;
  personal?: Partial<CreateTeacherPersonalData>;
  professional?: Partial<CreateTeacherProfessionalData>;
  subjects?: Partial<CreateTeacherSubjectData>;
  salary?: Partial<CreateTeacherSalaryData>;
  bankDetails?: Partial<CreateTeacherBankData>;
  additional?: Partial<CreateTeacherAdditionalData>;
  status?: string; // Added status field for activation/deactivation
}

export interface UpdateTeacherSelfRequest {
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  personal?: {
    address?: string;
  };
  additional?: {
    bio?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
}

export interface UpdateTeacherResponse {
  message: string;
  id: string;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface TeacherApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// Form Data Types (for frontend form)
// ============================================================================

export interface TeacherFormData {
  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  address: string; // Keep for backward compatibility
  photo?: File | null;

  // Professional Information
  employeeId?: string;
  joiningDate?: string;
  experience?: string;
  highestQualification?: string;
  specialization?: string;
  designation?: string;
  department?: string;

  // Subject Assignment
  subjects?: string[];
  isClassTeacher?: boolean;

  // Salary Information
  basicSalary?: string;
  allowances?: string;
  totalSalary?: string;

  // Bank and Legal Information
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;

  // Additional Information
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;
}
