/**
 * =============================================================================
 * API Response Interface
 * =============================================================================
 * Standard response structure for all API endpoints.
 * =============================================================================
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  
  /** Response data (if successful) */
  data?: T;
  
  /** Error message (if unsuccessful) */
  message?: string;
  
  /** HTTP status code */
  statusCode: number;
  
  /** Error code for client handling */
  code?: string;
  
  /** Request trace ID for debugging */
  traceId?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** HTTP status code */
  statusCode: number;
  
  /** Error type */
  error: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Machine-readable error code */
  code?: string;
  
  /** Request trace ID */
  traceId?: string;
}