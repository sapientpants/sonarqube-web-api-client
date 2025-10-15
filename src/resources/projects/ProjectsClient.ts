import { BaseClient } from '../../core/BaseClient';
import { DeprecationManager } from '../../core/deprecation/DeprecationManager';
import { ValidationError } from '../../errors';
import { BulkDeleteProjectsBuilder, SearchProjectsBuilder } from './builders';
import type {
  BulkUpdateProjectKeyRequest,
  BulkUpdateProjectKeyResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  ExportFindingsRequest,
  Finding,
  GetContainsAiCodeRequest,
  GetContainsAiCodeResponse,
  LicenseUsageResponse,
  ProjectSearchResult,
  SearchProjectsResponse,
  SetContainsAiCodeRequest,
  UpdateProjectKeyRequest,
  UpdateProjectVisibilityRequest,
} from './types';

/**
 * Client for interacting with the SonarQube Projects API.
 * Provides methods for managing project existence.
 */
export class ProjectsClient extends BaseClient {
  /**
   * Delete one or several projects.
   * Only the 1'000 first items in project filters are taken into account.
   *
   * @since 5.2
   * @returns A builder for constructing the bulk delete request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   *
   * @example
   * ```typescript
   * // Delete projects not analyzed in the last 30 days
   * await client.projects.bulkDelete()
   *   .analyzedBefore('2024-01-01')
   *   .execute();
   *
   * // Delete specific projects
   * await client.projects.bulkDelete()
   *   .projects(['old-project-1', 'old-project-2'])
   *   .execute();
   * ```
   */
  bulkDelete(): BulkDeleteProjectsBuilder {
    return new BulkDeleteProjectsBuilder(async (params) => {
      await this.request('/api/projects/bulk_delete', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    });
  }

  /**
   * Bulk update project keys by replacing a part of the key.
   * This allows renaming a project and all its sub-components at once.
   *
   * @since 6.1
   * @deprecated Since 7.6 - Use updateKey() for individual project key updates
   * @param params - The bulk update parameters
   * @returns Information about the updated keys
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {ValidationError} If the replacement would create duplicate keys
   *
   * @example
   * ```typescript
   * // Rename 'my_old_project' to 'my_new_project' and update all sub-components
   * const result = await client.projects.bulkUpdateKey({
   *   project: 'my_old_project',
   *   from: 'my_old_',
   *   to: 'my_new_',
   *   dryRun: true // Test the operation first
   * });
   * ```
   */

  async bulkUpdateKey(params: BulkUpdateProjectKeyRequest): Promise<BulkUpdateProjectKeyResponse> {
    DeprecationManager.warn({
      api: 'projects.bulkUpdateKey()',
      replacement: 'projects.updateKey()',
      removeVersion: '8.0.0',
      reason: 'Since 7.6 - Use updateKey() for individual project key updates',
    });

    const body: Record<string, string> = {
      project: params.project,
      from: params.from,
      to: params.to,
    };
    if (params.dryRun !== undefined) {
      body['dryRun'] = String(params.dryRun);
    }
    return this.request<BulkUpdateProjectKeyResponse>('/api/projects/bulk_update_key', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Create a project.
   * If your project is hosted on a DevOps Platform, please use the import endpoint
   * under api/alm_integrations, so it creates and properly configures the project.
   *
   * @since 4.0
   * @param params - The project creation parameters
   * @returns The created project details
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Create Projects' permission
   * @throws {ValidationError} If the project key already exists
   *
   * @example
   * ```typescript
   * const project = await client.projects.create({
   *   project: 'my-new-project',
   *   name: 'My New Project',
   *   visibility: 'private'
   * });
   * ```
   */
  async create(params: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.request<CreateProjectResponse>('/api/projects/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a project.
   *
   * @since 5.2
   * @param params - The project deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission or 'Administer' permission on the project
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * await client.projects.delete({ project: 'my-old-project' });
   * ```
   */
  async delete(params: DeleteProjectRequest): Promise<void> {
    await this.request('/api/projects/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Export all findings (issues and hotspots) of a specific project branch.
   * Keep in mind that this endpoint will return all findings, issues and hotspots
   * (no filter), which can take time and use a lot of resources.
   *
   * **Note**: This endpoint is only available in SonarQube, not in SonarCloud.
   *
   * @since 9.1
   * @param params - The export parameters
   * @returns An array of findings
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If both branch and pullRequest are specified
   *
   * @example
   * ```typescript
   * // Export findings from main branch
   * const findings = await client.projects.exportFindings({
   *   project: 'my-project',
   *   branch: 'main'
   * });
   *
   * // Export findings from a pull request
   * const findings = await client.projects.exportFindings({
   *   project: 'my-project',
   *   pullRequest: '123'
   * });
   * ```
   */
  async exportFindings(params: ExportFindingsRequest): Promise<Finding[]> {
    // Validate that only one of branch or pullRequest is specified
    if ((params.branch ?? '') !== '' && (params.pullRequest ?? '') !== '') {
      throw new ValidationError(
        'Cannot specify both branch and pullRequest. Please provide only one of them.',
      );
    }
    const query = new URLSearchParams();
    query.append('project', params.project);
    if (params.branch !== undefined) {
      query.append('branch', params.branch);
    }
    if (params.pullRequest !== undefined) {
      query.append('pullRequest', params.pullRequest);
    }
    return this.request<Finding[]>(`/api/projects/export_findings?${query.toString()}`);
  }

  /**
   * Get whether a project contains AI code or not.
   *
   * **Note**: This endpoint is only available in SonarQube, not in SonarCloud.
   *
   * @since 2025.1
   * @param params - The request parameters
   * @returns Whether the project contains AI code
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * const result = await client.projects.getContainsAiCode({
   *   project: 'my-project'
   * });
   * console.log(result.containsAiCode); // true or false
   * ```
   */
  async getContainsAiCode(params: GetContainsAiCodeRequest): Promise<GetContainsAiCodeResponse> {
    const query = new URLSearchParams({
      project: params.project,
    });
    return this.request<GetContainsAiCodeResponse>(
      `/api/projects/get_contains_ai_code?${query.toString()}`,
    );
  }

  /**
   * Help admins to understand how much each project affects the total number of lines of code.
   * Returns the list of projects together with information about their usage,
   * sorted by lines of code descending.
   *
   * **Note**: This endpoint is only available in SonarQube, not in SonarCloud.
   *
   * @since 9.4
   * @returns License usage information for all projects
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   *
   * @example
   * ```typescript
   * const usage = await client.projects.licenseUsage();
   * usage.projects.forEach(project => {
   *   console.log(`${project.name}: ${project.linesOfCode} LOC`);
   * });
   * ```
   */
  async licenseUsage(): Promise<LicenseUsageResponse> {
    return this.request<LicenseUsageResponse>('/api/projects/license_usage', {
      method: 'GET',
    });
  }

  /**
   * Search for projects or views to administrate them.
   * - The response field 'lastAnalysisDate' takes into account the analysis of all branches and pull requests
   * - The response field 'revision' takes into account the analysis of the main branch only
   *
   * @since 6.3
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   *
   * @example
   * ```typescript
   * // Search for projects with a query
   * const results = await client.projects.search()
   *   .query('frontend')
   *   .pageSize(50)
   *   .execute();
   *
   * // Iterate through all projects
   * for await (const project of client.projects.searchAll()) {
   *   console.log(project.name);
   * }
   * ```
   */
  search(): SearchProjectsBuilder {
    return new SearchProjectsBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.analyzedBefore !== undefined) {
        query.append('analyzedBefore', params.analyzedBefore);
      }
      if (params.onProvisionedOnly !== undefined) {
        query.append('onProvisionedOnly', String(params.onProvisionedOnly));
      }
      if (params.organization !== undefined) {
        query.append('organization', params.organization);
      }
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.projects !== undefined) {
        query.append('projects', params.projects.join(','));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      if (params.qualifiers !== undefined) {
        query.append('qualifiers', params.qualifiers.join(','));
      }
      const queryString = query.toString();
      const url = queryString ? `/api/projects/search?${queryString}` : '/api/projects/search';
      return this.request<SearchProjectsResponse>(url);
    });
  }

  /**
   * Convenience method to iterate through all projects.
   * This is equivalent to calling search().all()
   *
   * @returns An async iterator for all projects
   *
   * @example
   * ```typescript
   * for await (const project of client.projects.searchAll()) {
   *   console.log(project.name);
   * }
   * ```
   */
  searchAll(): AsyncIterableIterator<ProjectSearchResult> {
    return this.search().all();
  }

  /**
   * Sets if the project contains AI code or not.
   *
   * **Note**: This endpoint is only available in SonarQube, not in SonarCloud.
   *
   * @since 10.8
   * @param params - The request parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' rights on the specified project
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * await client.projects.setContainsAiCode({
   *   project: 'my-project',
   *   containsAiCode: true
   * });
   * ```
   */
  async setContainsAiCode(params: SetContainsAiCodeRequest): Promise<void> {
    await this.request('/api/projects/set_contains_ai_code', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a project and all its sub-components keys.
   *
   * @since 6.1
   * @param params - The key update parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the project doesn't exist
   * @throws {ValidationError} If the new key already exists
   *
   * @example
   * ```typescript
   * await client.projects.updateKey({
   *   from: 'old-project-key',
   *   to: 'new-project-key'
   * });
   * ```
   */
  async updateKey(params: UpdateProjectKeyRequest): Promise<void> {
    await this.request('/api/projects/update_key', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Updates visibility of a project, application or a portfolio.
   *
   * @since 6.4
   * @param params - The visibility update parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Project administer' permission on the specified entity
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * await client.projects.updateVisibility({
   *   project: 'my-project',
   *   visibility: 'public'
   * });
   * ```
   */
  async updateVisibility(params: UpdateProjectVisibilityRequest): Promise<void> {
    await this.request('/api/projects/update_visibility', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
