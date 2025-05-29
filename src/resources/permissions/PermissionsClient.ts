import { BaseClient } from '../../core/BaseClient';
import {
  SearchProjectPermissionsBuilder,
  SearchTemplatesBuilder,
  BulkApplyTemplateBuilder,
} from './builders';
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
  SearchGlobalPermissionsRequest,
  SearchGlobalPermissionsResponse,
  CreateTemplateResponse,
  UpdateTemplateResponse,
} from './types';

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

    if (params.projectId) {
      query.append('projectId', params.projectId);
    }
    if (params.projectKey) {
      query.append('projectKey', params.projectKey);
    }

    await this.request<void>(`/api/permissions/add_user?${query}`, {
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

    if (params.projectId) {
      query.append('projectId', params.projectId);
    }
    if (params.projectKey) {
      query.append('projectKey', params.projectKey);
    }

    await this.request<void>(`/api/permissions/remove_user?${query}`, {
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

    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/add_user_to_template?${query}`, {
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

    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/remove_user_from_template?${query}`, {
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

    if (params.groupName) {
      query.append('groupName', params.groupName);
    }
    if (params.groupId) {
      query.append('groupId', params.groupId);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.projectId) {
      query.append('projectId', params.projectId);
    }
    if (params.projectKey) {
      query.append('projectKey', params.projectKey);
    }

    await this.request<void>(`/api/permissions/add_group?${query}`, {
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

    if (params.groupName) {
      query.append('groupName', params.groupName);
    }
    if (params.groupId) {
      query.append('groupId', params.groupId);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.projectId) {
      query.append('projectId', params.projectId);
    }
    if (params.projectKey) {
      query.append('projectKey', params.projectKey);
    }

    await this.request<void>(`/api/permissions/remove_group?${query}`, {
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

    if (params.groupName) {
      query.append('groupName', params.groupName);
    }
    if (params.groupId) {
      query.append('groupId', params.groupId);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/add_group_to_template?${query}`, {
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

    if (params.groupName) {
      query.append('groupName', params.groupName);
    }
    if (params.groupId) {
      query.append('groupId', params.groupId);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/remove_group_from_template?${query}`, {
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

    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/add_project_creator_to_template?${query}`, {
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
    params: RemoveProjectCreatorFromTemplateRequest
  ): Promise<void> {
    const query = new URLSearchParams();
    query.append('permission', params.permission);

    if (params.organization) {
      query.append('organization', params.organization);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }

    await this.request<void>(`/api/permissions/remove_project_creator_from_template?${query}`, {
      method: 'POST',
    });
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

    if (params.description) {
      query.append('description', params.description);
    }
    if (params.projectKeyPattern) {
      query.append('projectKeyPattern', params.projectKeyPattern);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }

    return await this.request<CreateTemplateResponse>(`/api/permissions/create_template?${query}`, {
      method: 'POST',
    });
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

    if (params.name) {
      query.append('name', params.name);
    }
    if (params.description) {
      query.append('description', params.description);
    }
    if (params.projectKeyPattern) {
      query.append('projectKeyPattern', params.projectKeyPattern);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }

    return await this.request<UpdateTemplateResponse>(`/api/permissions/update_template?${query}`, {
      method: 'POST',
    });
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

    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }

    await this.request<void>(`/api/permissions/delete_template?${query}`, {
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

    if (params.projectId) {
      query.append('projectId', params.projectId);
    }
    if (params.projectKey) {
      query.append('projectKey', params.projectKey);
    }
    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }

    await this.request<void>(`/api/permissions/apply_template?${query}`, {
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

    if (params.templateId) {
      query.append('templateId', params.templateId);
    }
    if (params.templateName) {
      query.append('templateName', params.templateName);
    }
    if (params.qualifier) {
      query.append('qualifier', params.qualifier);
    }
    if (params.organization) {
      query.append('organization', params.organization);
    }

    await this.request<void>(`/api/permissions/set_default_template?${query}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // SEARCH OPERATIONS (SIMPLE)
  // ============================================================================

  /**
   * List global permissions.
   *
   * @deprecated Since 6.5
   * @param params - Parameters for searching global permissions
   * @returns Global permissions response
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user lacks 'Administer System' permission
   * @throws {ValidationError} If required parameters are missing
   * @throws {ApiError} If the API request fails
   *
   * @example
   * ```typescript
   * const permissions = await client.permissions.searchGlobalPermissions({
   *   organization: 'my-org'
   * });
   * ```
   */

  async searchGlobalPermissions(
    params: SearchGlobalPermissionsRequest
  ): Promise<SearchGlobalPermissionsResponse> {
    const query = new URLSearchParams();
    query.append('organization', params.organization);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return await this.request<SearchGlobalPermissionsResponse>(
      `/api/permissions/search_global_permissions?${query}`,
      {
        method: 'GET',
      }
    );
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
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  searchProjectPermissions(): SearchProjectPermissionsBuilder {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return new SearchProjectPermissionsBuilder(async (params) => {
      const query = new URLSearchParams();

      if (params.projectId !== undefined) {
        query.append('projectId', params.projectId);
      }
      if (params.projectKey !== undefined) {
        query.append('projectKey', params.projectKey);
      }
      if (params.p !== undefined) {
        query.append('p', params.p.toString());
      }
      if (params.ps !== undefined) {
        query.append('ps', params.ps.toString());
      }
      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      if (params.organization !== undefined) {
        query.append('organization', params.organization);
      }

      return await this.request<any>(`/api/permissions/search_project_permissions?${query}`, {
        method: 'GET',
      });
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

      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      if (params.organization !== undefined) {
        query.append('organization', params.organization);
      }

      return await this.request<any>(`/api/permissions/search_templates?${query}`, {
        method: 'GET',
      });
    });
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

      if (params.templateId !== undefined) {
        query.append('templateId', params.templateId);
      }
      if (params.templateName !== undefined) {
        query.append('templateName', params.templateName);
      }
      if (params.analyzedBefore !== undefined) {
        query.append('analyzedBefore', params.analyzedBefore);
      }
      if (params.onProvisionedOnly !== undefined) {
        query.append('onProvisionedOnly', params.onProvisionedOnly.toString());
      }
      if (params.projects !== undefined) {
        query.append('projects', params.projects.join(','));
      }
      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      if (params.qualifiers !== undefined) {
        query.append('qualifiers', params.qualifiers);
      }
      if (params.organization !== undefined) {
        query.append('organization', params.organization);
      }

      await this.request<void>(`/api/permissions/bulk_apply_template?${query}`, {
        method: 'POST',
      });
    });
  }
}
