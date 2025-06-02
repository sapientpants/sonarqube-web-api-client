import { BaseClient } from '../../core/BaseClient';
import { ProjectLinksSearchBuilder } from './builders';
import type {
  CreateProjectLinkRequest,
  CreateProjectLinkResponse,
  DeleteProjectLinkRequest,
  SearchProjectLinksRequest,
  SearchProjectLinksResponse,
} from './types';

/**
 * Client for managing project links in SonarQube
 * @since 6.1
 * @see {@link https://docs.sonarqube.org/latest/project-administration/managing-project-links/}
 */
export class ProjectLinksClient extends BaseClient {
  /**
   * Create a new project link
   *
   * Requires 'Administer' permission on the specified project, or global 'Administer' permission.
   *
   * @param request - The project link creation parameters
   * @returns The created project link
   * @throws {ValidationError} When required parameters are missing or invalid
   * @throws {AuthorizationError} When the user lacks required permissions
   *
   * @example
   * ```typescript
   * const link = await client.projectLinks.create({
   *   projectKey: 'my-project',
   *   name: 'Documentation',
   *   url: 'https://docs.example.com'
   * });
   * ```
   *
   * @since 6.1
   */
  async create(request: CreateProjectLinkRequest): Promise<CreateProjectLinkResponse> {
    if (request.projectId === undefined && request.projectKey === undefined) {
      throw new Error('Either projectId or projectKey must be provided');
    }

    return this.request<CreateProjectLinkResponse>('/api/project_links/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete an existing project link
   *
   * Requires 'Administer' permission on the specified project, or global 'Administer' permission.
   *
   * @param request - The deletion parameters
   * @throws {ValidationError} When the link ID is missing
   * @throws {NotFoundError} When the link doesn't exist
   * @throws {AuthorizationError} When the user lacks required permissions
   *
   * @example
   * ```typescript
   * await client.projectLinks.delete({ id: '17' });
   * ```
   *
   * @since 6.1
   */
  async delete(request: DeleteProjectLinkRequest): Promise<void> {
    await this.request('/api/project_links/delete', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * List links of a project using builder pattern
   *
   * The 'projectId' or 'projectKey' must be provided.
   *
   * Requires one of the following permissions:
   * - 'Administer' rights on the specified project
   * - 'Browse' on the specified project
   *
   * @returns Builder for constructing project links search queries
   * @throws {ValidationError} When neither projectId nor projectKey is provided
   * @throws {NotFoundError} When the project doesn't exist
   * @throws {AuthorizationError} When the user lacks required permissions
   *
   * @example
   * ```typescript
   * // Search by project key
   * const links = await client.projectLinks.search()
   *   .projectKey('my-project')
   *   .execute();
   *
   * // Search by project ID
   * const links = await client.projectLinks.search()
   *   .projectId('AU-Tpxb--iU5OvuD2FLy')
   *   .execute();
   * ```
   *
   * @since 6.1
   */
  search(): ProjectLinksSearchBuilder {
    return new ProjectLinksSearchBuilder(async (request: SearchProjectLinksRequest) => {
      if (request.projectId === undefined && request.projectKey === undefined) {
        throw new Error('Either projectId or projectKey must be provided');
      }

      const params = new URLSearchParams();
      if (request.projectId !== undefined) {
        params.append('projectId', request.projectId);
      }
      if (request.projectKey !== undefined) {
        params.append('projectKey', request.projectKey);
      }

      return this.request<SearchProjectLinksResponse>(
        `/api/project_links/search?${params.toString()}`
      );
    });
  }

  /**
   * List links of a project (legacy method)
   *
   * @deprecated Use the builder pattern with search() instead
   * @param request - The search parameters
   * @returns List of project links
   * @since 6.1
   */
  async searchDirect(request: SearchProjectLinksRequest): Promise<SearchProjectLinksResponse> {
    if (request.projectId === undefined && request.projectKey === undefined) {
      throw new Error('Either projectId or projectKey must be provided');
    }

    const params = new URLSearchParams();
    if (request.projectId !== undefined) {
      params.append('projectId', request.projectId);
    }
    if (request.projectKey !== undefined) {
      params.append('projectKey', request.projectKey);
    }

    return this.request<SearchProjectLinksResponse>(
      `/api/project_links/search?${params.toString()}`
    );
  }
}
