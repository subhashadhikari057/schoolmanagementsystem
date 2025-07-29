import { z } from 'zod';

// ✅ Assign multiple classes to a teacher
export const AssignTeacherClassesDto = z.object({
  classIds: z
    .array(z.string().uuid({ message: 'Each classId must be a valid UUID' }))
    .min(1, 'At least one classId is required'),
});

export type AssignTeacherClassesDtoType = z.infer<typeof AssignTeacherClassesDto>;

// ✅ Remove a single class from a teacher
export const RemoveTeacherClassDto = z.object({
  classId: z.string().uuid({ message: 'Invalid classId' }),
});

export type RemoveTeacherClassDtoType = z.infer<typeof RemoveTeacherClassDto>;

// ✅ (Optional) View assigned classes doesn't need input DTO, it's just a GET
