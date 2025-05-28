import { BaseClient } from '../../core/BaseClient';
import type { SearchTagsParams, SearchTagsResponse, SetProjectTagsParams } from './types';

/**
 * Client for interacting with the SonarQube Project Tags API.
 * Provides methods for managing project tags.
 */
export class ProjectTagsClient extends BaseClient {
  /**
   * Search tags.
   *
   * @param params - The search parameters
   * @returns List of tags
   * @throws {NetworkError} If there's a network connectivity issue
   * @throws {ApiError} If the API returns an error response
   *
   * @example
   * ```typescript
   * // Search all tags
   * const result = await client.projectTags.search();
   * console.log(result.tags);
   *
   * // Search tags containing "finance"
   * const result = await client.projectTags.search({
   *   q: 'finance',
   *   ps: 20
   * });
   * ```
   */
  async search(params?: SearchTagsParams): Promise<SearchTagsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.ps !== undefined) {
      searchParams.append('ps', String(params.ps));
    }
    if (params?.q !== undefined) {
      searchParams.append('q', params.q);
    }

    const query = searchParams.toString();
    return this.request<SearchTagsResponse>(
      query ? `/api/project_tags/search?${query}` : '/api/project_tags/search'
    );
  }

  /**
   * Set tags on a project.
   *
   * @param params - The set tags parameters
   * @returns Promise that resolves when the tags are set
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' rights on the specified project
   * @throws {NotFoundError} If the project doesn't exist
   * @throws {NetworkError} If there's a network connectivity issue
   *
   * @example
   * ```typescript
   * // Set tags on a project
   * await client.projectTags.set({
   *   project: 'my_project',
   *   tags: 'finance, offshore'
   * });
   *
   * // Clear all tags from a project
   * await client.projectTags.set({
   *   project: 'my_project',
   *   tags: ''
   * });
   * ```
   */
  async set(params: SetProjectTagsParams): Promise<void> {
    await this.request('/api/project_tags/set', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
