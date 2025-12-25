import { z } from 'zod';

// ---------------------------
// Subschema for user creation
// ---------------------------
export const CreateParentUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().optional(), // Will be auto-generated if not provided
});

// ---------------------------
// Subschema for parent profile creation
// ---------------------------
export const CreateParentProfileSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  occupation: z.string().optional(),
  workPlace: z.string().optional(),
  workPhone: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),

  // Address Information
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  country: z.string().optional(),

  // Additional Information
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

// ---------------------------
// Subschema for child linking
// ---------------------------
export const ParentChildLinkSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  relationship: z.string().min(1, 'Relationship is required'),
  isPrimary: z.boolean().default(false),
});

// ---------------------------
// CreateParent DTO
// ---------------------------
export const CreateParentDto = z.object({
  user: CreateParentUserSchema,
  profile: CreateParentProfileSchema.optional(),
  children: z.array(ParentChildLinkSchema).optional(),
});

export type CreateParentDtoType = z.infer<typeof CreateParentDto>;

// ---------------------------
// UpdateParentByAdmin DTO
// ---------------------------
export const UpdateParentByAdminDto = z.object({
  user: z
    .object({
      fullName: z.string().min(1).optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
  profile: CreateParentProfileSchema.partial().optional(),
});

export type UpdateParentByAdminDtoType = z.infer<typeof UpdateParentByAdminDto>;

// ---------------------------
// UpdateParentSelf DTO (for parents to update their own profile)
// ---------------------------
export const UpdateParentSelfDto = z.object({
  user: z
    .object({
      fullName: z.string().min(1).optional(),
      phone: z.string().optional(),
    })
    .optional(),
  profile: z
    .object({
      occupation: z.string().optional(),
      workPlace: z.string().optional(),
      workPhone: z.string().optional(),
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      emergencyContactRelationship: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
      country: z.string().optional(),
      notes: z.string().optional(),
      specialInstructions: z.string().optional(),
    })
    .optional(),
});

export type UpdateParentSelfDtoType = z.infer<typeof UpdateParentSelfDto>;

// ---------------------------
// Link Child DTO
// ---------------------------
export const LinkChildDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  relationship: z.string().min(1, 'Relationship is required'),
  isPrimary: z.boolean().default(false),
});

export type LinkChildDtoType = z.infer<typeof LinkChildDto>;

// ---------------------------
// Unlink Child DTO
// ---------------------------
export const UnlinkChildDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

export type UnlinkChildDtoType = z.infer<typeof UnlinkChildDto>;

// ---------------------------
// Set Primary Parent DTO
// ---------------------------
export const SetPrimaryParentDto = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
  studentId: z.string().uuid('Invalid student ID'),
});

export type SetPrimaryParentDtoType = z.infer<typeof SetPrimaryParentDto>;

// ---------------------------
// GetAllParents Query DTO
// ---------------------------
export const GetAllParentsDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['fullName', 'createdAt', 'occupation']).default('fullName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetAllParentsDtoType = z.infer<typeof GetAllParentsDto>;

// ---------------------------
// Parent Response DTO
// ---------------------------
export const ParentResponseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),

  // Profile Information
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  workPlace: z.string().optional(),
  workPhone: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),

  // Address Information
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  country: z.string().optional(),

  // Additional Information
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),

  // Children
  children: z
    .array(
      z.object({
        id: z.string(),
        studentId: z.string(),
        fullName: z.string(),
        className: z.string().optional(),
        classId: z.string().optional(),
        rollNumber: z.string().optional(),
        relationship: z.string(),
        isPrimary: z.boolean(),
      }),
    )
    .optional(),

  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export type ParentResponseDtoType = z.infer<typeof ParentResponseDto>;
