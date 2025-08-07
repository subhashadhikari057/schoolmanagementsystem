import { z } from 'zod';

// Schema for creating a subject
export const CreateSubjectDto = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  maxMarks: z.number().min(1, 'Max marks must be at least 1').optional(),
  passMarks: z.number().min(1, 'Pass marks must be at least 1').optional(),
  classAssignments: z
    .array(
      z.object({
        classId: z.string().uuid('Invalid class ID'),
        teacherId: z.string().uuid('Invalid teacher ID').optional(), // Optional - can assign later
      }),
    )
    .optional(), // Optional - can create subject without class assignments
  teacherIds: z.array(z.string().uuid('Invalid teacher ID')).optional(), // Optional - for general teacher-subject assignments
});

export type CreateSubjectDtoType = z.infer<typeof CreateSubjectDto>;

// Schema for updating a subject (includes assignments)
export const UpdateSubjectDto = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  maxMarks: z.number().min(1).optional(),
  passMarks: z.number().min(1).optional(),
  classAssignments: z
    .array(
      z.object({
        classId: z.string().uuid('Invalid class ID'),
        teacherId: z.string().uuid('Invalid teacher ID').optional(),
      }),
    )
    .optional(), // Can update class assignments
  teacherIds: z.array(z.string().uuid('Invalid teacher ID')).optional(), // Optional - for general teacher-subject assignments
});

// Schema for updating only basic subject fields (for Prisma update)
export const UpdateSubjectFieldsDto = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  maxMarks: z.number().min(1).optional(),
  passMarks: z.number().min(1).optional(),
});

export type UpdateSubjectDtoType = z.infer<typeof UpdateSubjectDto>;
export type UpdateSubjectFieldsDtoType = z.infer<typeof UpdateSubjectFieldsDto>;
