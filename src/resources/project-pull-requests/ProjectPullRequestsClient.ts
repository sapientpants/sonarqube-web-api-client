import { BaseClient } from '../../core/BaseClient';
import { ProjectPullRequestsListBuilder } from './builders';
import type {
  DeletePullRequestRequest,
  ListPullRequestsRequest,
  ListPullRequestsResponse,
} from './types';

/**
 * Client for interacting with the SonarQube Project Pull Requests API.
 * Provides methods for managing pull requests.
 *
 * **Note**: These endpoints are only available when the Branch plugin is installed.
 *
 * @since 7.1
 */
export class ProjectPullRequestsClient extends BaseClient {
  /**
   * List the pull requests of a project using builder pattern.
   *
   * @since 7.1
   * @returns Builder for constructing list pull requests queries
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Browse' or 'Execute Analysis' rights on the project
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * const pullRequests = await client.projectPullRequests.list()
   *   .project('my-project')
   *   .execute();
   *
   * pullRequests.pullRequests.forEach(pr => {
   *   console.log(`PR #${pr.key}: ${pr.title} (${pr.status.qualityGateStatus})`);
   * });
   * ```
   */
  list(): ProjectPullRequestsListBuilder {
    return new ProjectPullRequestsListBuilder(async (params: ListPullRequestsRequest) => {
      const query = new URLSearchParams({
        project: params.project,
      });
      return this.request<ListPullRequestsResponse>(
        `/api/project_pull_requests/list?${query.toString()}`
      );
    });
  }

  /**
   * List the pull requests of a project (legacy method).
   *
   * @deprecated Use the builder pattern with list() instead
   * @since 7.1
   * @param params - The request parameters
   * @returns List of pull requests
   */
  async listDirect(params: ListPullRequestsRequest): Promise<ListPullRequestsResponse> {
    const query = new URLSearchParams({
      project: params.project,
    });
    return this.request<ListPullRequestsResponse>(
      `/api/project_pull_requests/list?${query.toString()}`
    );
  }

  /**
   * Delete a pull request.
   *
   * @since 7.1
   * @param params - The deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' rights on the project
   * @throws {NotFoundError} If the project or pull request doesn't exist
   *
   * @example
   * ```typescript
   * await client.projectPullRequests.delete({
   *   project: 'my-project',
   *   pullRequest: '1543'
   * });
   * ```
   */
  async delete(params: DeletePullRequestRequest): Promise<void> {
    await this.request('/api/project_pull_requests/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
