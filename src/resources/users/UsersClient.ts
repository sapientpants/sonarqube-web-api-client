import { BaseClient } from '../../core/BaseClient';
import { SearchUsersBuilder, GetUserGroupsBuilder } from './builders';
import type {
  UserWithDetails,
  SearchUsersResponse,
  GetUserGroupsResponse,
  UserGroup,
} from './types';

/**
 * Client for interacting with the SonarQube Users API.
 * Provides methods for searching users and managing user groups.
 */
export class UsersClient extends BaseClient {
  /**
   * Get a list of active users from organizations the user making the request belongs to.
   *
   * @since 2.10
   * @deprecated Since 10.8 (February 10, 2025). Use GET api/v2/users/search instead. Will be dropped August 13th 2025.
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {RateLimitError} If the rate limit is exceeded
   *
   * @example
   * ```typescript
   * // Search for users by query
   * const results = await client.users.search()
   *   .query('john')
   *   .pageSize(50)
   *   .execute();
   *
   * // Search by IDs
   * const users = await client.users.search()
   *   .ids(['uuid-1', 'uuid-2'])
   *   .execute();
   *
   * // Iterate through all users
   * for await (const user of client.users.searchAll()) {
   *   console.log(user.name);
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  search(): SearchUsersBuilder {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return new SearchUsersBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.ids !== undefined) {
        query.append('ids', params.ids.join(','));
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
      const queryString = query.toString();
      const url = queryString ? `/api/users/search?${queryString}` : '/api/users/search';
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return this.request<SearchUsersResponse>(url);
    });
  }

  /**
   * Convenience method to iterate through all users.
   * This is equivalent to calling search().all()
   *
   * @deprecated Since 10.8 (February 10, 2025). Use GET api/v2/users/search instead. Will be dropped August 13th 2025.
   * @returns An async iterator for all users
   *
   * @example
   * ```typescript
   * for await (const user of client.users.searchAll()) {
   *   console.log(user.name);
   * }
   * ```
   */
  searchAll(): AsyncIterableIterator<UserWithDetails> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return this.search().all();
  }

  /**
   * Lists the groups a user belongs to.
   *
   * @since 5.2
   * @returns A builder for constructing the groups request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission on the organization
   * @throws {NotFoundError} If the user or organization doesn't exist
   *
   * @example
   * ```typescript
   * // Get groups for a specific user
   * const results = await client.users.groups()
   *   .login('john.doe')
   *   .organization('my-org')
   *   .execute();
   *
   * // Search for specific groups
   * const groups = await client.users.groups()
   *   .login('john.doe')
   *   .organization('my-org')
   *   .query('admin')
   *   .selected('all')
   *   .execute();
   *
   * // Iterate through all groups
   * for await (const group of client.users.groups()
   *   .login('john.doe')
   *   .organization('my-org')
   *   .all()) {
   *   console.log(group.name);
   * }
   * ```
   */
  groups(): GetUserGroupsBuilder {
    return new GetUserGroupsBuilder(async (params) => {
      const query = new URLSearchParams({
        login: params.login,
        organization: params.organization,
      });
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
      return this.request<GetUserGroupsResponse>(`/api/users/groups?${query.toString()}`);
    });
  }

  /**
   * Convenience method to iterate through all groups for a user.
   *
   * @param login - The user login
   * @param organization - The organization key
   * @returns An async iterator for all groups
   *
   * @example
   * ```typescript
   * for await (const group of client.users.groupsAll('john.doe', 'my-org')) {
   *   console.log(group.name);
   * }
   * ```
   */
  groupsAll(login: string, organization: string): AsyncIterableIterator<UserGroup> {
    return this.groups().login(login).organization(organization).all();
  }
}
