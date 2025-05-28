import { BaseClient } from '../../core/BaseClient';
import type {
  ActivityRequest,
  ActivityResponse,
  ActivityStatusRequest,
  ActivityStatusResponse,
  ComponentTasksRequest,
  ComponentTasksResponse,
  TaskRequest,
  TaskResponse,
} from './types';

/**
 * Client for interacting with SonarQube Compute Engine (CE) API
 * @see https://docs.sonarqube.org/latest/extension-guide/web-api/
 */
export class CEClient extends BaseClient {
  /**
   * Search for tasks
   *
   * Either componentId or component can be provided, but not both.
   * Requires the project administration permission if componentId or component is set.
   *
   * @param request - Search parameters
   * @returns Activity search response (paginated)
   * @throws {AuthorizationError} When lacking project administration permission
   * @throws {ApiError} When request parameters are invalid
   *
   * @example Simple search for failed tasks
   * ```ts
   * const failedTasks = await client.ce.activity({
   *   status: [TaskStatus.Failed],
   *   ps: 50
   * });
   * ```
   *
   * @example Search with builder (returns ActivityBuilder)
   * ```ts
   * const tasks = await client.ce.searchActivity()
   *   .withComponent('my-project')
   *   .withStatuses(TaskStatus.Failed, TaskStatus.Canceled)
   *   .withOnlyCurrents()
   *   .execute();
   * ```
   */
  async activity(request: ActivityRequest = {}): Promise<ActivityResponse> {
    const params = new URLSearchParams();

    if (request.component !== undefined && request.component.length > 0) {
      params.append('component', request.component);
    }
    if (request.componentId !== undefined && request.componentId.length > 0) {
      params.append('componentId', request.componentId);
    }
    if (request.maxExecutedAt !== undefined && request.maxExecutedAt.length > 0) {
      params.append('maxExecutedAt', request.maxExecutedAt);
    }
    if (request.minSubmittedAt !== undefined && request.minSubmittedAt.length > 0) {
      params.append('minSubmittedAt', request.minSubmittedAt);
    }
    if (request.onlyCurrents !== undefined) {
      params.append('onlyCurrents', String(request.onlyCurrents));
    }
    if (request.q !== undefined && request.q.length > 0) {
      params.append('q', request.q);
    }
    if (request.status && request.status.length > 0) {
      params.append('status', request.status.join(','));
    }
    if (request.type !== undefined) {
      params.append('type', request.type);
    }
    if (request.ps !== undefined) {
      params.append('ps', String(request.ps));
    }
    if (request.p !== undefined) {
      params.append('p', String(request.p));
    }

    return this.request<ActivityResponse>(`/api/ce/activity?${params.toString()}`);
  }

  /**
   * Returns CE activity related metrics
   *
   * Requires 'Administer' permission on the specified project.
   *
   * @param request - Request parameters (componentId or componentKey)
   * @returns Activity status metrics
   * @throws {AuthorizationError} When lacking 'Administer' permission
   * @since 6.6 - New field 'inProgress' in response
   * @since 7.8 - New field 'pendingTime' in response, only included when there are pending tasks
   *
   * @example
   * ```ts
   * const status = await client.ce.activityStatus({
   *   componentKey: 'my-project'
   * });
   * console.log(`Pending tasks: ${status.pending}`);
   * ```
   */
  async activityStatus(request: ActivityStatusRequest = {}): Promise<ActivityStatusResponse> {
    const params = new URLSearchParams();

    if (request.componentId !== undefined && request.componentId.length > 0) {
      params.append('componentId', request.componentId);
    }
    if (request.componentKey !== undefined && request.componentKey.length > 0) {
      params.append('componentKey', request.componentKey);
    }

    return this.request<ActivityStatusResponse>(`/api/ce/activity_status?${params.toString()}`);
  }

  /**
   * Get the pending tasks, in-progress tasks and the last executed task of a given component
   *
   * Requires the following permission: 'Browse' on the specified component.
   * Either 'componentId' or 'component' must be provided.
   *
   * @param request - Component identifier (component key or componentId)
   * @returns Component tasks (queue, current, lastExecutedTask)
   * @throws {ApiError} When neither component nor componentId is provided
   * @throws {AuthorizationError} When lacking 'Browse' permission
   * @since 6.1 - field "logs" is deprecated and its value is always false
   * @since 6.6 - fields "branch" and "branchType" added
   *
   * @example
   * ```ts
   * const tasks = await client.ce.component({
   *   component: 'my-project'
   * });
   * console.log(`Tasks in queue: ${tasks.queue.length}`);
   * ```
   */
  async component(request: ComponentTasksRequest): Promise<ComponentTasksResponse> {
    const params = new URLSearchParams();

    if (request.component !== undefined && request.component.length > 0) {
      params.append('component', request.component);
    }
    if (request.componentId !== undefined && request.componentId.length > 0) {
      params.append('componentId', request.componentId);
    }

    return this.request<ComponentTasksResponse>(`/api/ce/component?${params.toString()}`);
  }

  /**
   * Give Compute Engine task details such as type, status, duration and associated component
   *
   * Requires 'Execute Analysis' permission.
   *
   * @param request - Task identifier and optional fields
   * @returns Task details
   * @throws {NotFoundError} When task is not found
   * @throws {AuthorizationError} When lacking 'Execute Analysis' permission
   * @since 6.6 - fields "branch" and "branchType" added
   *
   * @example
   * ```ts
   * const task = await client.ce.task({
   *   id: 'AU-Tpxb--iU5OvuD2FLy',
   *   additionalFields: ['scannerContext', 'warnings']
   * });
   * ```
   */
  async task(request: TaskRequest): Promise<TaskResponse> {
    const params = new URLSearchParams();

    params.append('id', request.id);
    if (request.additionalFields && request.additionalFields.length > 0) {
      params.append('additionalFields', request.additionalFields.join(','));
    }

    return this.request<TaskResponse>(`/api/ce/task?${params.toString()}`);
  }

  /**
   * Search for tasks using a builder pattern
   *
   * This is a convenience method that returns an ActivityBuilder for complex queries.
   *
   * @returns ActivityBuilder instance
   *
   * @example
   * ```ts
   * const tasks = await client.ce.searchActivity()
   *   .withComponent('my-project')
   *   .withStatuses(TaskStatus.Failed, TaskStatus.Canceled)
   *   .withDateRange('2023-01-01T00:00:00+0000', '2023-12-31T23:59:59+0000')
   *   .execute();
   * ```
   */
  searchActivity(): ActivityBuilder {
    // This import is deferred to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const builders = require('./builders');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return new builders.ActivityBuilder(this);
  }
}

// Type-only import to avoid circular dependency
import type { ActivityBuilder } from './builders';
