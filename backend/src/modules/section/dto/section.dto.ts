// src/modules/section/dto/section.dto.ts

import { z } from 'zod';

// 🆕 Create Section DTO
export const CreateSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  classId: z.string().uuid('Invalid class ID'),
});
export type CreateSectionDtoType = z.infer<typeof CreateSectionSchema>;

// ✏️ Update Section DTO
export const UpdateSectionSchema = z.object({
  name: z.string().min(1).optional(),
});
export type UpdateSectionDtoType = z.infer<typeof UpdateSectionSchema>;
