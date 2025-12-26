import { z } from 'zod';
import { DisabilityType, MotherTongue } from '@prisma/client';

// ---------------------------
// Subschema for user creation
// ---------------------------
export const CreateStudentUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().optional(), // Auto-generated if not provided
});

// ---------------------------
// Subschema for personal information
// ---------------------------
export const CreateStudentPersonalSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  ethnicity: z.string().optional(),
  motherTongue: z.nativeEnum(MotherTongue).optional(),
  disabilityType: z.nativeEnum(DisabilityType).optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
});

// ---------------------------
// Subschema for academic information
// ---------------------------
export const CreateStudentAcademicSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  rollNumber: z.string().optional(), // Will be auto-generated based on class capacity
  admissionDate: z.string().min(1, 'Admission date is required'),
  studentId: z.string().optional(), // Alternative student ID
  academicStatus: z
    .enum(['active', 'suspended', 'graduated', 'transferred'])
    .optional()
    .default('active'),
  transportMode: z.string().optional(), // Made optional as requested
});

// ---------------------------
// Subschema for parent information
// ---------------------------
export const CreateStudentParentSchema = z.object({
  // Father Information
  fatherFirstName: z.string().min(1, 'Father first name is required'),
  fatherMiddleName: z.string().optional(),
  fatherLastName: z.string().min(1, 'Father last name is required'),
  fatherEmail: z.string().email('Invalid father email format'),
  fatherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),

  // Mother Information
  motherFirstName: z.string().min(1, 'Mother first name is required'),
  motherMiddleName: z.string().optional(),
  motherLastName: z.string().min(1, 'Mother last name is required'),
  motherEmail: z.string().email('Invalid mother email format'),
  motherPhone: z.string().optional(),
  motherOccupation: z.string().optional(),
});

// ---------------------------
// Subschema for parent user accounts to create
// ---------------------------
export const CreateStudentParentAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  relationship: z.enum([
    'father',
    'mother',
    'guardian',
    'stepfather',
    'stepmother',
    'grandfather',
    'grandmother',
    'uncle',
    'aunt',
    'other',
  ]),
  isPrimary: z.boolean().default(false),
  createUserAccount: z.boolean().default(true), // Whether to create login account
  occupation: z.string().optional(),
});

// ---------------------------
// Subschema for linking existing parent
// ---------------------------
export const LinkExistingParentSchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
  relationship: z.enum([
    'father',
    'mother',
    'guardian',
    'stepfather',
    'stepmother',
    'grandfather',
    'grandmother',
    'uncle',
    'aunt',
    'other',
  ]),
  isPrimary: z.boolean().default(false),
});

// ---------------------------
// Subschema for guardian information
// ---------------------------
export const CreateStudentGuardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Guardian phone is required'),
  email: z.string().email('Invalid guardian email format'),
  relation: z.string().min(1, 'Guardian relation is required'),
  occupation: z.string().optional(),
  createUserAccount: z.boolean().default(false),
});

// ---------------------------
// Subschema for medical and additional information
// ---------------------------
export const CreateStudentAdditionalSchema = z.object({
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  interests: z.string().optional(),
  specialNeeds: z.string().optional(),
  bio: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
});

// ---------------------------
// Subschema for profile information
// ---------------------------
export const CreateStudentProfileSchema = z.object({
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  interests: z
    .object({
      interests: z.string(),
    })
    .optional(),
  additionalData: z
    .object({
      medicalConditions: z.string().optional(),
      allergies: z.string().optional(),
      specialNeeds: z.string().optional(),
    })
    .optional(),
});

// ---------------------------
// CreateStudent DTO (Complete)
// ---------------------------
export const CreateStudentDto = z.object({
  user: CreateStudentUserSchema,
  personal: CreateStudentPersonalSchema.optional(),
  academic: CreateStudentAcademicSchema,
  parentInfo: CreateStudentParentSchema.optional(), // Optional when using existing parents
  parents: z.array(CreateStudentParentAccountSchema).optional(),
  existingParents: z.array(LinkExistingParentSchema).optional(), // For linking existing parents
  guardians: z.array(CreateStudentGuardianSchema).optional(), // All guardians (with createUserAccount flag)
  additional: CreateStudentAdditionalSchema.optional(),
  profile: CreateStudentProfileSchema.optional(),
});

export type CreateStudentDtoType = z.infer<typeof CreateStudentDto>;

// ---------------------------
// Update Student DTOs
// ---------------------------
export const UpdateStudentByAdminUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const UpdateStudentByAdminPersonalSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  ethnicity: z.string().optional(),
  motherTongue: z.nativeEnum(MotherTongue).optional(),
  disabilityType: z.nativeEnum(DisabilityType).optional(),
  maritalStatus: z
    .enum(['single', 'married', 'divorced', 'widowed'])
    .optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
});

export const UpdateStudentByAdminAcademicSchema = z.object({
  classId: z.string().optional(),
  rollNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  studentId: z.string().optional(),
  academicStatus: z
    .enum(['active', 'suspended', 'graduated', 'transferred'])
    .optional(),
  feeStatus: z.enum(['paid', 'pending', 'overdue', 'partial']).optional(),
  transportMode: z.string().optional(),
});

