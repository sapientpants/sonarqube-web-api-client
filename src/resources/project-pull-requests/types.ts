/**
 * Request parameters for listing pull requests of a project
 * @since 7.1
 */
export interface ListPullRequestsRequest {
  /**
   * Project key
   * @example "my_project"
   */
  project: string;
}

/**
 * Pull request information
 */
export interface PullRequest {
  /**
   * Pull request ID
   * @example "1543"
   */
  key: string;

  /**
   * Pull request title
   */
  title: string;

  /**
   * Branch name
   */
  branch: string;

  /**
   * Base branch
   */
  base: string;

  /**
   * Pull request status
   */
  status: {
    /**
     * Quality gate status
     */
    qualityGateStatus?: 'OK' | 'WARN' | 'ERROR' | 'NONE';

    /**
     * Number of bugs
     */
    bugs?: number;

    /**
     * Number of vulnerabilities
     */
    vulnerabilities?: number;

    /**
     * Number of code smells
     */
    codeSmells?: number;
  };

  /**
   * Analysis date
   */
  analysisDate?: string;

  /**
   * Target branch
   */
  target?: string;

  /**
   * Pull request UUID (v1 format)
   * @since 2025.4
   */
  pullRequestUuidV1?: string;

  /**
   * Pull request ID
   * @since 2025.4
   */
  pullRequestId?: string;
}

/**
 * Response from listing pull requests
 */
export interface ListPullRequestsResponse {
  /**
   * List of pull requests
   */
  pullRequests: PullRequest[];
}

/**
 * Request parameters for deleting a pull request
 * @since 7.1
 */
export interface DeletePullRequestRequest {
  /**
   * Project key
   * @example "my_project"
   */
  project: string;

  /**
   * Pull request id
   * @example "1543"
   */
  pullRequest: string;
}
