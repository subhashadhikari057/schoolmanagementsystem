import { z } from 'zod';

// Schema for creating a subject
export const CreateSubjectDto = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  maxMarks: z.number().min(1, 'Max marks must be at least 1').optional(),
  passMarks: z.number().min(1, 'Pass marks must be at least 1').optional(),
});

export type CreateSubjectDtoType = z.infer<typeof CreateSubjectDto>;

// Schema for updating a subject
export const UpdateSubjectDto = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  maxMarks: z.number().min(1).optional(),
  passMarks: z.number().min(1).optional(),
});

export type UpdateSubjectDtoType = z.infer<typeof UpdateSubjectDto>;
