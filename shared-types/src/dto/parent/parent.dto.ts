/**
 * =============================================================================
 * Parent DTOs
 * =============================================================================
 * Data Transfer Objects for parent-related operations
 * =============================================================================
 */

import { z } from 'zod';

// ---------------------------
// Parent Profile DTOs
// ---------------------------

export const ParentProfileDto = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
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

export type ParentProfileDtoType = z.infer<typeof ParentProfileDto>;

// ---------------------------
// Parent-Child Link DTOs
// ---------------------------

export const ParentChildLinkDto = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  relationship: z.enum(['father', 'mother', 'guardian', 'stepfather', 'stepmother', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other']),
  isPrimary: z.boolean().default(false),
});

export type ParentChildLinkDtoType = z.infer<typeof ParentChildLinkDto>;

// ---------------------------
// Parent Response DTOs
// ---------------------------

export const ParentResponseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  
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
  children: z.array(z.object({
    id: z.string(),
    studentId: z.string(),
    fullName: z.string(),
    className: z.string().optional(),
    rollNumber: z.string().optional(),
    relationship: z.string(),
    isPrimary: z.boolean(),
  })).optional(),
  
  // Metadata
  profilePhotoUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type ParentResponseDtoType = z.infer<typeof ParentResponseDto>;

// ---------------------------
// Pagination DTOs
// ---------------------------

export const GetAllParentsDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['fullName', 'createdAt', 'occupation']).default('fullName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetAllParentsDtoType = z.infer<typeof GetAllParentsDto>;
