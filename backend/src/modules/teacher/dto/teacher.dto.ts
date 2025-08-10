import { z } from 'zod';

// ---------------------------
// Subschema for user creation
// ---------------------------
export const CreateTeacherUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().optional(),
});

// ---------------------------
// Subschema for personal information
// ---------------------------
export const CreateTeacherPersonalSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  maritalStatus: z.string().optional(),
});

// ---------------------------
// Subschema for professional information
// ---------------------------
export const CreateTeacherProfessionalSchema = z.object({
  employeeId: z.string().optional(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  experienceYears: z.number().min(0).optional(),
  highestQualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
});

// ---------------------------
// Subschema for subject assignment
// ---------------------------
export const CreateTeacherSubjectSchema = z.object({
  subjects: z.array(z.string()).optional(),
  isClassTeacher: z.boolean().default(false),
});

// ---------------------------
// Subschema for salary information
// ---------------------------
export const CreateTeacherSalarySchema = z.object({
  basicSalary: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  totalSalary: z.number().min(0).optional(),
});

// ---------------------------
// Subschema for additional information
// ---------------------------
export const CreateTeacherAdditionalSchema = z.object({
  languagesKnown: z.array(z.string()).optional(),
  certifications: z.string().optional(),
  previousExperience: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .partial()
    .optional(),
});

// ---------------------------
// Subschema for bank details
// ---------------------------
export const CreateTeacherBankSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branch: z.string().optional(),
  panNumber: z.string().optional(),
  citizenshipNumber: z.string().optional(),
});

// ---------------------------
// CreateTeacher DTO (Complete)
// ---------------------------
export const CreateTeacherDto = z.object({
  user: CreateTeacherUserSchema,
  personal: CreateTeacherPersonalSchema.optional(),
  professional: CreateTeacherProfessionalSchema,
  subjects: CreateTeacherSubjectSchema.optional(),
  salary: CreateTeacherSalarySchema.optional(),
  bankDetails: CreateTeacherBankSchema.optional(),
  additional: CreateTeacherAdditionalSchema.optional(),
});

export type CreateTeacherDtoType = z.infer<typeof CreateTeacherDto>;

// ---------------------------
// UpdateTeacherByAdmin DTO
// ---------------------------
/**
 * Allows Admin or Superadmin to update any teacher's info.
 */
export const UpdateTeacherByAdminDto = z.object({
  user: CreateTeacherUserSchema.partial().optional(),
  personal: CreateTeacherPersonalSchema.partial().optional(),
  professional: CreateTeacherProfessionalSchema.partial().optional(),
  subjects: CreateTeacherSubjectSchema.partial().optional(),
  salary: CreateTeacherSalarySchema.partial().optional(),
  bankDetails: CreateTeacherBankSchema.partial().optional(),
  additional: CreateTeacherAdditionalSchema.partial().optional(),
});

export type UpdateTeacherByAdminDtoType = z.infer<
  typeof UpdateTeacherByAdminDto
>;

// ---------------------------
// UpdateTeacherSelf DTO
// ---------------------------
/**
 * Allows a teacher to update their own limited profile.
 */
export const UpdateTeacherSelfDto = z.object({
  user: z
    .object({
      firstName: z.string().optional(),
      middleName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  personal: z
    .object({
      address: z.string().optional(),
    })
    .optional(),
  additional: z
    .object({
      bio: z.string().optional(),
      socialLinks: z
        .object({
          linkedin: z.string().url().optional(),
          twitter: z.string().url().optional(),
          website: z.string().url().optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export type UpdateTeacherSelfDtoType = z.infer<typeof UpdateTeacherSelfDto>;
