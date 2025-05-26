/**
 * Request parameters for getting analysis cache
 * @since 9.4
 */
export interface GetAnalysisCacheRequest {
  /**
   * The project key
   */
  project: string;

  /**
   * The branch name. If not provided, the main branch is used.
   */
  branch?: string;
}

/**
 * Response type for analysis cache
 * The response is binary data (can be gzipped based on Accept-Encoding header)
 */
export type GetAnalysisCacheResponse = ArrayBuffer;
