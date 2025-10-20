/**
 * Common types and interfaces for SonarQube Web API v2
 * These types are shared across all v2 API implementations
 * @since 10.4
 */

import type { PrimitiveValue } from './primitive.js';

/**
 * Base interface for all v2 resources
 * Most v2 resources include these standard fields
 */
export interface V2Resource {
  /**
   * Unique identifier (UUID format)
   */
  id: string;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

/**
 * Standard pagination information for v2 APIs
 * All v2 list endpoints return this structure
 */
export interface V2PageInfo {
  /**
   * Current page number (1-based)
   */
  pageIndex: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of items across all pages
   */
  total: number;
}

/**
 * Standard paginated response wrapper
 * Used by all v2 search/list endpoints
 */
export interface V2PaginatedResponse<T> {
  /**
   * Page of results
   */
  data: T[];

  /**
   * Pagination metadata
   */
  page: V2PageInfo;
}

/**
 * Standard error response format for v2 APIs
 * All v2 errors follow this structure
 */
export interface V2ErrorResponse {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * Error details
   */
  error: {
    /**
     * Human-readable error message
     */
    message: string;

    /**
     * Machine-readable error code
     */
    code: string;

    /**
     * Additional error context
     */
    details?: Record<string, unknown>;

    /**
     * Field-level validation errors
     */
    validations?: Array<{
      field: string;
      message: string;
      code?: string;
    }>;

    /**
     * Retry after (for rate limits)
     */
    retryAfter?: number;

    /**
     * Resource identifier (for 404s)
     */
    resource?: string;
  };
}

/**
 * Common query parameters for v2 search endpoints
 */
export interface V2SearchParams {
  /**
   * Page number (1-based)
   */
  page?: number;

  /**
   * Page size (typically max 500)
   */
  pageSize?: number;

  /**
   * Sort field
   */
  sort?: string;

  /**
   * Sort order
   */
  order?: 'asc' | 'desc';
}

/**
 * Common fields for v2 audit/tracking
 */
export interface V2AuditFields {
  /**
   * User who created the resource
   */
  createdBy?: string;

  /**
   * User who last updated the resource
   */
  updatedBy?: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * Standard v2 response for single resource retrieval
 */
export interface V2SingleResponse<T> {
  /**
   * The requested resource
   */
  data: T;
}

/**
 * Standard v2 response for resource creation
 */
export interface V2CreateResponse<T> {
  /**
   * The created resource
   */
  data: T;

  /**
   * Location header value (URI of created resource)
   */
  location?: string;
}

/**
 * Standard v2 response for resource update
 */
export interface V2UpdateResponse<T> {
  /**
   * The updated resource
   */
  data: T;
}

/**
 * Standard v2 response for bulk operations
 */
export interface V2BulkOperationResponse {
  /**
   * Number of successful operations
   */
  successful: number;

  /**
   * Number of failed operations
   */
  failed: number;

  /**
   * Total number of operations attempted
   */
  total: number;

  /**
   * Details of failures
   */
  failures?: Array<{
    /**
     * Resource identifier
     */
    id: string;

    /**
     * Failure reason
     */
    reason: string;

    /**
     * Error code
     */
    code?: string;
  }>;
}

/**
 * Common filter operators for v2 APIs
 */
export type V2FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';

/**
 * Filter definition for v2 APIs
 */
export interface V2Filter {
  /**
   * Field to filter on
   */
  field: string;

  /**
   * Filter operator
   */
  operator: V2FilterOperator;

  /**
   * Filter value(s)
   */
  value: PrimitiveValue | string[];
}

/**
 * Expandable fields specification
 * Some v2 APIs support expanding related resources
 */
export interface V2ExpandOptions {
  /**
   * Fields to expand
   */
  expand?: string[];

  /**
   * Fields to include (sparse fieldsets)
   */
  fields?: string[];
}
