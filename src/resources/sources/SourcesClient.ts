import { BaseClient } from '../../core/BaseClient.js';
import type {
  GetRawSourceRequest,
  GetScmInfoRequest,
  GetScmInfoResponse,
  ShowSourceRequest,
  ShowSourceResponse,
} from './types.js';

/**
 * Client for interacting with source code endpoints
 */
export class SourcesClient extends BaseClient {
  /**
   * Get source code as raw text
   *
   * Requires 'See Source Code' permission on file
   *
   * @param params - Request parameters
   * @returns The raw source code as a string
   */
  async raw(params: GetRawSourceRequest): Promise<string> {
    const searchParams = new URLSearchParams();
    searchParams.append('key', params.key);

    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }

    if (params.pullRequest !== undefined) {
      searchParams.append('pullRequest', params.pullRequest);
    }

    return this.request<string>(`/api/sources/raw?${searchParams.toString()}`, {
      responseType: 'text',
    });
  }

  /**
   * Get SCM information of source files
   *
   * Requires 'See Source Code' permission on file's project
   *
   * Each element of the result array is composed of:
   * - Line number
   * - Author of the commit
   * - Datetime of the commit
   * - Revision of the commit
   *
   * @param params - Request parameters
   * @returns SCM information for the requested lines
   */
  async scm(params: GetScmInfoRequest): Promise<GetScmInfoResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('key', params.key);

    if (params.commitsByLine !== undefined) {
      searchParams.append('commits_by_line', String(params.commitsByLine));
    }

    if (params.from !== undefined) {
      searchParams.append('from', String(params.from));
    }

    if (params.to !== undefined) {
      searchParams.append('to', String(params.to));
    }

    return this.request<GetScmInfoResponse>(`/api/sources/scm?${searchParams.toString()}`);
  }

  /**
   * Get source code with line numbers
   *
   * Requires 'See Source Code' permission on file's project, or organization membership on public projects
   *
   * Each element of the result array is composed of:
   * - Line number
   * - Content of the line
   *
   * @param params - Request parameters
   * @returns Source code with line numbers
   */
  async show(params: ShowSourceRequest): Promise<ShowSourceResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('key', params.key);

    if (params.from !== undefined) {
      searchParams.append('from', String(params.from));
    }

    if (params.to !== undefined) {
      searchParams.append('to', String(params.to));
    }

    return this.request<ShowSourceResponse>(`/api/sources/show?${searchParams.toString()}`);
  }
}
