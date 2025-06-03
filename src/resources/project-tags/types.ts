/**
 * Types for the SonarQube Project Tags API
 */

/**
 * Parameters for searching project tags
 */
export interface SearchTagsParams {
  /**
   * Project key (optional for global tag search)
   */
  project?: string;

  /**
   * Page size. Must be greater than 0 and less or equal than 100
   * @default 10
   * @maximum 100
   */
  ps?: number;

  /**
   * Limit search to tags that contain the supplied string
   */
  q?: string;
}

/**
 * Response from the search tags endpoint
 */
export interface SearchTagsResponse {
  /**
   * List of tags
   */
  tags: string[];
}

/**
 * Parameters for setting tags on a project
 */
export interface SetProjectTagsParams {
  /**
   * Project key
   */
  project: string;

  /**
   * Comma-separated list of tags
   */
  tags: string;
}
