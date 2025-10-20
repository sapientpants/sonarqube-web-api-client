import { BaseBuilder, PaginatedBuilder, ParameterHelpers } from '../../core/builders/index.js';
import { ValidationError } from '../../errors/index.js';
import type {
  SearchGlobalPermissionsRequest,
  SearchGlobalPermissionsResponse,
  SearchProjectPermissionsRequest,
  SearchProjectPermissionsResponse,
  SearchTemplatesRequest,
  SearchTemplatesResponse,
  BulkApplyTemplateRequest,
  UserPermission,
  PermissionEntry,
} from './types.js';

/**
 * Builder for constructing global permissions search requests.
 *
 * @deprecated Since 6.5
 *
 * @example
 * ```typescript
 * // Search all global permissions
 * const results = await client.permissions.searchGlobalPermissions()
 *   .execute();
 *
 * // Search with query filter
 * const adminPermissions = await client.permissions.searchGlobalPermissions()
 *   .query('admin')
 *   .execute();
 *
 * // Search with pagination
 * const permissions = await client.permissions.searchGlobalPermissions()
 *   .pageSize(50)
 *   .query('user')
 *   .execute();
 * ```
 */
export class SearchGlobalPermissionsBuilder extends PaginatedBuilder<
  SearchGlobalPermissionsRequest,
  SearchGlobalPermissionsResponse,
  PermissionEntry
> {
  /**
   * Set the organization key
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Set the search query to filter permissions
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Execute the search request and return the response
   */
  async execute(): Promise<SearchGlobalPermissionsResponse> {
    return await this.executor(this.params as SearchGlobalPermissionsRequest);
  }

  /**
   * Get the items from the response for pagination
   */
  protected getItems(response: SearchGlobalPermissionsResponse): PermissionEntry[] {
    return Array.isArray(response.permissions) ? response.permissions : [];
  }
}

/**
 * Builder for constructing paginated project permissions search requests.
 *
 * @deprecated Since 6.5
 *
 * @example
 * ```typescript
 * // Search with pagination
 * const results = await client.permissions.searchProjectPermissions()
 *   .projectKey('my-project')
 *   .pageSize(50)
 *   .query('john')
 *   .execute();
 *
 * // Search by project ID
 * const permissions = await client.permissions.searchProjectPermissions()
 *   .projectId('uuid-123')
 *   .execute();
 *
 * // Iterate through all users
 * for await (const user of client.permissions.searchProjectPermissions().projectKey('my-project').all()) {
 *   console.log(user.login);
 * }
 * ```
 */
export class SearchProjectPermissionsBuilder extends PaginatedBuilder<
  SearchProjectPermissionsRequest,
  SearchProjectPermissionsResponse,
  UserPermission
> {
  /**
   * Set the project ID to search permissions for
   */
  projectId = ParameterHelpers.createStringMethod<typeof this>('projectId');

  /**
   * Set the project key to search permissions for
   */
  projectKey = ParameterHelpers.createStringMethod<typeof this>('projectKey');

  /**
   * Set the organization key
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Set the search query to filter users and groups
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Execute the search request and return the response
   */

  async execute(): Promise<SearchProjectPermissionsResponse> {
    return await this.executor(this.params as SearchProjectPermissionsRequest);
  }

  /**
   * Get the items from the response for pagination
   */

  protected getItems(response: SearchProjectPermissionsResponse): UserPermission[] {
    return Array.isArray(response.users) ? response.users : [];
  }
}

/**
 * Builder for constructing permission template search requests.
 *
 * @example
 * ```typescript
 * // Search templates by query
 * const templates = await client.permissions.searchTemplates()
 *   .query('mobile')
 *   .execute();
 *
 * // Get all templates
 * const allTemplates = await client.permissions.searchTemplates()
 *   .execute();
 *
 * // Search with organization filter
 * const orgTemplates = await client.permissions.searchTemplates()
 *   .organization('my-org')
 *   .query('project')
 *   .execute();
 * ```
 */
