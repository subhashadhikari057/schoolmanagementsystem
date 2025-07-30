import { z } from 'zod';

// src/modules/teacher/dto/teacher-classes.dto.ts

export const AssignTeacherClassesDto = z.object({
  assignments: z
    .array(
      z.object({
        classId: z.string().uuid({ message: 'Invalid classId' }),
        sectionId: z
          .string()
          .uuid({ message: 'Invalid sectionId' })
          .optional(),
      }),
    )
    .min(1, 'At least one class assignment is required'),
});

export type AssignTeacherClassesDtoType = z.infer<typeof AssignTeacherClassesDto>;


// ✅ Remove a specific class-section assignment from a teacher
export const RemoveTeacherClassDto = z.object({
  classId: z.string().uuid({ message: 'Invalid classId' }),
  sectionId: z.string().uuid({ message: 'Invalid sectionId' }).optional(),
});

export type RemoveTeacherClassDtoType = z.infer<typeof RemoveTeacherClassDto>;
