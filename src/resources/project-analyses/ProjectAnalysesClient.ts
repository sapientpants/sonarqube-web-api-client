import { BaseClient } from '../../core/BaseClient';
import { ValidationError } from '../../errors';
import { SearchProjectAnalysesBuilder } from './builders';
import type {
  CreateEventRequest,
  CreateEventResponse,
  DeleteAnalysisRequest,
  DeleteEventRequest,
  ProjectAnalysis,
  SearchAnalysesResponse,
  SetBaselineRequest,
  UnsetBaselineRequest,
  UpdateEventRequest,
  UpdateEventResponse,
} from './types';

/**
 * Client for interacting with the SonarQube Project Analyses API.
 * Provides methods for managing project analyses and their events.
 */
export class ProjectAnalysesClient extends BaseClient {
  /**
   * Create a project analysis event.
   * Only events of category 'VERSION' and 'OTHER' can be created.
   *
   * @param params - The event creation parameters
   * @returns The created event details
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {ValidationError} If the event name exceeds 400 characters
   *
   * @example
   * ```typescript
   * // Create a version event
   * const event = await client.projectAnalyses.createEvent({
   *   analysis: 'AU-Tpxb--iU5OvuD2FLy',
   *   category: 'VERSION',
   *   name: '5.6'
   * });
   *
   * // Create an other event (default category)
   * const event = await client.projectAnalyses.createEvent({
   *   analysis: 'AU-Tpxb--iU5OvuD2FLy',
   *   name: 'Deployment to production'
   * });
   * ```
   */
  async createEvent(params: CreateEventRequest): Promise<CreateEventResponse> {
    // Validate name length
    if (params.name.length > 400) {
      throw new ValidationError('Event name cannot exceed 400 characters');
    }

    // Validate category if provided
    if (params.category && !['VERSION', 'OTHER'].includes(params.category)) {
      throw new ValidationError("Only events of category 'VERSION' and 'OTHER' can be created");
    }

    const body: Record<string, string> = {
      analysis: params.analysis,
      name: params.name,
    };

    if (params.category) {
      body['category'] = params.category;
    }

    return this.request<CreateEventResponse>('/api/project_analyses/create_event', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Delete a project analysis.
   *
   * @param params - The analysis deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the analysis doesn't exist
   *
   * @example
   * ```typescript
   * await client.projectAnalyses.deleteAnalysis({
   *   analysis: 'AU-TpxcA-iU5OvuD2FL1'
   * });
   * ```
   */
  async deleteAnalysis(params: DeleteAnalysisRequest): Promise<void> {
    await this.request('/api/project_analyses/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a project analysis event.
   * Only events of category 'VERSION' and 'OTHER' can be deleted.
   *
   * @param params - The event deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the event doesn't exist
   * @throws {ValidationError} If trying to delete an event that cannot be deleted
   *
   * @example
   * ```typescript
   * await client.projectAnalyses.deleteEvent({
   *   event: 'AU-TpxcA-iU5OvuD2FLz'
   * });
   * ```
   */
  async deleteEvent(params: DeleteEventRequest): Promise<void> {
    await this.request('/api/project_analyses/delete_event', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search project analyses and attached events.
   *
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Browse' permission on the project
   *
   * @example
   * ```typescript
   * // Search analyses for a project
   * const analyses = await client.projectAnalyses.search()
   *   .project('my-project')
   *   .execute();
   *
   * // Search analyses with filters
   * const analyses = await client.projectAnalyses.search()
   *   .project('my-project')
   *   .branch('main')
   *   .category('VERSION')
   *   .from('2024-01-01')
   *   .pageSize(50)
   *   .execute();
   *
   * // Iterate through all analyses
   * for await (const analysis of client.projectAnalyses.search()
   *   .project('my-project')
   *   .all()) {
   *   console.log(`Analysis ${analysis.key} on ${analysis.date}`);
   *   analysis.events.forEach(event => {
   *     console.log(`  Event: ${event.name} (${event.category})`);
   *   });
   * }
   * ```
   */
  search(): SearchProjectAnalysesBuilder {
    return new SearchProjectAnalysesBuilder(async (params) => {
      const query = new URLSearchParams();

      // Required parameter
      query.append('project', params.project);

      // Optional parameters
      if (params.branch !== undefined) {
        query.append('branch', params.branch);
      }
      if (params.category !== undefined) {
        query.append('category', params.category);
      }
      if (params.from !== undefined) {
        query.append('from', params.from);
      }
      if (params.to !== undefined) {
        query.append('to', params.to);
      }
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }

      return this.request<SearchAnalysesResponse>(
        `/api/project_analyses/search?${query.toString()}`
      );
    });
  }

  /**
   * Convenience method to iterate through all project analyses.
   * This is equivalent to calling search().project(key).all()
   *
   * @param projectKey - The project key
   * @returns An async iterator for all analyses
   *
   * @example
   * ```typescript
   * for await (const analysis of client.projectAnalyses.searchAll('my-project')) {
   *   console.log(`Analysis ${analysis.key} on ${analysis.date}`);
   * }
   * ```
   */
  searchAll(projectKey: string): AsyncIterableIterator<ProjectAnalysis> {
    return this.search().project(projectKey).all();
  }

  /**
   * Set an analysis as the baseline of the New Code Period on a project or branch.
   * This manually set baseline overrides the `sonar.leak.period` setting.
   *
   * @param params - The baseline setting parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the analysis or project doesn't exist
   *
   * @example
   * ```typescript
   * // Set baseline for the entire project
   * await client.projectAnalyses.setBaseline({
   *   analysis: 'AU-Tpxb--iU5OvuD2FLy',
   *   project: 'my-project'
   * });
   *
   * // Set baseline for a specific branch
   * await client.projectAnalyses.setBaseline({
   *   analysis: 'AU-Tpxb--iU5OvuD2FLy',
   *   project: 'my-project',
   *   branch: 'feature/new-code'
   * });
   * ```
   */
  async setBaseline(params: SetBaselineRequest): Promise<void> {
    await this.request('/api/project_analyses/set_baseline', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Unset any manually-set New Code Period baseline on a project or branch.
   * Unsetting a manual baseline restores the use of the `sonar.leak.period` setting.
   *
   * @param params - The baseline unsetting parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the project doesn't exist
   *
   * @example
   * ```typescript
   * // Unset baseline for the entire project
   * await client.projectAnalyses.unsetBaseline({
   *   project: 'my-project'
   * });
   *
   * // Unset baseline for a specific branch
   * await client.projectAnalyses.unsetBaseline({
   *   project: 'my-project',
   *   branch: 'feature/new-code'
   * });
   * ```
   */
  async unsetBaseline(params: UnsetBaselineRequest): Promise<void> {
    await this.request('/api/project_analyses/unset_baseline', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a project analysis event.
   * Only events of category 'VERSION' and 'OTHER' can be updated.
   *
   * @param params - The event update parameters
   * @returns The updated event details
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the project
   * @throws {NotFoundError} If the event doesn't exist
   * @throws {ValidationError} If the event name exceeds 400 characters or event cannot be updated
   *
   * @example
   * ```typescript
   * const updatedEvent = await client.projectAnalyses.updateEvent({
   *   event: 'AU-TpxcA-iU5OvuD2FL5',
   *   name: '5.6.1'
   * });
   * ```
   */
  async updateEvent(params: UpdateEventRequest): Promise<UpdateEventResponse> {
    // Validate name length
    if (params.name.length > 400) {
      throw new ValidationError('Event name cannot exceed 400 characters');
    }

    return this.request<UpdateEventResponse>('/api/project_analyses/update_event', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
