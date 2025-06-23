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
  SearchAuthorsRequest,
  SearchAuthorsResponse,
  BulkChangeRequest,
  BulkChangeResponse,
  GetChangelogRequest,
  GetChangelogResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  EditCommentRequest,
  EditCommentResponse,
  GitLabSastExportRequest,
  GitLabSastExportResponse,
  ReindexRequest,
  ReindexResponse,
  SetSeverityRequest,
  SetSeverityResponse,
  SearchTagsRequest,
  SearchTagsResponse,
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
   * Search SCM accounts which match a given query
   * @param params - Request parameters
   * @returns List of SCM authors
   * @throws {Error} If the request fails or if issue indexing is in progress (503)
   * @requires Browse permission on the project
   * @since 5.1
   */
  async searchAuthors(params: SearchAuthorsRequest = {}): Promise<SearchAuthorsResponse> {
    const searchParams = new URLSearchParams();

    if (params.q !== undefined && params.q !== '') {
      searchParams.append('q', params.q);
    }
    if (params.ps !== undefined && params.ps !== 0) {
      searchParams.append('ps', params.ps.toString());
    }
    if (params.project !== undefined && params.project !== '') {
      searchParams.append('project', params.project);
    }

    return this.request<SearchAuthorsResponse>(`/api/issues/authors?${searchParams.toString()}`);
  }

  /**
   * Bulk change on issues. Up to 500 issues can be updated
   * @param params - Request parameters
   * @returns Summary of bulk change operation
   * @throws {Error} If the request fails
   * @requires Authentication and appropriate permissions
   * @since 3.7
   */
  async bulkChange(params: BulkChangeRequest): Promise<BulkChangeResponse> {
    const formData = new URLSearchParams();

    formData.append('issues', params.issues.join(','));
    if (params.add_tags) {
      formData.append('add_tags', params.add_tags.join(','));
    }
    if (params.remove_tags) {
      formData.append('remove_tags', params.remove_tags.join(','));
    }
    if (params.assign !== undefined && params.assign !== '') {
      formData.append('assign', params.assign);
    }
    if (params.set_severity !== undefined) {
      formData.append('set_severity', params.set_severity);
    }
    if (params.set_type !== undefined) {
      formData.append('set_type', params.set_type);
    }
    if (params.do_transition !== undefined) {
      formData.append('do_transition', params.do_transition);
    }
    if (params.comment !== undefined && params.comment !== '') {
      formData.append('comment', params.comment);
    }
    if (params.sendNotifications !== undefined) {
      formData.append('sendNotifications', params.sendNotifications.toString());
    }

    return this.request<BulkChangeResponse>('/api/issues/bulk_change', {
      method: 'POST',
      body: formData,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Display changelog of an issue
   * @param params - Request parameters
   * @returns List of changelog entries
   * @throws {Error} If the request fails
   * @requires Browse permission on the project
   * @since 4.1
   */
  async getChangelog(params: GetChangelogRequest): Promise<GetChangelogResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('issue', params.issue);

    return this.request<GetChangelogResponse>(`/api/issues/changelog?${searchParams.toString()}`);
  }

  /**
   * Delete a comment
   * @param params - Request parameters
   * @returns The updated issue without the deleted comment
   * @throws {Error} If the request fails
   * @requires Authentication and appropriate permissions
   * @since 3.6
   */
  async deleteComment(params: DeleteCommentRequest): Promise<DeleteCommentResponse> {
    return this.request<DeleteCommentResponse>('/api/issues/delete_comment', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Edit a comment
   * @param params - Request parameters
   * @returns The updated issue with the edited comment
   * @throws {Error} If the request fails
   * @requires Authentication and appropriate permissions
   * @since 3.6
   */
  async editComment(params: EditCommentRequest): Promise<EditCommentResponse> {
    return this.request<EditCommentResponse>('/api/issues/edit_comment', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Return vulnerabilities in GitLab SAST JSON format
   * @param params - Request parameters
   * @returns Vulnerabilities in GitLab SAST format
   * @throws {Error} If the request fails
   * @requires Browse permission on the project
   * @since 10.2
   */
  async gitLabSastExport(params: GitLabSastExportRequest): Promise<GitLabSastExportResponse> {
    const searchParams = new URLSearchParams();

    searchParams.append('project', params.project);
    if (params.branch !== undefined && params.branch !== '') {
      searchParams.append('branch', params.branch);
    }
    if (params.pullRequest !== undefined && params.pullRequest !== '') {
      searchParams.append('pullRequest', params.pullRequest);
    }

    return this.request<GitLabSastExportResponse>(
      `/api/issues/gitlab_sast_export?${searchParams.toString()}`
    );
  }

  /**
   * Reindex issues for a project
   * @param params - Request parameters
   * @returns Confirmation message
   * @throws {Error} If the request fails
   * @requires Administer System permission
   * @since 9.8
   */
  async reindex(params: ReindexRequest): Promise<ReindexResponse> {
    return this.request<ReindexResponse>('/api/issues/reindex', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Change severity of an issue
   * @param params - Request parameters
   * @returns The updated issue with new severity
   * @throws {Error} If the request fails
   * @requires Administer Issues permission
   * @since 3.6
   */
  async setSeverity(params: SetSeverityRequest): Promise<SetSeverityResponse> {
    return this.request<SetSeverityResponse>('/api/issues/set_severity', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * List tags matching a given query
   * @param params - Request parameters
   * @returns List of matching tags
   * @throws {Error} If the request fails
   * @requires Browse permission on the organization
   * @since 5.1
   */
  async searchTags(params: SearchTagsRequest = {}): Promise<SearchTagsResponse> {
    const searchParams = new URLSearchParams();

    if (params.q !== undefined && params.q !== '') {
      searchParams.append('q', params.q);
    }
    if (params.ps !== undefined && params.ps !== 0) {
      searchParams.append('ps', params.ps.toString());
    }
    if (params.organization !== undefined && params.organization !== '') {
      searchParams.append('organization', params.organization);
    }

    return this.request<SearchTagsResponse>(`/api/issues/tags?${searchParams.toString()}`);
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
      'casa',
      'cleanCodeAttributeCategories',
      'codeVariants',
      'componentKeys',
      'components',
      'cwe',
      'directories',
      'facets',
      'files',
      'impactSeverities',
      'impactSoftwareQualities',
      'issues',
      'issueStatuses',
      'languages',
      'owaspAsvs40',
      'owaspMobileTop102024',
      'owaspTop10',
      'owaspTop10v2021',
      'pciDss32',
      'pciDss40',
      'projects',
      'resolutions',
      'rules',
      'sansTop25',
      'scopes',
      'severities',
      'sonarsourceSecurity',
      'sonarsourceSecurityCategory',
      'statuses',
      'stigASDV5R3',
      'tags',
      'types',
    ];

    // Parameter name mapping for API compatibility
    const parameterMapping: Record<string, string> = {
      owaspTop10v2021: 'owaspTop10-2021',
      owaspAsvs40: 'owaspAsvs-4.0',
      owaspMobileTop102024: 'owaspMobileTop10-2024',
      pciDss32: 'pciDss-3.2',
      pciDss40: 'pciDss-4.0',
      stigASDV5R3: 'stig-ASD_V5R3',
    };

    // Add parameters to search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Map camelCase parameter names to API parameter names
        const apiKey = parameterMapping[key] ?? key;

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
