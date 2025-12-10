/**
 * =============================================================================
 * Student Validation Schemas
 * =============================================================================
 * Centralized Zod schemas for student management functionality.
 * Based on API Contract: /api/v1/students
 * =============================================================================
 */

import { z } from "zod";
import {
  CommonValidation,
  BaseEntitySchema,
  MetadataSchema,
  PaginationRequestSchema,
  createPaginatedResponseSchema,
} from "../common/base.schemas";

import { UserStatus } from "../../enums/core/user-status.enum";

/**
 * =============================================================================
 * ENUM SCHEMAS
 * =============================================================================
 */

/**
 * Gender enum schema
 */
export const GenderSchema = z.enum(["male", "female", "other"]).refine((val) => ["male", "female", "other"].includes(val), {
  message: "Gender must be male, female, or other",
});

/**
 * =============================================================================
 * USER CREATION SCHEMAS
 * =============================================================================
 */

/**
 * Student user creation schema
 */
export const CreateStudentUserSchema = z.object({
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  password: CommonValidation.password,
});

/**
 * =============================================================================
 * STUDENT ENTITY SCHEMAS
 * =============================================================================
 */

/**
 * Create student request schema
 */
export const CreateStudentRequestSchema = z.object({
  user: CreateStudentUserSchema,
  class_id: CommonValidation.uuid.describe("Class ID"),
  section_id: CommonValidation.uuid.describe("Section ID"),
  roll_number: z
    .string()
    .min(1, "Roll number is required")
    .max(20, "Roll number must be less than 20 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Roll number can only contain uppercase letters, numbers, and hyphens",
    ),
  dob: CommonValidation.dateString,
  gender: GenderSchema,
  guardian_name: CommonValidation.name.optional(),
  guardian_phone: CommonValidation.phone.optional(),
  guardian_email: CommonValidation.email.optional(),
  address: z
    .object({
      street: z.string().max(255, "Street address too long").optional(),
      city: z.string().max(100, "City name too long").optional(),
      state: z.string().max(100, "State name too long").optional(),
      postal_code: z.string().max(20, "Postal code too long").optional(),
      country: z.string().max(100, "Country name too long").optional(),
    })
    .optional(),
  emergency_contact: z
    .object({
      name: CommonValidation.name,
      phone: CommonValidation.phone,
      relationship: z.string().max(50, "Relationship too long"),
    })
    .optional(),
  medical_info: z
    .object({
      blood_group: z.string().max(10, "Blood group too long").optional(),
      allergies: z
        .string()
        .max(500, "Allergies description too long")
        .optional(),
      medications: z
        .string()
        .max(500, "Medications description too long")
        .optional(),
      medical_conditions: z
        .string()
        .max(500, "Medical conditions description too long")
        .optional(),
    })
    .optional(),
  additional_metadata: MetadataSchema,
});

/**
 * Student response schema
 */
export const StudentResponseSchema = BaseEntitySchema.extend({
  user_id: CommonValidation.uuid,
  full_name: CommonValidation.name,
  email: CommonValidation.email,
  phone: CommonValidation.phone.optional(),
  status: z.nativeEnum(UserStatus),
  class_id: CommonValidation.uuid,
  section_id: CommonValidation.uuid,
  roll_number: z.string(),
  dob: CommonValidation.dateString,
  gender: GenderSchema,
  guardian_name: CommonValidation.name.optional(),
  guardian_phone: CommonValidation.phone.optional(),
  guardian_email: CommonValidation.email.optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  emergency_contact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  medical_info: z
    .object({
      blood_group: z.string().optional(),
      allergies: z.string().optional(),
      medications: z.string().optional(),
      medical_conditions: z.string().optional(),
    })
    .optional(),
  marks_obtained: z.number().min(0).max(100).optional(),
  attendance_percentage: z.number().min(0).max(100).optional(),
  additional_metadata: MetadataSchema,
});

/**
 * Update student request schema
 */
