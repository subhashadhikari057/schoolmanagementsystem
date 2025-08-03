/**
 * =============================================================================
 * Forum DTOs
 * =============================================================================
 * Data Transfer Objects for forum posts and discussions.
 * =============================================================================
 */

import { z } from 'zod';
import { BaseEntity } from '../common/base.dto';
import { ForumPostStatus } from '../../enums/forum/post-status.enum';
import { ModerationStatus } from '../../enums/forum/moderation-status.enum';

/**
 * Forum post DTO
 */
export interface ForumPostDto extends BaseEntity {
  /** Post title */
  title: string;
  /** Post content */
  content: string;
  /** Author user ID */
  author_id: string;
  /** Post status */
  status: ForumPostStatus;
  /** Moderation status */
  moderation_status: ModerationStatus;
  /** Category or topic */
  category?: string;
  /** Tags */
  tags?: string[];
  /** Like count */
  likes_count: number;
  /** Reply count */
  replies_count: number;
}

/**
 * Create forum post DTO
 */
export interface CreateForumPostDto {
  /** Post title */
  title: string;
  /** Post content */
  content: string;
  /** Category or topic */
  category?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Update forum post DTO
 */
export interface UpdateForumPostDto {
  /** Post title */
  title?: string;
  /** Post content */
  content?: string;
  /** Post status */
  status?: ForumPostStatus;
  /** Category or topic */
  category?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Zod schemas
 */
export const CreateForumPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateForumPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(ForumPostStatus).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Type inference
 */
export type CreateForumPostType = z.infer<typeof CreateForumPostSchema>;
export type UpdateForumPostType = z.infer<typeof UpdateForumPostSchema>;