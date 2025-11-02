import { BaseClient } from '../../core/BaseClient.js';
import { ProjectTagsSearchBuilder } from './builders.js';
import type { SearchTagsParams, SearchTagsResponse, SetProjectTagsParams } from './types.js';

// Constants
const API_PROJECT_TAGS_SEARCH = '/api/project_tags/search';

/**
 * Client for interacting with the SonarQube Project Tags API.
 * Provides methods for managing project tags.
 */
export class ProjectTagsClient extends BaseClient {
  /**
   * Search tags using builder pattern.
   *
   * @returns Builder for constructing tag search queries
   * @throws {NetworkError} If there's a network connectivity issue
   * @throws {ApiError} If the API returns an error response
   *
   * @example
   * ```typescript
   * // Search all tags
   * const result = await client.projectTags.search().execute();
   * console.log(result.tags);
   *
   * // Search tags for a specific project
   * const result = await client.projectTags.search()
   *   .project('my-project')
   *   .execute();
   *
   * // Search tags containing "finance"
   * const result = await client.projectTags.search()
   *   .query('finance')
   *   .pageSize(20)
   *   .execute();
   * ```
   */
  search(): ProjectTagsSearchBuilder {
    return new ProjectTagsSearchBuilder(async (params: SearchTagsParams) => {
      const searchParams = new URLSearchParams();

      if (params.project !== undefined) {
        searchParams.append('project', params.project);
      }
      if (params.ps !== undefined) {
        searchParams.append('ps', String(params.ps));
      }
      if (params.q !== undefined) {
        searchParams.append('q', params.q);
      }

      const query = searchParams.toString();
      return this.request<SearchTagsResponse>(
        query ? `${API_PROJECT_TAGS_SEARCH}?${query}` : API_PROJECT_TAGS_SEARCH,
      );
    });
  }

  /**
   * Search tags (legacy method).
   *
   * @deprecated Use the builder pattern with search() instead
   * @param params - The search parameters
   * @returns List of tags
   */
  async searchDirect(params?: SearchTagsParams): Promise<SearchTagsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.project !== undefined) {
      searchParams.append('project', params.project);
    }
    if (params?.ps !== undefined) {
      searchParams.append('ps', String(params.ps));
    }
    if (params?.q !== undefined) {
      searchParams.append('q', params.q);
    }

    const query = searchParams.toString();
    return this.request<SearchTagsResponse>(
      query ? `${API_PROJECT_TAGS_SEARCH}?${query}` : API_PROJECT_TAGS_SEARCH,
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
