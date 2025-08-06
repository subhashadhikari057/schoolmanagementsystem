/**
 * =============================================================================
 * Subject API Types
 * =============================================================================
 * TypeScript type definitions for subject-related API operations
 * =============================================================================
 */

// ============================================================================
// Subject Response Types
// ============================================================================

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Create Subject Request Types
// ============================================================================

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
}

// ============================================================================
// Update Subject Request Types
// ============================================================================

export interface UpdateSubjectRequest {
  name?: string;
  code?: string;
  description?: string;
}
