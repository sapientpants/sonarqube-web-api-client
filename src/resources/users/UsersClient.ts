import { BaseClient } from '../../core/BaseClient.js';
import { DeprecationManager } from '../../core/deprecation/index.js';
import { SearchUsersBuilder, GetUserGroupsBuilder } from './builders.js';
import { SearchUsersV2Builder } from './buildersV2.js';
import type {
  UserWithDetails,
  SearchUsersResponse,
  GetUserGroupsResponse,
  UserGroup,
  SearchUsersV2Request,
  SearchUsersV2Response,
  UserV2,
} from './types.js';

// Constants for deprecation warnings
const DEPRECATION_VERSION = 'v1.0.0 (August 13th, 2025)';
const DEPRECATION_REASON = 'SonarQube API v1 endpoint deprecated since 10.8';
const MIGRATION_GUIDE_URL =
  'https://github.com/your-repo/sonarqube-web-api-client/blob/main/MIGRATION.md#users-api';

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

  search(): SearchUsersBuilder {
    DeprecationManager.warn({
      api: 'users.search()',
      replacement: 'users.searchV2()',
      removeVersion: DEPRECATION_VERSION,
      reason: DEPRECATION_REASON,
      migrationGuide: MIGRATION_GUIDE_URL,
    });

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
    DeprecationManager.warn({
      api: 'users.searchAll()',
      replacement: 'users.searchV2().all()',
      removeVersion: DEPRECATION_VERSION,
      reason: DEPRECATION_REASON,
      migrationGuide: MIGRATION_GUIDE_URL,
    });

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

  // ============================================================================
  // V2 API METHODS
  // ============================================================================

  /**
   * Search users using the new v2 API endpoint.
   * This is the recommended method that replaces the deprecated search() method.
   *
   * @since 10.8
   * @returns A builder for constructing the v2 search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {RateLimitError} If the rate limit is exceeded
   *
   * @example
   * ```typescript
   * // Search for users by query
   * const results = await client.users.searchV2()
   *   .query('john')
   *   .pageSize(50)
   *   .active(true)
   *   .execute();
   *
   * // Search by IDs with enhanced info
   * const users = await client.users.searchV2()
   *   .ids(['uuid-1', 'uuid-2'])
   *   .includeExternalProvider(true)
   *   .execute();
   *
   * // Iterate through all active users
   * for await (const user of client.users.searchV2().active(true).all()) {
   *   console.log(user.name);
   * }
   * ```
   */
  searchV2(): SearchUsersV2Builder {
    return new SearchUsersV2Builder(async (params) => {
      const query = this.buildUserSearchV2Query(params);
      const queryString = query.toString();
      const url = queryString ? `/api/v2/users/search?${queryString}` : '/api/v2/users/search';
      return this.request<SearchUsersV2Response>(url);
    });
  }

  /**
   * Build query parameters for user search v2
   * @private
   */
  private buildUserSearchV2Query(params: SearchUsersV2Request): URLSearchParams {
    const query = new URLSearchParams();

    this.appendArrayParam(query, 'ids', params.ids);
    this.appendStringParam(query, 'query', params.query);
    this.appendScalarParam(query, 'page', params.page);
    this.appendScalarParam(query, 'pageSize', params.pageSize);
    this.appendScalarParam(query, 'active', params.active);
    this.appendScalarParam(query, 'includeExternalProvider', params.includeExternalProvider);

    return query;
  }

  /**
   * Append array parameter if defined and non-empty
   * @private
   */
  private appendArrayParam(query: URLSearchParams, key: string, value: string[] | undefined): void {
    if (value !== undefined && value.length > 0) {
      query.append(key, value.join(','));
    }
  }

  /**
   * Append string parameter if defined
   * @private
   */
  private appendStringParam(query: URLSearchParams, key: string, value: string | undefined): void {
    if (value !== undefined) {
      query.append(key, value);
    }
  }

  /**
   * Append scalar parameter if defined
   * @private
   */
  private appendScalarParam(
    query: URLSearchParams,
    key: string,
    value: string | number | boolean | undefined,
  ): void {
    if (value !== undefined) {
      query.append(key, String(value));
    }
  }

  /**
   * Convenience method to iterate through all users using the v2 API.
   * This is equivalent to calling searchV2().all()
   *
   * @since 10.8
   * @returns An async iterator for all users
   *
   * @example
   * ```typescript
   * for await (const user of client.users.searchAllV2()) {
   *   console.log(user.name);
   * }
   * ```
   */
  searchAllV2(): AsyncIterableIterator<UserV2> {
    return this.searchV2().all();
  }
}
