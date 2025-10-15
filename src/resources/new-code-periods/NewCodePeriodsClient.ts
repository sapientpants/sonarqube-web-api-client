import { BaseClient } from '../../core/BaseClient';
import type {
  ListNewCodePeriodsRequest,
  ListNewCodePeriodsResponse,
  SetNewCodePeriodRequest,
  SetNewCodePeriodResponse,
  ShowNewCodePeriodRequest,
  ShowNewCodePeriodResponse,
  UnsetNewCodePeriodRequest,
} from './types';

/**
 * Client for managing SonarQube new code periods
 *
 * The New Code Periods API allows you to manage new code period definitions
 * at global, project, and branch levels. New code periods define what code
 * is considered "new" for quality gate evaluation.
 *
 * @since SonarQube 8.0
 */
export class NewCodePeriodsClient extends BaseClient {
  /**
   * Lists the new code definition for all branches in a project.
   * Requires the permission to browse the project.
   *
   * @param request - Request parameters
   * @returns Promise that resolves to the list of new code periods
   * @throws {AuthorizationError} If user lacks browse permission on the project
   * @throws {NotFoundError} If the project is not found
   *
   * @example
   * ```typescript
   * // List new code periods for all branches in a project
   * const periods = await client.newCodePeriods.list({
   *   project: 'my-project'
   * });
   *
   * // List new code period for a specific branch
   * const branchPeriod = await client.newCodePeriods.list({
   *   project: 'my-project',
   *   branch: 'main'
   * });
   * ```
   */
  async list(request: ListNewCodePeriodsRequest): Promise<ListNewCodePeriodsResponse> {
    const params = new URLSearchParams();
    params.append('project', request.project);

    if (request.branch !== undefined) {
      params.append('branch', request.branch);
    }

    const response = await this.request<ListNewCodePeriodsResponse>(
      `/api/new_code_periods/list?${params.toString()}`,
    );

    return response;
  }

  /**
   * Gets the new code period setting for global, project, or branch level.
   * Requires the permission to browse the project (when project key is provided).
   *
   * @param request - Request parameters (optional - if not provided, shows global setting)
   * @returns Promise that resolves to the new code period setting
   * @throws {AuthorizationError} If user lacks browse permission on the project
   * @throws {NotFoundError} If the project or branch is not found
   *
   * @example
   * ```typescript
   * // Show global new code period setting
   * const globalSetting = await client.newCodePeriods.show();
   *
   * // Show project-specific new code period setting
   * const projectSetting = await client.newCodePeriods.show({
   *   project: 'my-project'
   * });
   *
   * // Show branch-specific new code period setting
   * const branchSetting = await client.newCodePeriods.show({
   *   project: 'my-project',
   *   branch: 'main'
   * });
   * ```
   */
  async show(request?: ShowNewCodePeriodRequest): Promise<ShowNewCodePeriodResponse> {
    const params = new URLSearchParams();

    if (request?.project !== undefined) {
      params.append('project', request.project);
    }

    if (request?.branch !== undefined) {
      params.append('branch', request.branch);
    }

    const response = await this.request<ShowNewCodePeriodResponse>(
      `/api/new_code_periods/show?${params.toString()}`,
    );

    return response;
  }

  /**
   * Updates the new code definition on different levels:
   * - Not providing a project key and a branch key will update the default value at global level
   * - Project key must be provided to update the value for a project
   * - Both project and branch keys must be provided to update the value for a branch
   *
   * Requires one of the following permissions:
   * - 'Administer System' to change the global setting
   * - 'Administer' rights on the specified project to change the project setting
   *
   * @param request - Request parameters
   * @returns Promise that resolves to the updated new code period
   * @throws {AuthorizationError} If user lacks required permissions
   * @throws {ValidationError} If the request parameters are invalid
   * @throws {NotFoundError} If the project or branch is not found
   *
   * @example
   * ```typescript
   * // Set global default to previous version
   * await client.newCodePeriods.set({
   *   type: NewCodePeriodType.PREVIOUS_VERSION
   * });
   *
   * // Set project default to 30 days
   * await client.newCodePeriods.set({
   *   project: 'my-project',
   *   type: NewCodePeriodType.NUMBER_OF_DAYS,
   *   value: '30'
   * });
   *
   * // Set branch-specific period to reference branch
   * await client.newCodePeriods.set({
   *   project: 'my-project',
   *   branch: 'feature-branch',
   *   type: NewCodePeriodType.REFERENCE_BRANCH,
   *   value: 'main'
   * });
   * ```
   */
  async set(request: SetNewCodePeriodRequest): Promise<SetNewCodePeriodResponse> {
    const formData = new URLSearchParams();
    formData.append('type', request.type);

    if (request.project !== undefined) {
      formData.append('project', request.project);
    }

    if (request.branch !== undefined) {
      formData.append('branch', request.branch);
    }

    if (request.value !== undefined) {
      formData.append('value', request.value);
    }

    const response = await this.request<SetNewCodePeriodResponse>('/api/new_code_periods/set', {
      method: 'POST',
      body: formData,
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });

    return response;
  }

  /**
   * Removes the new code period setting for a project or branch.
   * This will make the project or branch inherit from the parent level.
   *
   * Requires 'Administer' rights on the specified project.
   *
   * @param request - Request parameters
   * @returns Promise that resolves when the setting is removed
   * @throws {AuthorizationError} If user lacks administer permission on the project
   * @throws {NotFoundError} If the project or branch is not found
   *
   * @example
   * ```typescript
   * // Remove project-specific setting (inherit from global)
   * await client.newCodePeriods.unset({
   *   project: 'my-project'
   * });
   *
   * // Remove branch-specific setting (inherit from project)
   * await client.newCodePeriods.unset({
   *   project: 'my-project',
   *   branch: 'feature-branch'
   * });
   * ```
   */
  async unset(request: UnsetNewCodePeriodRequest): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('project', request.project);

    if (request.branch !== undefined) {
      formData.append('branch', request.branch);
    }

    await this.request('/api/new_code_periods/unset', {
      method: 'POST',
      body: formData,
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });
  }
}
