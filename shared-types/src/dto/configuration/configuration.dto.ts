/**
 * =============================================================================
 * Configuration DTOs
 * =============================================================================
 * Data Transfer Objects for system configuration and settings.
 * =============================================================================
 */

import { z } from 'zod';
import { BaseEntity } from '../common/base.dto';

/**
 * Configuration value type
 */
export type ConfigValue = string | number | boolean | object;

/**
 * Configuration DTO
 */
export interface ConfigurationDto extends BaseEntity {
  /** Configuration key */
  key: string;
  /** Configuration value */
  value: ConfigValue;
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'object';
  /** Description */
  description?: string;
  /** Is editable by admin */
  is_editable: boolean;
  /** Category */
  category?: string;
}

/**
 * Create configuration DTO
 */
export interface CreateConfigurationDto {
  /** Configuration key */
  key: string;
  /** Configuration value */
  value: ConfigValue;
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'object';
  /** Description */
  description?: string;
  /** Is editable by admin */
  is_editable?: boolean;
  /** Category */
  category?: string;
}

/**
 * Update configuration DTO
 */
export interface UpdateConfigurationDto {
  /** Configuration value */
  value?: ConfigValue;
  /** Description */
  description?: string;
  /** Is editable by admin */
  is_editable?: boolean;
  /** Category */
  category?: string;
}

/**
 * Zod schemas
 */
export const ConfigurationTypeSchema = z.enum(['string', 'number', 'boolean', 'object']);

export const CreateConfigurationSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})]),
  type: ConfigurationTypeSchema,
  description: z.string().optional(),
  is_editable: z.boolean().default(true),
  category: z.string().optional(),
});

export const UpdateConfigurationSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})]).optional(),
  description: z.string().optional(),
  is_editable: z.boolean().optional(),
  category: z.string().optional(),
});

/**
 * Type inference
 */
export type CreateConfigurationType = z.infer<typeof CreateConfigurationSchema>;
export type UpdateConfigurationType = z.infer<typeof UpdateConfigurationSchema>;