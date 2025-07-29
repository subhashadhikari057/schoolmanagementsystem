import { z } from 'zod';

// ---------------------------
// CreateClass DTO
// ---------------------------
export const CreateClassDto = z.object({
  name: z.string().min(1, 'Class name is required'), // e.g. "Grade 10"
  section: z.string().min(1).max(10).optional(),     // e.g. "A", "B", or undefined
});

export type CreateClassDtoType = z.infer<typeof CreateClassDto>;

// ---------------------------
// UpdateClass DTO
// ---------------------------
export const UpdateClassDto = z.object({
  name: z.string().min(1).optional(),
  section: z.string().min(1).max(10).optional(),
});

export type UpdateClassDtoType = z.infer<typeof UpdateClassDto>;
