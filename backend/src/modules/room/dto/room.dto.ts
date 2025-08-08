import { z } from 'zod';

/**
 * Create Room DTO Schema
 */
export const CreateRoomDto = z.object({
  roomNo: z.string().min(1, 'Room number is required'),
  name: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').default(30),
  floor: z.number().min(1, 'Floor must be at least 1').default(1),
  building: z.string().optional(),
  note: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export type CreateRoomDtoType = z.infer<typeof CreateRoomDto>;

/**
 * Update Room DTO Schema
 */
export const UpdateRoomDto = z.object({
  roomNo: z.string().min(1, 'Room number is required').optional(),
  name: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  floor: z.number().min(1, 'Floor must be at least 1').optional(),
  building: z.string().optional(),
  note: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export type UpdateRoomDtoType = z.infer<typeof UpdateRoomDto>;

/**
 * Room Query DTO Schema
 */
export const RoomQueryDto = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
  floor: z.number().optional(),
  building: z.string().optional(),
  isAvailable: z.boolean().optional(),
  search: z.string().optional(), // Search by room number or name
});

export type RoomQueryDtoType = z.infer<typeof RoomQueryDto>;
