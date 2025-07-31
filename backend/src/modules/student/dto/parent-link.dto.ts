import { z } from 'zod';

export const CreateParentLinkDto = z.object({
  parentId: z.string().uuid({ message: 'Invalid parent ID' }),
  relationship: z.string().min(1, 'Relationship is required'),
  isPrimary: z.boolean().optional().default(false),
});

export type CreateParentLinkDtoType = z.infer<typeof CreateParentLinkDto>;


export const UpdateParentLinkDto = z.object({
    isPrimary: z.boolean(),
  });
  
  export type UpdateParentLinkDtoType = z.infer<typeof UpdateParentLinkDto>;

  
  export const UnlinkParentDto = z.object({
    parentId: z.string().uuid({ message: 'Invalid parent ID' }),
  });
  
  export type UnlinkParentDtoType = z.infer<typeof UnlinkParentDto>;
  