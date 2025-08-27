import { z } from 'zod';

/**
 * Teacher Leave Request Type Enum
 */
export enum TeacherLeaveRequestType {
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  VACATION = 'VACATION',
  EMERGENCY = 'EMERGENCY',
  MEDICAL = 'MEDICAL',
  FAMILY = 'FAMILY',
  PROFESSIONAL_DEVELOPMENT = 'PROFESSIONAL_DEVELOPMENT',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  OTHER = 'OTHER',
}

/**
 * Teacher Leave Request Status Enum
 */
export enum TeacherLeaveRequestStatus {
  PENDING_ADMINISTRATION = 'PENDING_ADMINISTRATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Create Teacher Leave Request DTO
 */
export interface CreateTeacherLeaveRequestDto {
  title: string;
  description?: string;
  type: TeacherLeaveRequestType;
  startDate: string;
  endDate: string;
  days: number;
}

/**
 * Teacher Leave Request Response DTO
 */
export interface TeacherLeaveRequestDto {
  id: string;
  title: string;
  description?: string;
  type: TeacherLeaveRequestType;
  status: TeacherLeaveRequestStatus;
  startDate: Date;
  endDate: Date;
  days: number;
  teacherId: string;
  adminId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt?: Date;
  teacher?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  admin?: {
    id: string;
    fullName: string;
    email: string;
  };
  attachments?: TeacherLeaveRequestAttachmentDto[];
}

/**
 * Teacher Leave Request Attachment DTO
 */
export interface TeacherLeaveRequestAttachmentDto {
  id: string;
  teacherLeaveRequestId: string;
  teacherId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

/**
 * Admin Action on Teacher Leave Request DTO
 */
export interface AdminTeacherLeaveRequestActionDto {
  status: TeacherLeaveRequestStatus;
  rejectionReason?: string;
}

/**
 * Zod Schemas for Validation
 */
export const CreateTeacherLeaveRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.nativeEnum(TeacherLeaveRequestType),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  days: z.number().int().min(1, 'Days must be at least 1').max(365, 'Days cannot exceed 365'),
});

export const AdminTeacherLeaveRequestActionSchema = z.object({
  status: z.nativeEnum(TeacherLeaveRequestStatus),
  rejectionReason: z.string().max(500, 'Rejection reason too long').optional(),
});

export const TeacherLeaveRequestAttachmentSchema = z.object({
  id: z.string().uuid(),
  teacherLeaveRequestId: z.string().uuid(),
  teacherId: z.string().uuid(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().min(0),
  url: z.string().url(),
  uploadedAt: z.date(),
});