export const UpdateStudentRequestSchema = z.object({
  full_name: CommonValidation.name.optional(),
  phone: CommonValidation.phone.optional(),
  class_id: CommonValidation.uuid.optional(),
  section_id: CommonValidation.uuid.optional(),
  roll_number: z
    .string()
    .min(1)
    .max(20)
    .regex(
      /^[A-Z0-9-]+$/,
      "Roll number can only contain uppercase letters, numbers, and hyphens",
    )
    .optional(),
  dob: CommonValidation.dateString.optional(),
  gender: GenderSchema.optional(),
  guardian_name: CommonValidation.name.optional(),
  guardian_phone: CommonValidation.phone.optional(),
  guardian_email: CommonValidation.email.optional(),
  address: z
    .object({
      street: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    })
    .optional(),
  emergency_contact: z
    .object({
      name: CommonValidation.name,
      phone: CommonValidation.phone,
      relationship: z.string().max(50),
    })
    .optional(),
  medical_info: z
    .object({
      blood_group: z.string().max(10).optional(),
      allergies: z.string().max(500).optional(),
      medications: z.string().max(500).optional(),
      medical_conditions: z.string().max(500).optional(),
    })
    .optional(),
  additional_metadata: MetadataSchema,
});

/**
 * =============================================================================
 * SEARCH AND FILTER SCHEMAS
 * =============================================================================
 */

/**
 * Search students request schema
 */
export const SearchStudentsRequestSchema = PaginationRequestSchema.extend({
  full_name: z.string().optional(),
  class_id: CommonValidation.uuid.optional(),
  section_id: CommonValidation.uuid.optional(),
  roll_number: z.string().optional(),
  gender: GenderSchema.optional(),
  status: z.nativeEnum(UserStatus).optional(),
  dob_from: CommonValidation.dateString.optional(),
  dob_to: CommonValidation.dateString.optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  has_medical_conditions: z.boolean().optional(),
  attendance_min: z.number().min(0).max(100).optional(),
  attendance_max: z.number().min(0).max(100).optional(),
  marks_min: z.number().min(0).max(100).optional(),
  marks_max: z.number().min(0).max(100).optional(),
});

/**
 * Student list filters schema
 */
export const StudentFiltersSchema = z.object({
  class_ids: z.array(CommonValidation.uuid).optional(),
  section_ids: z.array(CommonValidation.uuid).optional(),
  genders: z.array(GenderSchema).optional(),
  statuses: z.array(z.nativeEnum(UserStatus)).optional(),
  age_min: z.number().int().min(5).max(25).optional(),
  age_max: z.number().int().min(5).max(25).optional(),
  has_guardian_contact: z.boolean().optional(),
  has_emergency_contact: z.boolean().optional(),
  has_medical_info: z.boolean().optional(),
});

/**
 * =============================================================================
 * RESPONSE SCHEMAS
 * =============================================================================
 */

/**
 * Paginated students response schema
 */
export const PaginatedStudentsResponseSchema = createPaginatedResponseSchema(
  StudentResponseSchema,
);

/**
 * Student profile response schema (detailed view)
 */
export const StudentProfileResponseSchema = StudentResponseSchema.extend({
  class_name: z.string().optional(),
  section_name: z.string().optional(),
  subjects: z
    .array(
      z.object({
        id: CommonValidation.uuid,
        name: z.string(),
        code: z.string(),
        teacher_name: z.string().optional(),
      }),
    )
    .optional(),
  recent_attendance: z
    .array(
      z.object({
        date: z.date(),
        status: z.string(),
        remarks: z.string().optional(),
      }),
    )
    .optional(),
  recent_assignments: z
    .array(
      z.object({
        id: CommonValidation.uuid,
        title: z.string(),
        due_date: z.date(),
        status: z.string(),
        marks: z.number().optional(),
      }),
    )
    .optional(),
  parent_contacts: z
    .array(
      z.object({
        id: CommonValidation.uuid,
        full_name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        relationship: z.string(),
      }),
    )
    .optional(),
});

/**
 * =============================================================================
 * BULK OPERATIONS SCHEMAS
 * =============================================================================
 */

