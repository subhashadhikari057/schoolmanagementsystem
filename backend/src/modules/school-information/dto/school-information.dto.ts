/**
 * =============================================================================
 * School Information DTOs
 * =============================================================================
 * DTOs for managing school information settings.
 * Only SUPER_ADMIN can create/update school information.
 * =============================================================================
 */

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const coerceNumber = (schema: z.ZodNumber) =>
  z.preprocess(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    }
    return val;
  }, schema);

const establishedYearSchema = coerceNumber(
  z
    .number()
    .int()
    .min(1800, 'Invalid establishment year')
    .max(
      new Date().getFullYear(),
      'Establishment year cannot be in the future',
    ),
);

const latitudeSchema = coerceNumber(z.number());
const longitudeSchema = coerceNumber(z.number());
const elevationSchema = coerceNumber(z.number());

/**
 * =============================================================================
 * VALIDATION SCHEMAS
 * =============================================================================
 */

export const CreateSchoolInformationSchema = z.object({
  schoolName: z
    .string()
    .min(1, 'School name is required')
    .max(255, 'School name is too long'),
  schoolCode: z
    .string()
    .min(1, 'School code is required')
    .max(50, 'School code is too long'),
  establishedYear: establishedYearSchema,
  address: z
    .string()
    .min(1, 'Address is required')
    .max(1000, 'Address is too long'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  emails: z
    .array(z.string().email('Invalid email format'))
    .optional()
    .default([]),
  contactNumbers: z
    .array(z.string().min(1, 'Contact number cannot be empty'))
    .optional()
    .default([]),
  logo: z.string().optional(),
  // Location & classification
  province: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().optional(),
  ward: z.string().optional(),
  schoolClassification: z.string().optional(),
  schoolType: z.string().optional(),
  schoolTypeNa: z.string().optional(),
  classRegisteredUpto: z.string().optional(),
  seeCode: z.string().optional(),
  hsebCode: z.string().optional(),
  // Contact & finance
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  panNumber: z.string().optional(),
  // Head teacher
  headTeacherName: z.string().optional(),
  headTeacherContactNumber: z.string().optional(),
  headTeacherQualification: z.string().optional(),
  headTeacherGender: z.enum(['Male', 'Female', 'Other']).optional(),
  headTeacherIsTeaching: z.boolean().optional().default(false),
  headTeacherCaste: z.string().optional(),
  // Grants & geography
  grantReceivingFrom: z.string().optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  elevation: elevationSchema.optional(),
  // Levels
  hasEcdLevel: z.boolean().optional().default(false),
  hasBasicLevel1To5: z.boolean().optional().default(false),
  hasBasicLevel6To8: z.boolean().optional().default(false),
  // Approval dates
  ecdApprovalDate: z.union([z.date(), z.string()]).optional(),
  primaryApprovalDate: z.union([z.date(), z.string()]).optional(),
  lowerSecondaryApprovalDate: z.union([z.date(), z.string()]).optional(),
  // Running grades
  runningEcdPpc: z.boolean().optional().default(false),
  runningGrade1: z.boolean().optional().default(false),
  runningGrade2: z.boolean().optional().default(false),
  runningGrade3: z.boolean().optional().default(false),
  runningGrade4: z.boolean().optional().default(false),
  runningGrade5: z.boolean().optional().default(false),
  runningGrade6: z.boolean().optional().default(false),
  runningGrade7: z.boolean().optional().default(false),
  runningGrade8: z.boolean().optional().default(false),
  runningGrade9: z.boolean().optional().default(false),
  runningGrade10: z.boolean().optional().default(false),
  runningGrade11: z.boolean().optional().default(false),
  runningGrade12: z.boolean().optional().default(false),
  // Status & indicators
  scienceSubjectTaughtIn11And12: z.boolean().optional().default(false),
  selectedForModelSchool: z.boolean().optional().default(false),
  complaintHearingMechanism: z.boolean().optional().default(false),
  foreignAffiliation: z.boolean().optional().default(false),
  informalSchool: z.boolean().optional().default(false),
  mobileSchool: z.boolean().optional().default(false),
  openSchool: z.boolean().optional().default(false),
  specialDisabilitySchool: z.boolean().optional().default(false),
  multilingualEducation: z.boolean().optional().default(false),
  mgmlImplemented: z.boolean().optional().default(false),
  residentialScholarshipProgram: z.boolean().optional().default(false),
  zeroPositionGrantBasicSchool: z.boolean().optional().default(false),
  technicalStreamRunning: z.boolean().optional().default(false),
});

export const UpdateSchoolInformationSchema = z.object({
  schoolName: z
    .string()
    .min(1, 'School name is required')
    .max(255, 'School name is too long')
    .optional(),
  schoolCode: z
    .string()
    .min(1, 'School code is required')
    .max(50, 'School code is too long')
    .optional(),
  establishedYear: establishedYearSchema.optional(),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(1000, 'Address is too long')
    .optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  emails: z.array(z.string().email('Invalid email format')).optional(),
  contactNumbers: z
    .array(z.string().min(1, 'Contact number cannot be empty'))
    .optional(),
  logo: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().optional(),
  ward: z.string().optional(),
  schoolClassification: z.string().optional(),
  schoolType: z.string().optional(),
  schoolTypeNa: z.string().optional(),
  classRegisteredUpto: z.string().optional(),
  seeCode: z.string().optional(),
  hsebCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  panNumber: z.string().optional(),
  headTeacherName: z.string().optional(),
  headTeacherContactNumber: z.string().optional(),
  headTeacherQualification: z.string().optional(),
  headTeacherGender: z.enum(['Male', 'Female', 'Other']).optional(),
  headTeacherIsTeaching: z.boolean().optional(),
  headTeacherCaste: z.string().optional(),
  grantReceivingFrom: z.string().optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  elevation: elevationSchema.optional(),
  hasEcdLevel: z.boolean().optional(),
  hasBasicLevel1To5: z.boolean().optional(),
  hasBasicLevel6To8: z.boolean().optional(),
  ecdApprovalDate: z.union([z.date(), z.string()]).optional(),
  primaryApprovalDate: z.union([z.date(), z.string()]).optional(),
  lowerSecondaryApprovalDate: z.union([z.date(), z.string()]).optional(),
  runningEcdPpc: z.boolean().optional(),
  runningGrade1: z.boolean().optional(),
  runningGrade2: z.boolean().optional(),
  runningGrade3: z.boolean().optional(),
  runningGrade4: z.boolean().optional(),
  runningGrade5: z.boolean().optional(),
  runningGrade6: z.boolean().optional(),
  runningGrade7: z.boolean().optional(),
  runningGrade8: z.boolean().optional(),
  runningGrade9: z.boolean().optional(),
  runningGrade10: z.boolean().optional(),
  runningGrade11: z.boolean().optional(),
  runningGrade12: z.boolean().optional(),
  scienceSubjectTaughtIn11And12: z.boolean().optional(),
  selectedForModelSchool: z.boolean().optional(),
  complaintHearingMechanism: z.boolean().optional(),
  foreignAffiliation: z.boolean().optional(),
  informalSchool: z.boolean().optional(),
  mobileSchool: z.boolean().optional(),
  openSchool: z.boolean().optional(),
  specialDisabilitySchool: z.boolean().optional(),
  multilingualEducation: z.boolean().optional(),
  mgmlImplemented: z.boolean().optional(),
  residentialScholarshipProgram: z.boolean().optional(),
  zeroPositionGrantBasicSchool: z.boolean().optional(),
  technicalStreamRunning: z.boolean().optional(),
});

export const SchoolInformationResponseSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  schoolCode: z.string(),
  establishedYear: z.number(),
  address: z.string(),
  website: z.string().nullable(),
  emails: z.array(z.string()),
  contactNumbers: z.array(z.string()),
  logo: z.string().nullable(),
  province: z.string().nullable(),
  district: z.string().nullable(),
  municipality: z.string().nullable(),
  ward: z.string().nullable(),
  schoolClassification: z.string().nullable(),
  schoolType: z.string().nullable(),
  schoolTypeNa: z.string().nullable(),
  classRegisteredUpto: z.string().nullable(),
  seeCode: z.string().nullable(),
  hsebCode: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z.string().nullable(),
  bank: z.string().nullable(),
  accountNumber: z.string().nullable(),
  panNumber: z.string().nullable(),
  headTeacherName: z.string().nullable(),
  headTeacherContactNumber: z.string().nullable(),
  headTeacherQualification: z.string().nullable(),
  headTeacherGender: z.string().nullable(),
  headTeacherIsTeaching: z.boolean(),
  headTeacherCaste: z.string().nullable(),
  grantReceivingFrom: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  elevation: z.number().nullable(),
  hasEcdLevel: z.boolean(),
  hasBasicLevel1To5: z.boolean(),
  hasBasicLevel6To8: z.boolean(),
  ecdApprovalDate: z.date().nullable(),
  primaryApprovalDate: z.date().nullable(),
  lowerSecondaryApprovalDate: z.date().nullable(),
  runningEcdPpc: z.boolean(),
  runningGrade1: z.boolean(),
  runningGrade2: z.boolean(),
  runningGrade3: z.boolean(),
  runningGrade4: z.boolean(),
  runningGrade5: z.boolean(),
  runningGrade6: z.boolean(),
  runningGrade7: z.boolean(),
  runningGrade8: z.boolean(),
  runningGrade9: z.boolean(),
  runningGrade10: z.boolean(),
  runningGrade11: z.boolean(),
  runningGrade12: z.boolean(),
  scienceSubjectTaughtIn11And12: z.boolean(),
  selectedForModelSchool: z.boolean(),
  complaintHearingMechanism: z.boolean(),
  foreignAffiliation: z.boolean(),
  informalSchool: z.boolean(),
  mobileSchool: z.boolean(),
  openSchool: z.boolean(),
  specialDisabilitySchool: z.boolean(),
  multilingualEducation: z.boolean(),
  mgmlImplemented: z.boolean(),
  residentialScholarshipProgram: z.boolean(),
  zeroPositionGrantBasicSchool: z.boolean(),
  technicalStreamRunning: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

/**
 * =============================================================================
 * DTO CLASSES
 * =============================================================================
 */

export class CreateSchoolInformationDto extends createZodDto(
  CreateSchoolInformationSchema,
) {}
export class UpdateSchoolInformationDto extends createZodDto(
  UpdateSchoolInformationSchema,
) {}
export class SchoolInformationResponseDto extends createZodDto(
  SchoolInformationResponseSchema,
) {}

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

export type CreateSchoolInformationDtoType = z.infer<
  typeof CreateSchoolInformationSchema
>;
export type UpdateSchoolInformationDtoType = z.infer<
  typeof UpdateSchoolInformationSchema
>;
export type SchoolInformationResponseDtoType = z.infer<
  typeof SchoolInformationResponseSchema
>;
