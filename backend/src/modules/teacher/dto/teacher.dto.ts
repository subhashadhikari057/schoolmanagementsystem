import { z } from 'zod';

// ---------------------------
// Subschema for user creation
// ---------------------------
export const CreateTeacherUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().optional(), // ✅ fixed: added ()
});

// ---------------------------
// Subschema for profile creation
// ---------------------------
export const CreateTeacherProfileSchema = z.object({
  qualification: z.string().min(1, 'Qualification is required'),
  designation: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  dateOfJoining: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
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
// CreateTeacher DTO
// ---------------------------
export const CreateTeacherDto = z.object({
  user: CreateTeacherUserSchema,
  profile: CreateTeacherProfileSchema,
});

export type CreateTeacherDtoType = z.infer<typeof CreateTeacherDto>;

// ---------------------------
// UpdateTeacherByAdmin DTO
// ---------------------------
/**
 * Allows Admin or Superadmin to update any teacher's info.
 */
export const UpdateTeacherByAdminDto = z.object({
  fullName: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  profile: CreateTeacherProfileSchema.partial().optional(),
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
  fullName: z.string().optional(),
  phone: z.string().optional(),
  profile: z
    .object({
      bio: z.string().optional(),
      socialLinks: z
        .record(z.string().url()) // allows any social link keys with URL values
        .optional(),
    })
    .optional(),
});

export type UpdateTeacherSelfDtoType = z.infer<typeof UpdateTeacherSelfDto>;