export const UpdateStudentByAdminParentSchema = z.object({
  fatherFirstName: z.string().optional(),
  fatherMiddleName: z.string().optional(),
  fatherLastName: z.string().optional(),
  fatherEmail: z.string().email().optional(),
  fatherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherFirstName: z.string().optional(),
  motherMiddleName: z.string().optional(),
  motherLastName: z.string().optional(),
  motherEmail: z.string().email().optional(),
  motherPhone: z.string().optional(),
  motherOccupation: z.string().optional(),
});

export const UpdateStudentByAdminDto = z.object({
  user: UpdateStudentByAdminUserSchema.optional(),
  personal: UpdateStudentByAdminPersonalSchema.optional(),
  academic: UpdateStudentByAdminAcademicSchema.optional(),
  parentInfo: UpdateStudentByAdminParentSchema.optional(),
  additional: CreateStudentAdditionalSchema.optional(),
});

export type UpdateStudentByAdminDtoType = z.infer<
  typeof UpdateStudentByAdminDto
>;

// ---------------------------
// Self Update DTO (Limited fields)
// ---------------------------
export const UpdateStudentSelfUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const UpdateStudentSelfPersonalSchema = z.object({
  ethnicity: z.string().optional(),
  motherTongue: z.nativeEnum(MotherTongue).optional(),
  disabilityType: z.nativeEnum(DisabilityType).optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
});

export const UpdateStudentSelfDto = z.object({
  user: UpdateStudentSelfUserSchema.optional(),
  personal: UpdateStudentSelfPersonalSchema.optional(),
  additional: z
    .object({
      interests: z.string().optional(),
      bio: z.string().optional(),
    })
    .optional(),
});

export type UpdateStudentSelfDtoType = z.infer<typeof UpdateStudentSelfDto>;

// ---------------------------
// Query DTOs
// ---------------------------
export const GetAllStudentsDto = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  page: z.coerce.number().min(1).optional().default(1),
  search: z.string().optional(),
  classId: z.string().optional(),
  ethnicity: z.string().optional(),
  academicStatus: z
    .enum(['active', 'suspended', 'graduated', 'transferred'])
    .optional(),
  feeStatus: z.enum(['paid', 'pending', 'overdue', 'partial']).optional(),
  sortBy: z
    .enum(['name', 'rollNumber', 'admissionDate', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetAllStudentsDtoType = z.infer<typeof GetAllStudentsDto>;

// ---------------------------
// Response DTOs
// ---------------------------
export const StudentResponseDto = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  rollNumber: z.string(),
  studentId: z.string().optional(),
  classId: z.string(),
  className: z.string().optional(),

  // Personal Information
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  ethnicity: z.string().optional(),
  motherTongue: z.string().optional(),
  disabilityType: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),

  // Academic Information
  admissionDate: z.string(),
  academicStatus: z.string(),
  feeStatus: z.string(),
  transportMode: z.string().optional(),

  // Parent Information
  fatherFirstName: z.string(),
  fatherMiddleName: z.string().optional(),
  fatherLastName: z.string(),
  motherFirstName: z.string(),
  motherMiddleName: z.string().optional(),
  motherLastName: z.string(),
  fatherPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherEmail: z.string(),
  motherEmail: z.string(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),

  // Medical Information
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),

  // Additional Information
  interests: z.string().optional(),
  specialNeeds: z.string().optional(),

  // Profile Information
  profilePhotoUrl: z.string().optional(),
  bio: z.string().optional(),

  // System fields
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),

  // Relations
  parents: z
    .array(
      z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
        relationship: z.string(),
        isPrimary: z.boolean(),
      }),
    )
    .optional(),

  guardians: z
    .array(
      z.object({
        id: z.string(),
        fullName: z.string(),
        phone: z.string(),
        email: z.string(),
        relation: z.string(),
      }),
    )
    .optional(),
});

export type StudentResponseDtoType = z.infer<typeof StudentResponseDto>;

export const StudentListResponseDto = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  rollNumber: z.string(),
  studentId: z.string().optional(),
  className: z.string(),
  admissionDate: z.string(),
  academicStatus: z.string(),
  feeStatus: z.string(),
  profilePhotoUrl: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type StudentListResponseDtoType = z.infer<typeof StudentListResponseDto>;

// ---------------------------
// Create Student Response
// ---------------------------
export const CreateStudentResponseDto = z.object({
  student: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    rollNumber: z.string(),
    studentId: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
  }),
  temporaryPassword: z.string().optional(),
  parentCredentials: z
    .array(
      z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
        relationship: z.string(),
        temporaryPassword: z.string(),
      }),
    )
    .optional(),
});

export type CreateStudentResponseDtoType = z.infer<
  typeof CreateStudentResponseDto
>;

// ---------------------------
// Aggregated stats
// ---------------------------
export const GetGenderEthnicityStatsDto = z.object({
  grade: z.coerce.number().min(1).max(12).optional(),
});

export type GetGenderEthnicityStatsDtoType = z.infer<
  typeof GetGenderEthnicityStatsDto
>;

// ---------------------------
// Grade/Gender stats (no params for now)
// ---------------------------
export const GetGenderGradeStatsDto = z.object({});
export type GetGenderGradeStatsDtoType = z.infer<typeof GetGenderGradeStatsDto>;
