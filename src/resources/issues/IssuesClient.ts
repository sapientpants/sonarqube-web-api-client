import { BaseClient } from '../../core/BaseClient';
import { DeprecationManager } from '../../core/deprecation';
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
   * @throws {IndexingInProgressError} If issue indexing is in progress (503)
   * @throws {Error} If the request fails
   * @requires Browse permission on the project
   * @since 5.1
   */
  async searchAuthors(params: SearchAuthorsRequest = {}): Promise<SearchAuthorsResponse> {
    this.validateSearchAuthorsParameters(params);

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
    this.validateBulkChangeParameters(params);

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
    this.validateSearchTagsParameters(params);

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
    // Validate parameter constraints
    this.validateSearchParameters(params);

    const searchParams = new URLSearchParams();

    // Handle array parameters by joining with commas
    const arrayParams: Array<keyof SearchIssuesRequest> = [
      'additionalFields',
      'assignees',
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

    // Parameters that need multiple calls instead of comma-separated values
    const multipleCallParams: Array<keyof SearchIssuesRequest> = ['authors'];

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

        // Handle parameters that need multiple calls (e.g., authors)
        if (multipleCallParams.includes(key as keyof SearchIssuesRequest) && Array.isArray(value)) {
          if (value.length > 0) {
            value.forEach((singleValue) => {
              if (typeof singleValue === 'string') {
                searchParams.append(apiKey, singleValue);
              }
            });
          }
        }
        // Handle normal array parameters (comma-separated)
        else if (arrayParams.includes(key as keyof SearchIssuesRequest) && Array.isArray(value)) {
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

  /**
   * Validate search parameters for constraints and mutual exclusions
   */
  private validateSearchParameters(params: SearchIssuesRequest): void {
    // fixedInPullRequest cannot be used with pullRequest
    if (
      params.fixedInPullRequest !== undefined &&
      params.fixedInPullRequest !== '' &&
      params.pullRequest !== undefined &&
      params.pullRequest !== ''
    ) {
      throw new Error(
        'Parameters "fixedInPullRequest" and "pullRequest" cannot be used together. These parameters are mutually exclusive - use either one or the other to filter issues by pull request context.'
      );
    }

    // fixedInPullRequest requires components to be specified
    if (
      params.fixedInPullRequest !== undefined &&
      params.fixedInPullRequest !== '' &&
      (!params.components || params.components.length === 0)
    ) {
      throw new Error(
        'Parameter "fixedInPullRequest" requires "components" to be specified. Please provide at least one component key to scope the search for issues that would be fixed in the pull request.'
      );
    }

    // Validate page size limits
    if (params.ps !== undefined && (params.ps < 1 || params.ps > 500)) {
      throw new Error(
        `Parameter "ps" (page size) must be between 1 and 500. Current value: ${String(
          params.ps
        )}. Use pagination to retrieve large result sets.`
      );
    }

    // Validate page number
    if (params.p !== undefined && params.p < 1) {
      throw new Error(
        'Parameter "p" (page number) must be greater than 0. Page numbers start from 1.'
      );
    }

    // Validate OWASP ASVS level
    if (params.owaspAsvsLevel !== undefined && ![1, 2, 3].includes(params.owaspAsvsLevel)) {
      throw new Error(
        'Parameter "owaspAsvsLevel" must be 1, 2, or 3. These correspond to the three levels of verification requirements in OWASP ASVS v4.0.'
      );
    }

    // Validate date formats (basic check for ISO 8601 date format)
    const dateParams = ['createdAfter', 'createdBefore', 'createdAt'] as const;
    dateParams.forEach((param) => {
      const value = params[param];
      if (value !== undefined && value !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          throw new Error(
            `Parameter "${param}" must be in YYYY-MM-DD format. Current value: "${value}". Example: "2023-01-15".`
          );
        }
      }
    });

    // Validate createdInLast format
    if (params.createdInLast !== undefined && params.createdInLast !== '') {
      const periodRegex = /^\d+[wdmyh]$/;
      if (!periodRegex.test(params.createdInLast)) {
        throw new Error(
          `Parameter "createdInLast" must be in format like "1w", "30d", "6m", "1y", or "24h". Current value: "${
            params.createdInLast
          }".`
        );
      }
    }

    // Validate timeZone format (basic check)
    if (params.timeZone !== undefined && params.timeZone !== '') {
      // Accept common timezone formats: UTC, GMT, America/New_York, Europe/London, +01:00, -05:00
      const timezoneRegex = /^(UTC|GMT|[A-Za-z_]+\/[A-Za-z_]+|[+-]\d{2}:\d{2})$/;
      if (!timezoneRegex.test(params.timeZone)) {
        throw new Error(
          `Parameter "timeZone" must be a valid timezone identifier. Examples: "UTC", "America/New_York", "Europe/London", "+01:00". Current value: "${
            params.timeZone
          }".`
        );
      }
    }

    // Validate array parameter limits
    const arrayLimits = {
      assignees: 50,
      authors: 50,
      components: 100,
      componentKeys: 100,
      directories: 100,
      files: 100,
      projects: 100,
      rules: 100,
      tags: 50,
      issues: 500,
      languages: 20,
    } as const;

    Object.entries(arrayLimits).forEach(([paramName, limit]) => {
      const value = params[paramName as keyof typeof arrayLimits];
      if (Array.isArray(value) && value.length > limit) {
        throw new Error(
          `Parameter "${paramName}" cannot contain more than ${String(limit)} items. Current count: ${String(value.length)}. Consider splitting your request into multiple calls or using more specific filters.`
        );
      }
    });

    // Validate CWE format (should be numbers)
    if (params.cwe !== undefined && params.cwe.length > 0) {
      const invalidCwes = params.cwe.filter((cwe) => !/^\d+$/.test(cwe));
      if (invalidCwes.length > 0) {
        throw new Error(
          `Parameter "cwe" must contain only numeric CWE identifiers. Invalid values: [${invalidCwes.join(
            ', '
          )}]. Example: ["79", "89", "200"].`
        );
      }
    }

    // Warn about deprecated parameters
    this.checkDeprecatedParameters(params);
  }

  /**
   * Validate bulk change parameters
   */
  private validateBulkChangeParameters(params: BulkChangeRequest): void {
    // Check issues array length
    if (params.issues.length === 0) {
      throw new Error('Parameter "issues" is required and must contain at least one issue key.');
    }

    if (params.issues.length > 500) {
      throw new Error(
        `Parameter "issues" cannot contain more than 500 issue keys. Current count: ${String(
          params.issues.length
        )}. Consider splitting your bulk change into multiple requests.`
      );
    }

    // Validate issue key format (basic check)
    const invalidIssueKeys = params.issues.filter(
      (key) => !key || typeof key !== 'string' || key.trim() === ''
    );
    if (invalidIssueKeys.length > 0) {
      throw new Error(
        `All issue keys must be non-empty strings. Found ${String(
          invalidIssueKeys.length
        )} invalid issue keys.`
      );
    }

    // Check that at least one action is specified
    const hasAction = Boolean(
      (params.add_tags !== undefined && params.add_tags.length > 0) ||
        (params.remove_tags !== undefined && params.remove_tags.length > 0) ||
        params.assign !== undefined ||
        params.set_severity !== undefined ||
        params.set_type !== undefined ||
        params.do_transition !== undefined ||
        (params.comment !== undefined && params.comment !== '')
    );

    if (!hasAction) {
      throw new Error(
        'At least one action must be specified: add_tags, remove_tags, assign, set_severity, set_type, do_transition, or comment.'
      );
    }

    // Validate tags if provided
    if (params.add_tags !== undefined && params.add_tags.length > 10) {
      throw new Error(
        `Parameter "add_tags" cannot contain more than 10 tags. Current count: ${String(
          params.add_tags.length
        )}.`
      );
    }

    if (params.remove_tags !== undefined && params.remove_tags.length > 10) {
      throw new Error(
        `Parameter "remove_tags" cannot contain more than 10 tags. Current count: ${String(
          params.remove_tags.length
        )}.`
      );
    }

    // Validate assignee format
    if (params.assign !== undefined && params.assign !== '' && params.assign !== '_me_') {
      if (!/^[a-zA-Z0-9._-]+$/.test(params.assign)) {
        throw new Error(
          `Parameter "assign" must be a valid user login, "_me_", or empty string to unassign. Current value: "${
            params.assign
          }".`
        );
      }
    }

    // Validate comment length
    if (params.comment !== undefined && params.comment.length > 1000) {
      throw new Error(
        `Parameter "comment" cannot exceed 1000 characters. Current length: ${String(
          params.comment.length
        )}.`
      );
    }
  }

  /**
   * Validate search authors parameters
   */
  private validateSearchAuthorsParameters(params: SearchAuthorsRequest): void {
    // Validate page size
    if (params.ps !== undefined && (params.ps < 1 || params.ps > 100)) {
      throw new Error(
        `Parameter "ps" (page size) must be between 1 and 100 for authors search. Current value: ${String(
          params.ps
        )}.`
      );
    }

    // Validate query minimum length
    if (params.q !== undefined && params.q !== '' && params.q.length < 2) {
      throw new Error(
        `Parameter "q" (query) must be at least 2 characters long when specified. Current length: ${String(
          params.q.length
        )}.`
      );
    }

    // Validate project key format (basic check)
    if (params.project !== undefined && params.project !== '') {
      if (!/^[a-zA-Z0-9._:-]+$/.test(params.project)) {
        throw new Error(
          `Parameter "project" must be a valid project key. Current value: "${params.project}".`
        );
      }
    }
  }

  /**
   * Validate search tags parameters
   */
  private validateSearchTagsParameters(params: SearchTagsRequest): void {
    // Validate page size
    if (params.ps !== undefined && (params.ps < 1 || params.ps > 100)) {
      throw new Error(
        `Parameter "ps" (page size) must be between 1 and 100 for tags search. Current value: ${String(
          params.ps
        )}.`
      );
    }

    // Validate query minimum length
    if (params.q !== undefined && params.q !== '' && params.q.length < 2) {
      throw new Error(
        `Parameter "q" (query) must be at least 2 characters long when specified. Current length: ${String(
          params.q.length
        )}.`
      );
    }

    // Validate organization key format (basic check)
    if (params.organization !== undefined && params.organization !== '') {
      if (!/^[a-zA-Z0-9._:-]+$/.test(params.organization)) {
        throw new Error(
          `Parameter "organization" must be a valid organization key. Current value: "${
            params.organization
          }".`
        );
      }
    }
  }

  /**
   * Check for deprecated parameters and issue warnings
   */
  private checkDeprecatedParameters(params: SearchIssuesRequest): void {
    // componentKeys deprecated since 10.2, replaced by components
    if (params.componentKeys && params.componentKeys.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "componentKeys"',
        reason: 'Parameter deprecated since SonarQube 10.2',
        replacement: 'Use "components" parameter instead',
        removeVersion: 'TBD',
      });
    }

    // statuses deprecated since 10.4, replaced by issueStatuses
    if (params.statuses && params.statuses.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "statuses"',
        reason: 'Parameter deprecated since SonarQube 10.4',
        replacement: 'Use "issueStatuses" parameter instead',
        removeVersion: 'TBD',
      });
    }

    // severities deprecated in favor of impactSeverities
    if (params.severities && params.severities.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "severities"',
        reason: 'Parameter deprecated in favor of Clean Code taxonomy',
        replacement: 'Use "impactSeverities" parameter instead',
        removeVersion: 'TBD',
      });
    }

    // types deprecated in favor of Clean Code taxonomy
    if (params.types && params.types.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "types"',
        reason: 'Parameter deprecated in favor of Clean Code taxonomy',
        replacement: 'Use Clean Code attribute categories and impact software qualities',
        removeVersion: 'TBD',
      });
    }

    // resolutions deprecated in favor of issueStatuses
    if (params.resolutions && params.resolutions.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "resolutions"',
        reason: 'Parameter deprecated since SonarQube 10.4',
        replacement: 'Use "issueStatuses" parameter instead',
        removeVersion: 'TBD',
      });
    }

    // sansTop25 deprecated since 10.0
    if (params.sansTop25 && params.sansTop25.length > 0) {
      DeprecationManager.warn({
        api: 'issues.search() parameter "sansTop25"',
        reason: 'Parameter deprecated since SonarQube 10.0',
        replacement: 'Use other security standard parameters',
        removeVersion: 'TBD',
      });
    }
  }
}
