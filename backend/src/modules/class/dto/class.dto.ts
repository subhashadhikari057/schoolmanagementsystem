import { z } from 'zod';

// Enum for class shifts
export const ClassShiftEnum = z.enum(['MORNING', 'DAY']);
export type ClassShift = z.infer<typeof ClassShiftEnum>;

// ---------------------------
// CreateClass DTO
// ---------------------------
export const CreateClassDto = z.object({
  name: z.string().min(1, 'Class name is required').optional(), // e.g. "Grade 10 Section A"
  grade: z.number().min(1).max(12, 'Grade must be between 1 and 12'),
  section: z.string().min(1, 'Section is required'), // e.g. "A", "B", "C"
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  shift: ClassShiftEnum.default('MORNING'), // Required shift field
  roomId: z.string().uuid('Invalid room ID'),
  classTeacherId: z.string().uuid('Invalid teacher ID'), // Required class teacher
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
  shift: ClassShiftEnum.optional(),
  roomId: z.string().uuid().optional(),
  classTeacherId: z.string().uuid('Invalid teacher ID').optional(), // Can update class teacher
});

export type UpdateClassDtoType = z.infer<typeof UpdateClassDto>;
