import { z } from 'zod';
import {
  NoticePriority,
  NoticeRecipientType,
  NoticeCategory,
  NoticeStatus,
} from '@prisma/client';

// Create Notice Schema
export const CreateNoticeSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(10000, 'Content must be less than 10000 characters'),
    priority: z.nativeEnum(NoticePriority, {
      errorMap: () => ({ message: 'Invalid priority value' }),
    }),
    recipientType: z.nativeEnum(NoticeRecipientType, {
      errorMap: () => ({ message: 'Invalid recipient type' }),
    }),
    selectedClassId: z.string().uuid().optional(),
    category: z
      .nativeEnum(NoticeCategory, {
        errorMap: () => ({ message: 'Invalid category' }),
      })
      .optional(),
    publishDate: z.coerce.date({
      errorMap: () => ({ message: 'Invalid publish date' }),
    }),
    expiryDate: z.coerce.date({
      errorMap: () => ({ message: 'Invalid expiry date' }),
    }),
    sendEmailNotification: z.boolean().default(false),
    status: z
      .nativeEnum(NoticeStatus, {
        errorMap: () => ({ message: 'Invalid status' }),
      })
      .default('DRAFT'),
    attachments: z.array(z.string()).optional(), // Array of file IDs
  })
  .refine(
    data => {
      if (
        data.recipientType === NoticeRecipientType.CLASS &&
        !data.selectedClassId
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Class ID is required when recipient type is CLASS',
      path: ['selectedClassId'],
    },
  )
  .refine(
    data => {
      return data.expiryDate > data.publishDate;
    },
    {
      message: 'Expiry date must be after publish date',
      path: ['expiryDate'],
    },
  );

// Update Notice Schema
export const UpdateNoticeSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters')
      .optional(),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(10000, 'Content must be less than 10000 characters')
      .optional(),
    priority: z
      .nativeEnum(NoticePriority, {
        errorMap: () => ({ message: 'Invalid priority value' }),
      })
      .optional(),
    recipientType: z
      .nativeEnum(NoticeRecipientType, {
        errorMap: () => ({ message: 'Invalid recipient type' }),
      })
      .optional(),
    selectedClassId: z.string().uuid().optional(),
    category: z
      .nativeEnum(NoticeCategory, {
        errorMap: () => ({ message: 'Invalid category' }),
      })
      .optional(),
    publishDate: z.coerce
      .date({
        errorMap: () => ({ message: 'Invalid publish date' }),
      })
      .optional(),
    expiryDate: z.coerce
      .date({
        errorMap: () => ({ message: 'Invalid expiry date' }),
      })
      .optional(),
    status: z
      .nativeEnum(NoticeStatus, {
        errorMap: () => ({ message: 'Invalid status' }),
      })
      .optional(),
    sendEmailNotification: z.boolean().optional(),
  })
  .refine(
    data => {
      if (
        data.recipientType === NoticeRecipientType.CLASS &&
        !data.selectedClassId
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Class ID is required when recipient type is CLASS',
      path: ['selectedClassId'],
    },
  )
  .refine(
    data => {
      if (data.expiryDate && data.publishDate) {
        return data.expiryDate > data.publishDate;
      }
      return true;
    },
    {
      message: 'Expiry date must be after publish date',
      path: ['expiryDate'],
    },
  );

// Query Schema
export const NoticeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  priority: z.nativeEnum(NoticePriority).optional(),
  recipientType: z.nativeEnum(NoticeRecipientType).optional(),
  category: z.nativeEnum(NoticeCategory).optional(),
  status: z.nativeEnum(NoticeStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Types
export type CreateNoticeDtoType = z.infer<typeof CreateNoticeSchema>;
export type UpdateNoticeDtoType = z.infer<typeof UpdateNoticeSchema>;
export type NoticeQueryDtoType = z.infer<typeof NoticeQuerySchema>;
