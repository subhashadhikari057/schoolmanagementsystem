import { z } from 'zod';

// ✅ Reusable JSON schema
const JsonRecordSchema = z.record(z.any()).optional();

// ✅ Profile schema for create (inline inside CreateStudentDto)
const StudentProfileInput = z.object({
  bio: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
  emergencyContact: JsonRecordSchema,
  interests: JsonRecordSchema,
  additionalData: JsonRecordSchema,
}).optional();

// ✅ CreateStudentDto with embedded profile support
export const CreateStudentDto = z.object({
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
  profile: StudentProfileInput, // ✅ new field

  parents: z.array(
    z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      relationship: z.string().min(1),
      isPrimary: z.boolean(),
    })
  ).min(1, 'At least one parent is required'),
});

export type CreateStudentDtoType = z.infer<typeof CreateStudentDto>;

// ✅ Update DTO
export const UpdateStudentDto = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  rollNumber: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
