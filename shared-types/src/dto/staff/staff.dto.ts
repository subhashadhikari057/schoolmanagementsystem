import { z } from "zod";

// ---------------------------
// Staff Department Enum Schema
// ---------------------------
export const StaffDepartmentSchema = z.enum([
  "administration",
  "finance",
  "hr",
  "maintenance",
  "security",
  "library",
  "canteen",
  "transport",
  "it_support",
  "academic_support",
]);

// ---------------------------
// Staff Employment Status Enum Schema
// ---------------------------
export const StaffEmploymentStatusSchema = z.enum([
  "active",
  "on_leave",
  "resigned",
  "terminated",
]);

// ---------------------------
// Subschema for user creation
// ---------------------------
export const CreateStaffUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  password: z.string().optional(), // Will be auto-generated if not provided
});

// ---------------------------
// Subschema for staff profile creation
// ---------------------------
export const CreateStaffProfileSchema = z.object({
  qualification: z.string().min(1, "Qualification is required"),
  designation: z.string().min(1, "Designation is required"),
  department: StaffDepartmentSchema,
  experienceYears: z.number().min(0).optional(),
  employmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  salary: z.number().positive("Salary must be positive").optional(),
  bio: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
});

// ---------------------------
// CreateStaff DTO
// ---------------------------
export const CreateStaffDto = z.object({
  user: CreateStaffUserSchema,
  profile: CreateStaffProfileSchema,
});

export type CreateStaffDtoType = z.infer<typeof CreateStaffDto>;

// ---------------------------
// UpdateStaffByAdmin DTO
// ---------------------------
export const UpdateStaffByAdminDto = z.object({
  user: z
    .object({
      fullName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
  profile: z
    .object({
      qualification: z.string().optional(),
      designation: z.string().optional(),
      department: StaffDepartmentSchema.optional(),
      experienceYears: z.number().min(0).optional(),
      employmentDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      salary: z.number().positive().optional(),
      employmentStatus: StaffEmploymentStatusSchema.optional(),
      bio: z.string().optional(),
      emergencyContact: z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          relationship: z.string().optional(),
        })
        .optional(),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
      socialLinks: z
        .object({
          linkedin: z.string().url().optional(),
          twitter: z.string().url().optional(),
          website: z.string().url().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type UpdateStaffByAdminDtoType = z.infer<typeof UpdateStaffByAdminDto>;

// ---------------------------
// UpdateStaffSelf DTO (for staff to update their own profile)
// ---------------------------
export const UpdateStaffSelfDto = z.object({
  user: z
    .object({
      fullName: z.string().min(1).optional(),
      phone: z.string().optional(),
    })
    .optional(),
  profile: z
    .object({
      bio: z.string().optional(),
      emergencyContact: z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          relationship: z.string().optional(),
        })
        .optional(),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
      socialLinks: z
        .object({
          linkedin: z.string().url().optional(),
          twitter: z.string().url().optional(),
          website: z.string().url().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type UpdateStaffSelfDtoType = z.infer<typeof UpdateStaffSelfDto>;

// ---------------------------
// GetAllStaff Query DTO
// ---------------------------
export const GetAllStaffDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  department: StaffDepartmentSchema.optional(),
  employmentStatus: StaffEmploymentStatusSchema.optional(),
  sortBy: z
    .enum(["fullName", "employmentDate", "department", "designation"])
    .default("fullName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type GetAllStaffDtoType = z.infer<typeof GetAllStaffDto>;