/**
 * Bulk create students schema
 */
export const BulkCreateStudentsSchema = z.object({
  students: z
    .array(CreateStudentRequestSchema)
    .min(1, "At least one student is required")
    .max(100, "Cannot create more than 100 students at once"),
  skip_duplicates: z.boolean().default(false),
  send_welcome_emails: z.boolean().default(true),
});

/**
 * Bulk update students schema
 */
export const BulkUpdateStudentsSchema = z.object({
  student_ids: z
    .array(CommonValidation.uuid)
    .min(1, "At least one student ID is required")
    .max(100, "Cannot update more than 100 students at once"),
  updates: UpdateStudentRequestSchema,
});

/**
 * Bulk delete students schema
 */
export const BulkDeleteStudentsSchema = z.object({
  student_ids: z
    .array(CommonValidation.uuid)
    .min(1, "At least one student ID is required")
    .max(100, "Cannot delete more than 100 students at once"),
  permanent: z.boolean().default(false),
  reason: z.string().max(500, "Reason too long").optional(),
});

/**
 * =============================================================================
 * STUDENT TRANSFER SCHEMAS
 * =============================================================================
 */

/**
 * Transfer student schema
 */
export const TransferStudentSchema = z.object({
  student_id: CommonValidation.uuid,
  from_class_id: CommonValidation.uuid,
  from_section_id: CommonValidation.uuid,
  to_class_id: CommonValidation.uuid,
  to_section_id: CommonValidation.uuid,
  effective_date: CommonValidation.dateString,
  reason: z.string().max(500, "Reason too long"),
  transfer_records: z.boolean().default(true),
  notify_parents: z.boolean().default(true),
});

/**
 * =============================================================================
 * STUDENT PROMOTION SCHEMAS
 * =============================================================================
 */

/**
 * Promote student schema
 */
export const PromoteStudentSchema = z.object({
  student_id: CommonValidation.uuid,
  to_class_id: CommonValidation.uuid,
  to_section_id: CommonValidation.uuid,
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format"),
  promotion_date: CommonValidation.dateString,
  final_marks: z.number().min(0).max(100).optional(),
  final_grade: z.string().max(5).optional(),
  remarks: z.string().max(500).optional(),
});

/**
 * Bulk promotion schema
 */
export const BulkPromoteStudentsSchema = z.object({
  student_ids: z
    .array(CommonValidation.uuid)
    .min(1, "At least one student ID is required")
    .max(200, "Cannot promote more than 200 students at once"),
  to_class_id: CommonValidation.uuid,
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format"),
  promotion_date: CommonValidation.dateString,
  auto_assign_sections: z.boolean().default(true),
});

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

// Basic types
export type Gender = z.infer<typeof GenderSchema>;
export type CreateStudentUser = z.infer<typeof CreateStudentUserSchema>;

// Request types
export type CreateStudentRequest = z.infer<typeof CreateStudentRequestSchema>;
export type UpdateStudentRequest = z.infer<typeof UpdateStudentRequestSchema>;
export type SearchStudentsRequest = z.infer<typeof SearchStudentsRequestSchema>;
export type StudentFilters = z.infer<typeof StudentFiltersSchema>;

// Response types
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
export type PaginatedStudentsResponse = z.infer<
  typeof PaginatedStudentsResponseSchema
>;
export type StudentProfileResponse = z.infer<
  typeof StudentProfileResponseSchema
>;

// Bulk operation types
export type BulkCreateStudents = z.infer<typeof BulkCreateStudentsSchema>;
export type BulkUpdateStudents = z.infer<typeof BulkUpdateStudentsSchema>;
export type BulkDeleteStudents = z.infer<typeof BulkDeleteStudentsSchema>;

// Transfer and promotion types
export type TransferStudent = z.infer<typeof TransferStudentSchema>;
export type PromoteStudent = z.infer<typeof PromoteStudentSchema>;
export type BulkPromoteStudents = z.infer<typeof BulkPromoteStudentsSchema>;
