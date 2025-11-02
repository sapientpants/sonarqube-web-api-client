import { BaseClient } from '../../core/BaseClient.js';
import { DeprecationManager } from '../../core/deprecation/index.js';
import {
  SearchGlobalPermissionsBuilder,
  SearchProjectPermissionsBuilder,
  SearchTemplatesBuilder,
  BulkApplyTemplateBuilder,
} from './builders.js';
import { addParamIfValid } from './helpers.js';
import type {
  AddUserPermissionRequest,
  RemoveUserPermissionRequest,
  AddUserToTemplateRequest,
  RemoveUserFromTemplateRequest,
  AddGroupPermissionRequest,
  RemoveGroupPermissionRequest,
  AddGroupToTemplateRequest,
  RemoveGroupFromTemplateRequest,
  AddProjectCreatorToTemplateRequest,
  RemoveProjectCreatorFromTemplateRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  DeleteTemplateRequest,
  ApplyTemplateRequest,
  SetDefaultTemplateRequest,
  SearchGlobalPermissionsResponse,
  CreateTemplateResponse,
  UpdateTemplateResponse,
} from './types.js';

// Constants for repeated parameter names
const PARAM_PROJECT_ID = 'projectId';

// Constants for deprecation messages
const DEPRECATION_REASON_ENDPOINT_REMOVED =
  'This endpoint has been deprecated and will be removed.';

/**
 * Client for interacting with the SonarQube Permissions API.
 * Manages permission templates, and the granting and revoking of permissions
 * at the global and project levels.
 */
export class PermissionsClient extends BaseClient {
  // ============================================================================
  // USER PERMISSION OPERATIONS
  // ============================================================================

