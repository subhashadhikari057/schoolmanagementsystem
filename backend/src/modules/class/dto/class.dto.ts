import { z } from 'zod';

// ---------------------------
// CreateClass DTO
// ---------------------------
export const CreateClassDto = z.object({
  name: z.string().min(1, 'Class name is required').optional(), // e.g. "Grade 10"
  grade: z.number().min(1).max(12, 'Grade must be between 1 and 12'),
  section: z.string().min(1, 'Section is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  roomId: z.string().uuid('Invalid room ID'),
});

export type CreateClassDtoType = z.infer<typeof CreateClassDto>;

// ---------------------------
// UpdateClass DTO
// ---------------------------
export const UpdateClassDto = z.object({
  name: z.string().min(1).optional(),
  grade: z.number().min(1).max(12).optional(),
  section: z.string().min(1).optional(),
  capacity: z.number().min(1).optional(),
  roomId: z.string().uuid().optional(),
});

export type UpdateClassDtoType = z.infer<typeof UpdateClassDto>;
