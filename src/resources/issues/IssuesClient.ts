import { BaseClient } from '../../core/BaseClient';
import { SearchIssuesBuilder } from './builders';
import type {
  SearchIssuesRequest,
  SearchIssuesResponse,
  AddCommentRequest,
  AddCommentResponse,
  AssignIssueRequest,
  AssignIssueResponse,
  DoTransitionRequest,
  DoTransitionResponse,
  SetTagsRequest,
  SetTagsResponse,
} from './types';

/**
 * Client for managing SonarQube issues
 */
export class IssuesClient extends BaseClient {
  /**
   * Search for issues with advanced filtering and pagination support
   * @returns Builder for constructing complex search queries
   * @requires Browse permission on the specified project(s)
   */
  search(): SearchIssuesBuilder {
    return new SearchIssuesBuilder(async (params: SearchIssuesRequest) =>
      this.searchExecutor(params)
    );
  }

  /**
   * Add a comment to an issue
   * @param params - Request parameters
   * @returns The updated issue with the new comment
   * @throws {Error} If the request fails
   * @requires Authentication and Browse permission on the project
   */
  async addComment(params: AddCommentRequest): Promise<AddCommentResponse> {
    return this.request<AddCommentResponse>('/api/issues/add_comment', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Assign or unassign an issue to/from a user
   * @param params - Request parameters
   * @returns The updated issue with assignment information
   * @throws {Error} If the request fails
   * @requires Authentication and Browse permission on the project
   */
  async assign(params: AssignIssueRequest): Promise<AssignIssueResponse> {
    return this.request<AssignIssueResponse>('/api/issues/assign', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Perform a workflow transition on an issue (confirm, resolve, reopen, etc.)
   * @param params - Request parameters
   * @returns The updated issue with new status
   * @throws {Error} If the request fails
   * @requires Authentication and appropriate permissions based on transition type
   */
  async doTransition(params: DoTransitionRequest): Promise<DoTransitionResponse> {
    return this.request<DoTransitionResponse>('/api/issues/do_transition', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Set tags on an issue
   * @param params - Request parameters
   * @returns The updated issue with new tags
   * @throws {Error} If the request fails
   * @requires Authentication and Browse permission on the project
   */
  async setTags(params: SetTagsRequest): Promise<SetTagsResponse> {
    return this.request<SetTagsResponse>('/api/issues/set_tags', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        tags: params.tags.join(','),
      }),
    });
  }

  /**
   * Execute search request with proper parameter handling
   */
  private async searchExecutor(params: SearchIssuesRequest): Promise<SearchIssuesResponse> {
    const searchParams = new URLSearchParams();

    // Handle array parameters by joining with commas
    const arrayParams: Array<keyof SearchIssuesRequest> = [
      'additionalFields',
      'assignees',
      'authors',
      'cleanCodeAttributeCategories',
      'componentKeys',
      'components',
      'cwe',
      'facets',
      'impactSeverities',
      'impactSoftwareQualities',
      'issues',
      'issueStatuses',
      'languages',
      'owaspTop10',
      'owaspTop10v2021',
      'projects',
      'resolutions',
      'rules',
      'sansTop25',
      'severities',
      'sonarsourceSecurity',
      'sonarsourceSecurityCategory',
      'statuses',
      'tags',
      'types',
    ];

    // Add parameters to search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Map camelCase parameter names to API parameter names
        const apiKey = key === 'owaspTop10v2021' ? 'owaspTop10-2021' : key;

        if (arrayParams.includes(key as keyof SearchIssuesRequest) && Array.isArray(value)) {
          if (value.length > 0) {
            searchParams.append(apiKey, value.join(','));
          }
        } else if (typeof value === 'boolean') {
          searchParams.append(apiKey, value.toString());
        } else if (typeof value === 'number' || typeof value === 'string') {
          searchParams.append(apiKey, value.toString());
        }
      }
    });

    return this.request<SearchIssuesResponse>(`/api/issues/search?${searchParams.toString()}`);
  }
}