export class SearchTemplatesBuilder extends BaseBuilder<
  SearchTemplatesRequest,
  SearchTemplatesResponse
> {
  /**
   * Set the search query to filter templates by name
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Set the organization key
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Execute the search request and return the response
   */
  async execute(): Promise<SearchTemplatesResponse> {
    return await this.executor(this.params as SearchTemplatesRequest);
  }
}

/**
 * Builder for constructing bulk permission template apply requests.
 *
 * @example
 * ```typescript
 * // Apply template to specific projects
 * await client.permissions.bulkApplyTemplate()
 *   .templateName('Mobile Projects Template')
 *   .projects(['project1', 'project2'])
 *   .execute();
 *
 * // Apply to projects matching query
 * await client.permissions.bulkApplyTemplate()
 *   .templateId('template-uuid')
 *   .query('mobile')
 *   .qualifiers('TRK')
 *   .onProvisionedOnly(true)
 *   .execute();
 *
 * // Apply to projects analyzed before a date
 * await client.permissions.bulkApplyTemplate()
 *   .templateName('Legacy Template')
 *   .analyzedBefore('2024-01-01')
 *   .execute();
 * ```
 */
export class BulkApplyTemplateBuilder extends BaseBuilder<BulkApplyTemplateRequest> {
  /**
   * Set the template ID to apply
   */
  templateId = ParameterHelpers.createStringMethod<typeof this>('templateId');

  /**
   * Set the template name to apply
   */
  templateName = ParameterHelpers.createStringMethod<typeof this>('templateName');

  /**
   * Set the organization key
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Set the search query to filter projects
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Set the qualifiers filter (e.g., 'TRK' for projects)
   */
  qualifiers = ParameterHelpers.createStringMethod<typeof this>('qualifiers');

  /**
   * Filter for projects on provisioned only
   * @param value - Whether to filter for provisioned projects only (default: true)
   */
  onProvisionedOnly = ParameterHelpers.createBooleanMethod<typeof this>('onProvisionedOnly', true);

  /**
   * Set the analyzed before date filter (ISO date string)
   * @param date - ISO date string (e.g., '2024-01-01')
   */
  analyzedBefore(date: string): this {
    return this.setParam('analyzedBefore', date);
  }

  /**
   * Set specific project keys to apply the template to (max 1000)
   * @param projectKeys - Array of project keys
   * @throws {ValidationError} If more than 1000 projects are provided
   */
  projects(projectKeys: string[]): this {
    if (projectKeys.length > 1000) {
      throw new ValidationError('Maximum of 1000 projects can be specified', 'projects');
    }
    return this.setParam('projects', projectKeys);
  }

  /**
   * Execute the bulk apply template request
   * @throws {ValidationError} If required parameters are missing or invalid
   */
  async execute(): Promise<void> {
    this.validateParams();
    await this.executor(this.params as BulkApplyTemplateRequest);
  }

  /**
   * Validate the request parameters before execution
   */
  private validateParams(): void {
    const hasTemplate =
      (this.params.templateId ?? '') !== '' || (this.params.templateName ?? '') !== '';
    if (!hasTemplate) {
      throw new ValidationError('Either templateId or templateName must be provided', 'template');
    }

    // Check for conflicting project selection methods
    const hasProjects = (this.params.projects?.length ?? 0) > 0;
    const hasQuery = (this.params.q ?? '').length > 0;
    const hasAnalyzedBefore = (this.params.analyzedBefore ?? '').length > 0;
    const hasProvisionedOnly = this.params.onProvisionedOnly !== undefined;

    const selectionMethods = [hasProjects, hasQuery, hasAnalyzedBefore, hasProvisionedOnly].filter(
      Boolean,
    );

    if (selectionMethods.length === 0) {
      throw new ValidationError(
        'At least one project selection method must be specified (projects, query, analyzedBefore, or onProvisionedOnly)',
        'projectSelection',
      );
    }
  }
}
