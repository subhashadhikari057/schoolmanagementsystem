import { z } from 'zod';

export const GetAllStudentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(20),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

export type GetAllStudentsQueryDtoType = z.infer<
  typeof GetAllStudentsQuerySchema
>;