  /**
   * Add permission to a user.
   * This service defaults to global permissions, but can be limited to project
   * permissions by providing project id or project key.
   *
   * @param params - Parameters for adding user permission
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the specified project
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Add global permission
   * await client.permissions.addUserPermission({
   *   login: 'john.doe',
   *   permission: 'scan',
   *   organization: 'my-org'
   * });
   *
   * // Add project permission
   * await client.permissions.addUserPermission({
   *   login: 'john.doe',
   *   permission: 'codeviewer',
   *   projectKey: 'my-project',
   *   organization: 'my-org'
   * });
   * ```
   */
  async addUserPermission(params: AddUserPermissionRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('login', params.login);
    query.append('permission', params.permission);
    query.append('organization', params.organization);

    addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
    addParamIfValid(query, 'projectKey', params.projectKey);

    await this.request(`/api/permissions/add_user?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Remove permission from a user.
   * This service defaults to global permissions, but can be limited to project
   * permissions by providing project id or project key.
   *
   * @param params - Parameters for removing user permission
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the specified project
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Remove global permission
   * await client.permissions.removeUserPermission({
   *   login: 'john.doe',
   *   permission: 'scan',
   *   organization: 'my-org'
   * });
   *
   * // Remove project permission
   * await client.permissions.removeUserPermission({
   *   login: 'john.doe',
   *   permission: 'codeviewer',
   *   projectKey: 'my-project',
   *   organization: 'my-org'
   * });
   * ```
   */
  async removeUserPermission(params: RemoveUserPermissionRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('login', params.login);
    query.append('permission', params.permission);
    query.append('organization', params.organization);

    addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
    addParamIfValid(query, 'projectKey', params.projectKey);

    await this.request(`/api/permissions/remove_user?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Add a user to a permission template.
   *
   * @param params - Parameters for adding user to template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.addUserToTemplate({
   *   login: 'john.doe',
   *   permission: 'codeviewer',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async addUserToTemplate(params: AddUserToTemplateRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('login', params.login);
    query.append('permission', params.permission);

    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(`/api/permissions/add_user_to_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Remove a user from a permission template.
   *
   * @param params - Parameters for removing user from template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.removeUserFromTemplate({
   *   login: 'john.doe',
   *   permission: 'codeviewer',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async removeUserFromTemplate(params: RemoveUserFromTemplateRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('login', params.login);
    query.append('permission', params.permission);

    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(`/api/permissions/remove_user_from_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // GROUP PERMISSION OPERATIONS
  // ============================================================================

  /**
   * Add permission to a group.
   * This service defaults to global permissions, but can be limited to project
   * permissions by providing project id or project key.
   * The group name or group id must be provided.
   *
   * @param params - Parameters for adding group permission
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the specified project
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Add global permission to group
   * await client.permissions.addGroupPermission({
   *   groupName: 'developers',
   *   permission: 'scan',
   *   organization: 'my-org'
   * });
   *
   * // Add project permission to 'anyone'
   * await client.permissions.addGroupPermission({
   *   groupName: 'anyone',
   *   permission: 'codeviewer',
   *   projectKey: 'my-project'
   * });
   * ```
   */
  async addGroupPermission(params: AddGroupPermissionRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'groupName', params.groupName);
    addParamIfValid(query, 'groupId', params.groupId);
    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
    addParamIfValid(query, 'projectKey', params.projectKey);

    await this.request(`/api/permissions/add_group?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Remove a permission from a group.
   * This service defaults to global permissions, but can be limited to project
   * permissions by providing project id or project key.
   * The group id or group name must be provided, not both.
   *
   * @param params - Parameters for removing group permission
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the specified project
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Remove global permission from group
   * await client.permissions.removeGroupPermission({
   *   groupName: 'developers',
   *   permission: 'scan',
   *   organization: 'my-org'
   * });
   * ```
   */
  async removeGroupPermission(params: RemoveGroupPermissionRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'groupName', params.groupName);
    addParamIfValid(query, 'groupId', params.groupId);
    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
    addParamIfValid(query, 'projectKey', params.projectKey);

    await this.request(`/api/permissions/remove_group?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Add a group to a permission template.
   * The group id or group name must be provided.
   *
   * @param params - Parameters for adding group to template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.addGroupToTemplate({
   *   groupName: 'developers',
   *   permission: 'codeviewer',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async addGroupToTemplate(params: AddGroupToTemplateRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'groupName', params.groupName);
    addParamIfValid(query, 'groupId', params.groupId);
    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(`/api/permissions/add_group_to_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Remove a group from a permission template.
   * The group id or group name must be provided.
   *
   * @param params - Parameters for removing group from template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.removeGroupFromTemplate({
   *   groupName: 'developers',
   *   permission: 'codeviewer',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async removeGroupFromTemplate(params: RemoveGroupFromTemplateRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'groupName', params.groupName);
    addParamIfValid(query, 'groupId', params.groupId);
    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(`/api/permissions/remove_group_from_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // PROJECT CREATOR OPERATIONS
  // ============================================================================

  /**
   * Add a project creator to a permission template.
   *
   * @param params - Parameters for adding project creator to template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.addProjectCreatorToTemplate({
   *   permission: 'admin',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async addProjectCreatorToTemplate(params: AddProjectCreatorToTemplateRequest): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(`/api/permissions/add_project_creator_to_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Remove a project creator from a permission template.
   *
   * @param params - Parameters for removing project creator from template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.removeProjectCreatorFromTemplate({
   *   permission: 'admin',
   *   templateName: 'Default Template'
   * });
   * ```
   */
  async removeProjectCreatorFromTemplate(
    params: RemoveProjectCreatorFromTemplateRequest,
  ): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    addParamIfValid(query, 'organization', params.organization);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);

    await this.request(
      `/api/permissions/remove_project_creator_from_template?${query.toString()}`,
      {
        method: 'POST',
      },
    );
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Create a permission template.
   *
   * @param params - Parameters for creating template
   * @returns The created permission template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * const template = await client.permissions.createTemplate({
   *   name: 'Mobile Projects Template',
   *   description: 'Template for mobile application projects',
   *   projectKeyPattern: '.*mobile.*'
   * });
   * ```
   */
  async createTemplate(params: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    const query = new URLSearchParams();
    query.append('name', params.name);

    addParamIfValid(query, 'description', params.description);
    addParamIfValid(query, 'projectKeyPattern', params.projectKeyPattern);
    addParamIfValid(query, 'organization', params.organization);

    return await this.request<CreateTemplateResponse>(
      `/api/permissions/create_template?${query.toString()}`,
      {
        method: 'POST',
      },
    );
  }

  /**
   * Update a permission template.
   *
   * @param params - Parameters for updating template
   * @returns The updated permission template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * const template = await client.permissions.updateTemplate({
   *   id: 'template-uuid',
   *   name: 'Updated Template Name',
   *   description: 'Updated description'
   * });
   * ```
   */
  async updateTemplate(params: UpdateTemplateRequest): Promise<UpdateTemplateResponse> {
    const query = new URLSearchParams();
    query.append('id', params.id);

    addParamIfValid(query, 'name', params.name);
    addParamIfValid(query, 'description', params.description);
    addParamIfValid(query, 'projectKeyPattern', params.projectKeyPattern);
    addParamIfValid(query, 'organization', params.organization);

    return await this.request<UpdateTemplateResponse>(
      `/api/permissions/update_template?${query.toString()}`,
      {
        method: 'POST',
      },
    );
  }

  /**
   * Delete a permission template.
   * The template id or name must be provided.
   *
   * @param params - Parameters for deleting template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.deleteTemplate({
   *   templateName: 'Old Template'
   * });
   * ```
   */
  async deleteTemplate(params: DeleteTemplateRequest): Promise<void> {
    const query = new URLSearchParams();

    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);
    addParamIfValid(query, 'organization', params.organization);

    await this.request(`/api/permissions/delete_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Apply a permission template to one project.
   * The project id or project key must be provided.
   * The template id or name must be provided.
   *
   * @param params - Parameters for applying template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.applyTemplate({
   *   projectKey: 'my-project',
   *   templateName: 'Mobile Projects Template'
   * });
   * ```
   */
  async applyTemplate(params: ApplyTemplateRequest): Promise<void> {
    const query = new URLSearchParams();

    addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
    addParamIfValid(query, 'projectKey', params.projectKey);
    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);
    addParamIfValid(query, 'organization', params.organization);

    await this.request(`/api/permissions/apply_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Set the default permission template.
   * The template id or name must be provided.
   *
   * @param params - Parameters for setting default template
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * await client.permissions.setDefaultTemplate({
   *   templateName: 'Default Template',
   *   qualifier: 'TRK'
   * });
   * ```
   */
  async setDefaultTemplate(params: SetDefaultTemplateRequest): Promise<void> {
    const query = new URLSearchParams();

    addParamIfValid(query, 'templateId', params.templateId);
    addParamIfValid(query, 'templateName', params.templateName);
    addParamIfValid(query, 'qualifier', params.qualifier);
    addParamIfValid(query, 'organization', params.organization);

    await this.request(`/api/permissions/set_default_template?${query.toString()}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // SEARCH OPERATIONS (SIMPLE)
  // ============================================================================

  /**
   * List global permissions.
   * Returns a builder for constructing the search request.
   *
   * @deprecated Since 6.5
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer System' permission
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Search all global permissions
   * const permissions = await client.permissions.searchGlobalPermissions()
   *   .execute();
   *
   * // Search with query filter
   * const adminPermissions = await client.permissions.searchGlobalPermissions()
   *   .query('admin')
   *   .execute();
   * ```
   */
  searchGlobalPermissions(): SearchGlobalPermissionsBuilder {
    DeprecationManager.warn({
      api: 'permissions.searchGlobalPermissions()',
      removeVersion: '6.5',
      reason: DEPRECATION_REASON_ENDPOINT_REMOVED,
    });

    return new SearchGlobalPermissionsBuilder(async (params) => {
      const query = new URLSearchParams();

      addParamIfValid(query, 'organization', params.organization);
      addParamIfValid(query, 'q', params.q);
      if (params.p !== undefined) {
        query.append('p', params.p.toString());
      }
      if (params.ps !== undefined) {
        query.append('ps', params.ps.toString());
      }

      return await this.request<SearchGlobalPermissionsResponse>(
        `/api/permissions/search_global_permissions?${query.toString()}`,
        {
          method: 'GET',
        },
      );
    });
  }

  // ============================================================================
  // COMPLEX SEARCH OPERATIONS (BUILDERS)
  // ============================================================================

  /**
   * Search project permissions with pagination and filtering.
   * Returns a builder for constructing the search request.
   *
   * @deprecated Since 6.5
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks appropriate permissions
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
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
   * // Iterate through all results
   * for await (const user of client.permissions.searchProjectPermissions().projectKey('my-project').all()) {
   *   console.log(user.login);
   * }
   * ```
   */

  searchProjectPermissions(): SearchProjectPermissionsBuilder {
    DeprecationManager.warn({
      api: 'permissions.searchProjectPermissions()',
      removeVersion: '6.5',
      reason: DEPRECATION_REASON_ENDPOINT_REMOVED,
    });

    return new SearchProjectPermissionsBuilder(async (params) => {
      const query = new URLSearchParams();

      addParamIfValid(query, PARAM_PROJECT_ID, params.projectId);
      addParamIfValid(query, 'projectKey', params.projectKey);
      if (params.p !== undefined) {
        query.append('p', params.p.toString());
      }
      if (params.ps !== undefined) {
        query.append('ps', params.ps.toString());
      }
      addParamIfValid(query, 'q', params.q);
      addParamIfValid(query, 'organization', params.organization);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return await this.request<any>(
        `/api/permissions/search_project_permissions?${query.toString()}`,
        {
          method: 'GET',
        },
      );
    });
  }

  /**
   * Search permission templates.
   * Returns a builder for constructing the search request.
   *
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
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
   * ```
   */
  searchTemplates(): SearchTemplatesBuilder {
    return new SearchTemplatesBuilder(async (params) => {
      const query = new URLSearchParams();

      addParamIfValid(query, 'q', params.q);
      addParamIfValid(query, 'organization', params.organization);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return await this.request<any>(`/api/permissions/search_templates?${query.toString()}`, {
        method: 'GET',
      });
    });
  }

  /**
   * Search permission templates.
   * Alias for searchTemplates() method.
   * Returns a builder for constructing the search request.
   *
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Search templates by query
   * const templates = await client.permissions.searchPermissionTemplates()
   *   .query('mobile')
   *   .execute();
   *
   * // Get all templates
   * const allTemplates = await client.permissions.searchPermissionTemplates()
   *   .execute();
   * ```
   */
  searchPermissionTemplates(): SearchTemplatesBuilder {
    return this.searchTemplates();
  }

  /**
   * Apply a permission template to multiple projects with complex filtering.
   * Returns a builder for constructing the bulk apply request.
   *
   * @returns A builder for constructing the bulk apply request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer' permission on the organization
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * // Apply template to projects with complex filtering
   * await client.permissions.bulkApplyTemplate()
   *   .templateName('Mobile Projects Template')
   *   .projects(['project1', 'project2'])
   *   .onProvisionedOnly(true)
   *   .execute();
   *
   * // Apply to projects matching query
   * await client.permissions.bulkApplyTemplate()
   *   .templateId('template-uuid')
   *   .query('mobile')
   *   .qualifiers('TRK')
   *   .execute();
   * ```
   */
  bulkApplyTemplate(): BulkApplyTemplateBuilder {
    return new BulkApplyTemplateBuilder(async (params) => {
      const query = new URLSearchParams();

      addParamIfValid(query, 'templateId', params.templateId);
      addParamIfValid(query, 'templateName', params.templateName);
      addParamIfValid(query, 'analyzedBefore', params.analyzedBefore);
      if (params.onProvisionedOnly !== undefined) {
        query.append('onProvisionedOnly', params.onProvisionedOnly.toString());
      }
      if (params.projects !== undefined) {
        query.append('projects', params.projects.join(','));
      }
      addParamIfValid(query, 'q', params.q);
      addParamIfValid(query, 'qualifiers', params.qualifiers);
      addParamIfValid(query, 'organization', params.organization);

      await this.request(`/api/permissions/bulk_apply_template?${query.toString()}`, {
        method: 'POST',
      });
    });
  }
}
