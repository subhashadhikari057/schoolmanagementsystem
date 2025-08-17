import { z } from 'zod';

export const CreateStudentProfileDto = z.object({
  bio: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
  emergencyContact: z.record(z.any()).optional(),
  interests: z.record(z.any()).optional(),
  additionalData: z.record(z.any()).optional(),
});

export const UpdateStudentProfileDto = z.object({
  bio: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
  emergencyContact: z.record(z.any()).optional(),
  interests: z.record(z.any()).optional(),
  additionalData: z.record(z.any()).optional(),
});

export type CreateStudentProfileDtoType = z.infer<
  typeof CreateStudentProfileDto
>;
export type UpdateStudentProfileDtoType = z.infer<
  typeof UpdateStudentProfileDto
>;
