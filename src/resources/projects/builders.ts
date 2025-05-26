import { BaseBuilder, PaginatedBuilder, ParameterHelpers } from '../../core/builders';
import type {
  BulkDeleteProjectsRequest,
  ProjectSearchResult,
  SearchProjectsRequest,
  SearchProjectsResponse,
} from './types';

/**
 * Builder for constructing bulk delete projects requests.
 * At least one parameter is required among analyzedBefore, projects and q.
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
 *
 * // Delete projects matching a query
 * await client.projects.bulkDelete()
 *   .query('deprecated')
 *   .onProvisionedOnly()
 *   .execute();
 * ```
 */
export class BulkDeleteProjectsBuilder extends BaseBuilder<BulkDeleteProjectsRequest> {
  /**
   * Filter projects last analyzed before the given date (inclusive).
   * Format: date or datetime ISO formats
   */
  analyzedBefore = ParameterHelpers.createStringMethod<typeof this>('analyzedBefore');

  /**
   * Filter projects that are provisioned only (not analyzed yet).
   */
  onProvisionedOnly = ParameterHelpers.createBooleanMethod<typeof this>('onProvisionedOnly');

  /**
   * Comma-separated list of project keys to delete.
   */
  projects = ParameterHelpers.createArrayMethod<typeof this>('projects');

  /**
   * Limit search to projects that contain the supplied string in their key or name.
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Filter projects by qualifiers.
   */
  qualifiers = ParameterHelpers.createArrayMethod<typeof this>('qualifiers');

  async execute(): Promise<void> {
    // Validate that at least one parameter is provided
    const finalParams = this.params as BulkDeleteProjectsRequest;
    if (
      finalParams.analyzedBefore === undefined &&
      (finalParams.projects === undefined || finalParams.projects.length === 0) &&
      finalParams.q === undefined
    ) {
      throw new Error('At least one parameter is required among analyzedBefore, projects and q');
    }

    await this.executor(finalParams);
  }
}

/**
 * Builder for constructing paginated project search requests.
 *
 * @example
 * ```typescript
 * // Search with pagination
 * const results = await client.projects.search()
 *   .query('frontend')
 *   .pageSize(50)
 *   .page(2)
 *   .execute();
 *
 * // Iterate through all projects
 * for await (const project of client.projects.search().all()) {
 *   console.log(project.name);
 * }
 *
 * // Search for provisioned projects only
 * const provisioned = await client.projects.search()
 *   .onProvisionedOnly()
 *   .execute();
 * ```
 */
export class SearchProjectsBuilder extends PaginatedBuilder<
  SearchProjectsRequest,
  SearchProjectsResponse,
  ProjectSearchResult
> {
  /**
   * Filter projects last analyzed before the given date (inclusive).
   * Format: date or datetime ISO formats
   */
  analyzedBefore = ParameterHelpers.createStringMethod<typeof this>('analyzedBefore');

  /**
   * Filter projects that are provisioned only (not analyzed yet).
   */
  onProvisionedOnly = ParameterHelpers.createBooleanMethod<typeof this>('onProvisionedOnly');

  /**
   * Comma-separated list of project keys to filter.
   */
  projects = ParameterHelpers.createArrayMethod<typeof this>('projects');

  /**
   * Limit search to projects that contain the supplied string in their key or name.
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Filter projects by qualifiers.
   */
  qualifiers = ParameterHelpers.createArrayMethod<typeof this>('qualifiers');

  async execute(): Promise<SearchProjectsResponse> {
    return this.executor(this.params as SearchProjectsRequest);
  }

  protected getItems(response: SearchProjectsResponse): ProjectSearchResult[] {
    return response.components;
  }
}
