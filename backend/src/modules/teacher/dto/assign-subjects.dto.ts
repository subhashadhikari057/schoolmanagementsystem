// src/modules/teacher/dto/assign-subjects.dto.ts

import { z } from 'zod';

/**
 * DTO for assigning subjects to a teacher
 */
export const AssignSubjectsDto = z.object({
  subjectIds: z.array(z.string().uuid()).min(1, 'At least one subject ID is required'),
});

export type AssignSubjectsDtoType = z.infer<typeof AssignSubjectsDto>;
