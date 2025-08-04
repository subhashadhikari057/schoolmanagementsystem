/**
 * =============================================================================
 * API Type Definitions (Legacy)
 * =============================================================================
 * Re-exports from the new API structure for backward compatibility
 * @deprecated Use @/api/types instead
 * =============================================================================
 */

// Re-export common types from the new API structure
export * from '@/api/types/common';
export * from '@/api/types/auth';

// Legacy interfaces for backward compatibility
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadConfig {
  onProgress?: (progress: UploadProgress) => void;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}
