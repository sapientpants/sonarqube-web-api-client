/**
 * Types for SonarQube Projects API v2
 * @since 10.5
 */

/**
 * Project type in v2 API (replaces qualifier)
 */
export type ProjectTypeV2 = 'PROJECT' | 'PORTFOLIO' | 'APPLICATION';

/**
 * Project visibility
 */
export type ProjectVisibility = 'private' | 'public';

/**
 * Project v2 model
 */
export interface ProjectV2 {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * Project key (same as v1)
   */
  key: string;

  /**
   * Project name
   */
  name: string;

  /**
   * Project type
   */
  type: ProjectTypeV2;

  /**
   * Project visibility
   */
  visibility: ProjectVisibility;

  /**
   * Whether the project is managed by an external system
   */
  managed: boolean;

  /**
   * Last analysis date (ISO 8601)
   */
  lastAnalysisDate?: string;

  /**
   * Number of lines of code
   */
  ncloc?: number;

  /**
   * Tags associated with the project
   */
  tags?: string[];

  /**
   * Whether the project contains AI-generated code
   */
  containsAiCode?: boolean;

  /**
   * Creation date (ISO 8601)
   */
  createdAt: string;

  /**
   * Last modification date (ISO 8601)
   */
  updatedAt: string;
}

/**
 * Request parameters for searching projects (v2)
 */
export interface SearchProjectsV2Request {
  /**
   * Search query (searches in name and key)
   */
  query?: string;

  /**
   * Filter by project types
   */
  types?: ProjectTypeV2[];

  /**
   * Filter by visibility
   */
  visibility?: ProjectVisibility;

  /**
   * Filter by managed status
   */
  managed?: boolean;

  /**
   * Filter projects analyzed after this date (ISO 8601)
   */
  analyzedAfter?: string;

  /**
   * Filter projects analyzed before this date (ISO 8601)
   */
  analyzedBefore?: string;

  /**
   * Filter projects containing AI code
   */
  containsAiCode?: boolean;

  /**
   * Filter by tags
   */
  tags?: string[];

  /**
   * Page number (1-based)
   */
  page?: number;

  /**
   * Page size (max 500)
   */
  pageSize?: number;

  /**
   * Sort field
   */
  sort?: 'name' | 'key' | 'lastAnalysisDate' | 'ncloc';

  /**
   * Sort order
   */
  order?: 'asc' | 'desc';
}

/**
 * Response from project search (v2)
 */
export interface SearchProjectsV2Response {
  /**
   * List of projects
   */
  projects: ProjectV2[];

  /**
   * Pagination information
   */
  page: PageInfoV2;
}

/**
 * Pagination information for v2 APIs
 */
export interface PageInfoV2 {
  /**
   * Current page index (1-based)
   */
  pageIndex: number;

  /**
   * Page size
   */
  pageSize: number;

  /**
   * Total number of items
   */
  total: number;
}

/**
 * Request to create a project (v2)
 */
export interface CreateProjectV2Request {
  /**
   * Project key (unique identifier)
   */
  key: string;

  /**
   * Project name
   */
  name: string;

  /**
   * Project type
   */
  type?: ProjectTypeV2;

  /**
   * Project visibility
   */
  visibility?: ProjectVisibility;

  /**
   * Main branch name
   */
  mainBranch?: string;
}

/**
 * Request to update a project (v2)
 */
export interface UpdateProjectV2Request {
  /**
   * New project name
   */
  name?: string;

  /**
   * New project key
   */
  key?: string;

  /**
   * New visibility
   */
  visibility?: ProjectVisibility;

  /**
   * New tags
   */
  tags?: string[];

  /**
   * Whether project contains AI code
   */
  containsAiCode?: boolean;
}

/**
 * Bulk operations request (v2)
 */
export interface BulkProjectOperationV2Request {
  /**
   * Project IDs to operate on
   */
  projectIds: string[];

  /**
   * Operation to perform
   */
  operation: 'DELETE' | 'UPDATE_VISIBILITY' | 'UPDATE_TAGS';

  /**
   * Operation-specific data
   */
  data?: {
    visibility?: ProjectVisibility;
    tags?: string[];
  };
}

/**
 * Bulk operation response (v2)
 */
export interface BulkProjectOperationV2Response {
  /**
   * Number of successful operations
   */
  successful: number;

  /**
   * Number of failed operations
   */
  failed: number;

  /**
   * Details of failures
   */
  failures?: Array<{
    projectId: string;
    reason: string;
  }>;
}
