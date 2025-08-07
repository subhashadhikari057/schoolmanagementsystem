import { z } from 'zod';

// ✅ Reusable JSON schema
const JsonRecordSchema = z.record(z.any()).optional();

// ✅ Profile schema for create (inline inside CreateStudentDto)
const StudentProfileInput = z
  .object({
    emergencyContact: JsonRecordSchema,
    interests: JsonRecordSchema,
    additionalData: JsonRecordSchema,
    profilePhotoUrl: z.string().url().optional(),
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
  rollNumber: z.string().min(1),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  email: z.string().email('Student email is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  imageUrl: z.string().url().optional(),

  // Parent information
  fatherName: z.string().min(1, 'Father name is required'),
  motherName: z.string().min(1, 'Mother name is required'),
  fatherPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherEmail: z.string().email('Father email is required'),
  motherEmail: z.string().email('Mother email is required'),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),

  // Address
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
    })
    .optional(),

  // Guardians
  guardians: z
    .array(
      z.object({
        fullName: z.string().min(1, 'Guardian name is required'),
        phone: z.string().min(1, 'Guardian phone is required'),
        email: z.string().email('Guardian email is required'),
        relation: z.string().min(1, 'Guardian relation is required'),
      }),
    )
    .optional(),

  // Profile
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
  rollNumber: z.string().min(1),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  email: z.string().email('Student email is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  imageUrl: z.string().url().optional(),

  // Parent information
  fatherName: z.string().min(1, 'Father name is required'),
  motherName: z.string().min(1, 'Mother name is required'),
  fatherPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherEmail: z.string().email('Father email is required'),
  motherEmail: z.string().email('Mother email is required'),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),

  // Address
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
    })
    .optional(),

  // Guardians
  guardians: z
    .array(
      z.object({
        fullName: z.string().min(1, 'Guardian name is required'),
        phone: z.string().min(1, 'Guardian phone is required'),
        email: z.string().email('Guardian email is required'),
        relation: z.string().min(1, 'Guardian relation is required'),
      }),
    )
    .optional(),

  // Profile
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

// ✅ Alias for sibling creation (same as existing parents)
export const CreateSiblingStudentDto = CreateStudentWithExistingParentsDto;
export type CreateSiblingStudentDtoType =
  CreateStudentWithExistingParentsDtoType;

// ✅ Update DTO
export const UpdateStudentDto = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  classId: z.string().uuid().optional(),
  rollNumber: z.string().optional(),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.string().optional(),
  imageUrl: z.string().url().optional(),

  // Parent information
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherEmail: z.string().email().optional(),
  motherEmail: z.string().email().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),

  // Address
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
    })
    .optional(),
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
  rollNumber: z.string(),
  admissionDate: z.string(),
  dob: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  imageUrl: z.string().url().optional(),

  // Parent information
  fatherName: z.string(),
  motherName: z.string(),
  fatherPhone: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherEmail: z.string(),
  motherEmail: z.string(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),

  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export type StudentResponseDtoType = z.infer<typeof StudentResponseDto>;

// ✅ Set Primary Parent DTO
export const SetPrimaryParentDto = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
});

export type SetPrimaryParentDtoType = z.infer<typeof SetPrimaryParentDto>;

// ✅ Student Profile DTO
export const UpsertStudentProfileDto = z.object({
  emergencyContact: JsonRecordSchema,
  interests: JsonRecordSchema,
  additionalData: JsonRecordSchema,
  profilePhotoUrl: z.string().url().optional(),
});

export type UpsertStudentProfileDtoType = z.infer<
  typeof UpsertStudentProfileDto
>;

// ✅ Student Query DTO
export const StudentQueryDto = z.object({
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

export type StudentQueryDtoType = z.infer<typeof StudentQueryDto>;

// ✅ Generic CreateStudentDto (defaults to new parents)
export const CreateStudentDto = CreateStudentWithNewParentsDto;
export type CreateStudentDtoType = CreateStudentWithNewParentsDtoType;
