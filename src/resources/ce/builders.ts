import { PaginatedBuilder } from '../../core/builders';
import type { CEClient } from './CEClient';
import type {
  ActivityRequest,
  ActivityResponse,
  ActivityTask,
  TaskStatus,
  TaskType,
} from './types';

/**
 * Builder for constructing CE activity search queries
 * @see https://docs.sonarqube.org/latest/extension-guide/web-api/
 */
export class ActivityBuilder extends PaginatedBuilder<
  ActivityRequest,
  ActivityResponse,
  ActivityTask
> {
  constructor(client: CEClient) {
    super(async (params) => client.activity(params));
  }

  /**
   * Filter by component key
   * @param component - Key of the component (project) to filter on
   * @returns Builder instance for chaining
   */
  withComponent(component: string): this {
    return this.setParam('component', component);
  }

  /**
   * Filter by component ID (deprecated since 8.0)
   * @param componentId - Id of the component (project) to filter on
   * @returns Builder instance for chaining
   * @throws {Error} When query has already been set
   * @deprecated Use withComponent() instead
   */
  withComponentId(componentId: string): this {
    // Validate that query is not already set
    if (this.params.q !== undefined) {
      throw new Error(
        'Cannot set componentId when query is already set. These parameters are mutually exclusive.'
      );
    }
    return this.setParam('componentId', componentId);
  }

  /**
   * Set maximum date of end of task processing
   * @param maxExecutedAt - Maximum date (inclusive) in ISO 8601 format
   * @returns Builder instance for chaining
   * @example
   * ```ts
   * builder.withMaxExecutedAt('2023-12-31T23:59:59+0000')
   * ```
   */
  withMaxExecutedAt(maxExecutedAt: string): this {
    return this.setParam('maxExecutedAt', maxExecutedAt);
  }

  /**
   * Set minimum date of task submission
   * @param minSubmittedAt - Minimum date (inclusive) in ISO 8601 format
   * @returns Builder instance for chaining
   * @example
   * ```ts
   * builder.withMinSubmittedAt('2023-01-01T00:00:00+0000')
   * ```
   */
  withMinSubmittedAt(minSubmittedAt: string): this {
    return this.setParam('minSubmittedAt', minSubmittedAt);
  }

  /**
   * Set date range for task execution
   * @param minSubmittedAt - Minimum submission date (inclusive) in ISO 8601 format
   * @param maxExecutedAt - Maximum execution date (inclusive) in ISO 8601 format
   * @returns Builder instance for chaining
   */
  withDateRange(minSubmittedAt: string, maxExecutedAt: string): this {
    return this.setParam('minSubmittedAt', minSubmittedAt).setParam('maxExecutedAt', maxExecutedAt);
  }

  /**
   * Filter on the last tasks only (most recent finished task by project)
   * @returns Builder instance for chaining
   */
  withOnlyCurrents(): this {
    return this.setParam('onlyCurrents', true);
  }

  /**
   * Search query for component names, keys, or task IDs
   *
   * Limit search to:
   * - component names that contain the supplied string
   * - component keys that are exactly the same as the supplied string
   * - task ids that are exactly the same as the supplied string
   *
   * Must not be set together with componentId
   *
   * @param query - Search query string
   * @returns Builder instance for chaining
   * @throws {Error} When componentId has already been set
   */
  withQuery(query: string): this {
    // Validate that componentId is not already set
    if (this.params.componentId !== undefined) {
      throw new Error(
        'Cannot set query when componentId is already set. These parameters are mutually exclusive.'
      );
    }
    return this.setParam('q', query);
  }

  /**
   * Filter by task statuses
   * @param statuses - One or more task statuses
   * @returns Builder instance for chaining
   * @example
   * ```ts
   * builder.withStatuses(TaskStatus.Failed, TaskStatus.Canceled)
   * ```
   */
  withStatuses(...statuses: TaskStatus[]): this {
    return this.setParam('status', statuses);
  }

  /**
   * Filter by task type
   * @param type - Task type (currently only REPORT is supported)
   * @returns Builder instance for chaining
   */
  withType(type: TaskType): this {
    return this.setParam('type', type);
  }

  /**
   * Set the page size
   * @param size - Number of results per page
   * @returns Builder instance for chaining
   */
  withPageSize(size: number): this {
    return this.pageSize(size);
  }

  /**
   * Execute the search query
   * @returns Promise resolving to the activity response
   * @throws {AuthorizationError} When lacking project administration permission
   * @throws {ApiError} When request parameters are invalid
   */
  async execute(): Promise<ActivityResponse> {
    return this.executor(this.params as ActivityRequest);
  }

  /**
   * Extract items from the response
   * @param response - The activity response
   * @returns Array of activity tasks
   */
  protected getItems(response: ActivityResponse): ActivityTask[] {
    return response.tasks;
  }
}
