import { BaseClient } from '../../core/BaseClient';
import type { GetAnalysisCacheRequest, GetAnalysisCacheResponse } from './types';

/**
 * Client for interacting with the analysis cache endpoints
 * @since 9.4
 */
export class AnalysisCacheClient extends BaseClient {
  /**
   * Get the scanner's cached data for a branch
   *
   * Requires scan permission on the project.
   * Data is returned gzipped if the corresponding 'Accept-Encoding' header is set in the request.
   *
   * @param params - Request parameters
   * @returns The analysis cache data as an ArrayBuffer
   * @since 9.4
   */
  async get(params: GetAnalysisCacheRequest): Promise<GetAnalysisCacheResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('project', params.project);

    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }

    // Use BaseClient's request method with arrayBuffer response type
    return this.request<ArrayBuffer>(`/api/analysis_cache/get?${searchParams.toString()}`, {
      responseType: 'arrayBuffer',
    });
  }
}
