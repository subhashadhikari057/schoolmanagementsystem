import { z } from 'zod';

// ✅ Reusable JSON schema
const JsonRecordSchema = z.record(z.any()).optional();

// ✅ Profile schema for create (inline inside CreateStudentDto)
const StudentProfileInput = z
  .object({
    bio: z.string().optional(),
    profilePhotoUrl: z.string().url().optional(),
    emergencyContact: JsonRecordSchema,
    interests: JsonRecordSchema,
    additionalData: JsonRecordSchema,
  })
  .optional();

// ✅ CreateStudentDto for completely new student with new parents
export const CreateStudentWithNewParentsDto = z.object({
  user: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    password: z.string().optional(), // Generate if missing
  }),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  additionalMetadata: JsonRecordSchema,
  profile: StudentProfileInput,

  // ✅ New parents (primary gets user account, others are contacts)
  parents: z
    .array(
      z.object({
        fullName: z.string().min(1, 'Parent full name is required'),
        email: z.string().email('Invalid parent email'),
        phone: z.string().optional(),
        password: z.string().optional(), // Only for primary parent
        relationship: z.string().min(1, 'Relationship is required'),
        isPrimary: z.boolean(),
        createUserAccount: z.boolean().optional().default(false), // Only primary should have this true
      }),
    )
    .min(1, 'At least one parent is required')
    .refine(parents => parents.filter(p => p.isPrimary).length === 1, {
      message: 'Exactly one parent must be marked as primary',
    }),
});

export type CreateStudentWithNewParentsDtoType = z.infer<
  typeof CreateStudentWithNewParentsDto
>;

// ✅ CreateStudentDto for student with existing parents
export const CreateStudentWithExistingParentsDto = z.object({
  user: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    password: z.string().optional(), // Generate if missing
  }),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  additionalMetadata: JsonRecordSchema,
  profile: StudentProfileInput,

  // ✅ Existing parents (primary must exist, others can be new contacts)
  parents: z
    .array(
      z.object({
        email: z.string().email('Parent email is required'),
        relationship: z.string().min(1, 'Relationship is required'),
        isPrimary: z.boolean(),
        fullName: z.string().optional(), // Optional for non-primary parents (new contacts)
      }),
    )
    .min(1, 'At least one parent is required'),
});

export type CreateStudentWithExistingParentsDtoType = z.infer<
  typeof CreateStudentWithExistingParentsDto
>;

// ✅ Legacy DTOs (keeping for backward compatibility if needed)
export const CreateStudentDto = CreateStudentWithNewParentsDto;
export type CreateStudentDtoType = CreateStudentWithNewParentsDtoType;

export const CreateSiblingStudentDto = CreateStudentWithExistingParentsDto;
export type CreateSiblingStudentDtoType =
  CreateStudentWithExistingParentsDtoType;

// ✅ Update DTO
export const UpdateStudentDto = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  rollNumber: z.string().optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  additionalMetadata: JsonRecordSchema,
});

export type UpdateStudentDtoType = z.infer<typeof UpdateStudentDto>;

// ✅ Response DTO for raw student object (without relations)
export const StudentResponseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  classId: z.string(),
  sectionId: z.string(),
  rollNumber: z.string(),
  dob: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  additionalMetadata: JsonRecordSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export type StudentResponseDtoType = z.infer<typeof StudentResponseDto>;

// ✅ Simple DTO for setting primary parent
export const SetPrimaryParentDto = z.object({
  password: z.string().optional(),
});

export type SetPrimaryParentDtoType = z.infer<typeof SetPrimaryParentDto>;
