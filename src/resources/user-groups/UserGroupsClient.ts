import { BaseClient } from '../../core/BaseClient';
import { ValidationError } from '../../errors';
import { SearchUserGroupsBuilder, UsersBuilder } from './builders';
import type {
  AddUserRequest,
  CreateGroupRequest,
  CreateGroupResponse,
  DeleteGroupRequest,
  RemoveUserRequest,
  SearchGroupsResponse,
  UpdateGroupRequest,
  UserGroup,
  UsersResponse,
} from './types';

/**
 * Client for interacting with SonarQube User Groups API.
 * Provides methods for managing user groups.
 * @since API 5.2
 */
export class UserGroupsClient extends BaseClient {
  /**
   * Add a user to a group.
   * 'id' or 'name' must be provided.
   *
   * @since API 5.2
   * @param params - The add user parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If neither id nor name is provided
   * @throws {NotFoundError} If the group or user doesn't exist
   *
   * @example
   * ```typescript
   * // Add user by group ID
   * await client.userGroups.addUser({
   *   id: '42',
   *   login: 'john.doe',
   *   organization: 'my-org'
   * });
   *
   * // Add user by group name
   * await client.userGroups.addUser({
   *   name: 'sonar-administrators',
   *   login: 'jane.smith',
   *   organization: 'my-org'
   * });
   * ```
   */
  async addUser(params: AddUserRequest): Promise<void> {
    if (params.id === undefined && params.name === undefined) {
      throw new ValidationError('Either id or name must be provided');
    }
    await this.request('/api/user_groups/add_user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a group.
   *
   * @since API 5.2
   * @param params - The group creation parameters
   * @returns The created group details
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If the group name already exists or is invalid
   *
   * @example
   * ```typescript
   * const group = await client.userGroups.create({
   *   name: 'developers',
   *   description: 'All developers in the organization',
   *   organization: 'my-org'
   * });
   * ```
   */
  async create(params: CreateGroupRequest): Promise<CreateGroupResponse> {
    return this.request<CreateGroupResponse>('/api/user_groups/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a group. The default groups cannot be deleted.
   * 'id' or 'name' must be provided.
   *
   * @since API 5.2
   * @param params - The group deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If neither id nor name is provided, or if trying to delete a default group
   * @throws {NotFoundError} If the group doesn't exist
   *
   * @example
   * ```typescript
   * // Delete by ID
   * await client.userGroups.delete({ id: '42', organization: 'my-org' });
   *
   * // Delete by name
   * await client.userGroups.delete({ name: 'old-team', organization: 'my-org' });
   * ```
   */
  async delete(params: DeleteGroupRequest): Promise<void> {
    if (params.id === undefined && params.name === undefined) {
      throw new ValidationError('Either id or name must be provided');
    }
    await this.request('/api/user_groups/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Remove a user from a group.
   * 'id' or 'name' must be provided.
   *
   * @since API 5.2
   * @param params - The remove user parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If neither id nor name is provided
   * @throws {NotFoundError} If the group or user doesn't exist
   *
   * @example
   * ```typescript
   * // Remove user by group ID
   * await client.userGroups.removeUser({
   *   id: '42',
   *   login: 'john.doe',
   *   organization: 'my-org'
   * });
   *
   * // Remove user by group name
   * await client.userGroups.removeUser({
   *   name: 'sonar-administrators',
   *   login: 'jane.smith',
   *   organization: 'my-org'
   * });
   * ```
   */
  async removeUser(params: RemoveUserRequest): Promise<void> {
    if (params.id === undefined && params.name === undefined) {
      throw new ValidationError('Either id or name must be provided');
    }
    await this.request('/api/user_groups/remove_user', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search for user groups.
   *
   * @since API 5.2
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   *
   * @example
   * ```typescript
   * // Basic search
   * const groups = await client.userGroups.search()
   *   .organization('my-org')
   *   .query('admin')
   *   .pageSize(50)
   *   .execute();
   *
   * // Search with specific fields
   * const groups = await client.userGroups.search()
   *   .organization('my-org')
   *   .fields(['name', 'membersCount'])
   *   .execute();
   *
   * // Iterate through all groups
   * for await (const group of client.userGroups.search()
   *   .organization('my-org')
   *   .all()) {
   *   console.log(group.name);
   * }
   * ```
   */
  search(): SearchUserGroupsBuilder {
    return new SearchUserGroupsBuilder(async (params) => {
      const query = new URLSearchParams();
      query.append('organization', params.organization);
      if (params.f !== undefined) {
        query.append('f', params.f.join(','));
      }
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      return this.request<SearchGroupsResponse>(`/api/user_groups/search?${query.toString()}`);
    });
  }

  /**
   * Convenience method to iterate through all groups.
   * This is equivalent to calling search().organization(org).all()
   *
   * @param organization - The organization key
   * @returns An async iterator for all groups
   *
   * @example
   * ```typescript
   * for await (const group of client.userGroups.searchAll('my-org')) {
   *   console.log(group.name);
   * }
   * ```
   */
  searchAll(organization: string): AsyncIterableIterator<UserGroup> {
    return this.search().organization(organization).all();
  }

  /**
   * Update a group.
   * The default group is no longer editable since version 6.4.
   *
   * @since API 5.2
   * @param params - The group update parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   * @throws {ValidationError} If trying to update the default group or if the new name already exists
   * @throws {NotFoundError} If the group doesn't exist
   *
   * @example
   * ```typescript
   * // Update group name
   * await client.userGroups.update({
   *   id: '42',
   *   name: 'new-developers',
   *   description: 'Updated developer group'
   * });
   *
   * // Update only description
   * await client.userGroups.update({
   *   id: '42',
   *   description: 'Senior developers only'
   * });
   * ```
   */
  async update(params: UpdateGroupRequest): Promise<void> {
    await this.request('/api/user_groups/update', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search for users with membership information with respect to a group.
   * 'id' or 'name' must be provided.
   *
   * @since API 5.2
   * @returns A builder for constructing the users search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer System' permission
   *
   * @example
   * ```typescript
   * // Get members of a group by ID
   * const members = await client.userGroups.users()
   *   .groupId('42')
   *   .organization('my-org')
   *   .selected('selected')
   *   .execute();
   *
   * // Get all users with membership status for a group
   * const allUsers = await client.userGroups.users()
   *   .groupName('developers')
   *   .organization('my-org')
   *   .selected('all')
   *   .execute();
   *
   * // Search for specific users
   * const users = await client.userGroups.users()
   *   .group('sonar-administrators')
   *   .organization('my-org')
   *   .query('john')
   *   .execute();
   *
   * // Iterate through all users
   * for await (const user of client.userGroups.users()
   *   .groupName('developers')
   *   .organization('my-org')
   *   .all()) {
   *   console.log(`${user.login}: ${user.selected ? 'member' : 'not member'}`);
   * }
   * ```
   */
  users(): UsersBuilder {
    return new UsersBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.id !== undefined) {
        query.append('id', params.id);
      }
      if (params.name !== undefined) {
        query.append('name', params.name);
      }
      if (params.organization !== undefined) {
        query.append('organization', params.organization);
      }
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      if (params.q !== undefined) {
        query.append('q', params.q);
      }
      if (params.selected !== undefined) {
        query.append('selected', params.selected);
      }
      return this.request<UsersResponse>(`/api/user_groups/users?${query.toString()}`);
    });
  }
}
