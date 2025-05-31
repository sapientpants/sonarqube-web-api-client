import { BaseClient } from '../../core/BaseClient';
import { SearchGroupsV2Builder, SearchGroupMembershipsV2Builder } from './builders';
import type {
  GroupV2,
  CreateGroupV2Request,
  UpdateGroupV2Request,
  GroupMembershipV2,
  AddGroupMembershipV2Request,
  SearchGroupsV2Response,
  SearchGroupMembershipsV2Response,
} from './types';

/**
 * Client for interacting with the SonarQube Authorizations API v2.
 * This API consolidates group management and permissions under a unified interface.
 *
 * The Authorizations API replaces the separate UserGroups API from v1.
 *
 * @since 10.5
 */
export class AuthorizationsClient extends BaseClient {
  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  /**
   * Search for groups using the v2 API.
   *
   * @returns A builder for constructing the search request
   * @since 10.5
   *
   * @example
   * ```typescript
   * // Search for groups by name
   * const results = await client.authorizations.searchGroupsV2()
   *   .query('developers')
   *   .managed(false)
   *   .pageSize(50)
   *   .execute();
   *
   * // Get all default groups
   * const defaultGroups = await client.authorizations.searchGroupsV2()
   *   .includeDefault(true)
   *   .execute();
   *
   * // Iterate through all groups
   * for await (const group of client.authorizations.searchGroupsV2().all()) {
   *   console.log(group.name);
   * }
   * ```
   */
  searchGroupsV2(): SearchGroupsV2Builder {
    return new SearchGroupsV2Builder(async (params) => {
      const queryString = this.buildV2Query(params as Record<string, unknown>);
      const url = queryString
        ? `/api/v2/authorizations/groups?${queryString}`
        : '/api/v2/authorizations/groups';
      return this.request<SearchGroupsV2Response>(url);
    });
  }

  /**
   * Create a new group.
   *
   * Requires 'Administer System' permission.
   *
   * @param data - The group creation data
   * @returns The created group
   * @since 10.5
   *
   * @example
   * ```typescript
   * const newGroup = await client.authorizations.createGroupV2({
   *   name: 'frontend-developers',
   *   description: 'Frontend development team',
   *   default: false
   * });
   * ```
   */
  async createGroupV2(data: CreateGroupV2Request): Promise<GroupV2> {
    return this.request<GroupV2>('/api/v2/authorizations/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a single group by ID.
   *
   * @param id - The group ID (UUID)
   * @returns The group details
   * @since 10.5
   *
   * @example
   * ```typescript
   * const group = await client.authorizations.getGroupV2('550e8400-e29b-41d4-a716-446655440000');
   * ```
   */
  async getGroupV2(id: string): Promise<GroupV2> {
    return this.request<GroupV2>(`/api/v2/authorizations/groups/${id}`);
  }

  /**
   * Update an existing group.
   *
   * Requires 'Administer System' permission.
   * Only non-managed groups can be updated.
   *
   * @param id - The group ID (UUID)
   * @param data - The update data
   * @returns The updated group
   * @since 10.5
   *
   * @example
   * ```typescript
   * const updatedGroup = await client.authorizations.updateGroupV2(
   *   '550e8400-e29b-41d4-a716-446655440000',
   *   {
   *     name: 'senior-developers',
   *     description: 'Senior development team'
   *   }
   * );
   * ```
   */
  async updateGroupV2(id: string, data: UpdateGroupV2Request): Promise<GroupV2> {
    return this.request<GroupV2>(`/api/v2/authorizations/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a group.
   *
   * Requires 'Administer System' permission.
   * Only non-managed groups can be deleted.
   * Default groups cannot be deleted.
   *
   * @param id - The group ID (UUID)
   * @since 10.5
   *
   * @example
   * ```typescript
   * await client.authorizations.deleteGroupV2('550e8400-e29b-41d4-a716-446655440000');
   * ```
   */
  async deleteGroupV2(id: string): Promise<void> {
    await this.request(`/api/v2/authorizations/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // GROUP MEMBERSHIP MANAGEMENT
  // ============================================================================

  /**
   * Search for group memberships using the v2 API.
   *
   * @returns A builder for constructing the search request
   * @since 10.5
   *
   * @example
   * ```typescript
   * // Get all memberships for a specific group
   * const memberships = await client.authorizations.searchGroupMembershipsV2()
   *   .groupIds(['550e8400-e29b-41d4-a716-446655440000'])
   *   .execute();
   *
   * // Get all groups for a specific user
   * const userGroups = await client.authorizations.searchGroupMembershipsV2()
   *   .userIds(['user-uuid'])
   *   .execute();
   *
   * // Search with pagination
   * const page1 = await client.authorizations.searchGroupMembershipsV2()
   *   .page(1)
   *   .pageSize(100)
   *   .execute();
   * ```
   */
  searchGroupMembershipsV2(): SearchGroupMembershipsV2Builder {
    return new SearchGroupMembershipsV2Builder(async (params) => {
      const queryString = this.buildV2Query(params as Record<string, unknown>);
      const url = queryString
        ? `/api/v2/authorizations/group-memberships?${queryString}`
        : '/api/v2/authorizations/group-memberships';
      return this.request<SearchGroupMembershipsV2Response>(url);
    });
  }

  /**
   * Add a user to a group.
   *
   * Requires 'Administer System' permission.
   *
   * @param data - The membership data
   * @returns The created membership
   * @since 10.5
   *
   * @example
   * ```typescript
   * const membership = await client.authorizations.addGroupMembershipV2({
   *   groupId: '550e8400-e29b-41d4-a716-446655440000',
   *   userId: 'user-uuid'
   * });
   * ```
   */
  async addGroupMembershipV2(data: AddGroupMembershipV2Request): Promise<GroupMembershipV2> {
    return this.request<GroupMembershipV2>('/api/v2/authorizations/group-memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove a group membership.
   *
   * Requires 'Administer System' permission.
   *
   * @param id - The membership ID (UUID)
   * @since 10.5
   *
   * @example
   * ```typescript
   * await client.authorizations.removeGroupMembershipV2('membership-uuid');
   * ```
   */
  async removeGroupMembershipV2(id: string): Promise<void> {
    await this.request(`/api/v2/authorizations/group-memberships/${id}`, {
      method: 'DELETE',
    });
  }
}
