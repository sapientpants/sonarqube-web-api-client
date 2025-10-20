import { PaginatedBuilder, ParameterHelpers } from '../../core/builders/index.js';
import { ValidationError } from '../../errors/index.js';
import type {
  SearchUsersRequest,
  SearchUsersResponse,
  UserWithDetails,
  GetUserGroupsRequest,
  GetUserGroupsResponse,
  UserGroup,
  GroupSelectionFilter,
} from './types.js';

/**
 * Builder for constructing paginated user search requests.
 *
 * @deprecated Since 10.8 (February 10, 2025). Use GET api/v2/users/search instead. Will be dropped August 13th 2025.
 *
 * @example
 * ```typescript
 * // Search with pagination
 * const results = await client.users.search()
 *   .query('john')
 *   .pageSize(50)
 *   .page(2)
 *   .execute();
 *
 * // Search by IDs
 * const users = await client.users.search()
 *   .ids(['uuid-1', 'uuid-2'])
 *   .execute();
 *
 * // Iterate through all users
 * for await (const user of client.users.search().all()) {
 *   console.log(user.name);
 * }
 * ```
 */
export class SearchUsersBuilder extends PaginatedBuilder<
  SearchUsersRequest,
  SearchUsersResponse,
  UserWithDetails
> {
  /**
   * Filter on a list of one or more (max 30) user identifiers (comma-separated UUID V4).
   * Maximum length: 1110 characters
   */
  ids = ParameterHelpers.createArrayMethod<typeof this>('ids');

  /**
   * Filter on login, name and email.
   * Minimum length: 2 characters
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  async execute(): Promise<SearchUsersResponse> {
    const finalParams = this.params as SearchUsersRequest;

    // Validate ids
    if (finalParams.ids !== undefined) {
      if (finalParams.ids.length > 30) {
        throw new ValidationError('Maximum 30 user IDs allowed');
      }
      const idsString = finalParams.ids.join(',');
      if (idsString.length > 1110) {
        throw new ValidationError('IDs string exceeds maximum length of 1110 characters');
      }
    }

    // Validate query
    if (finalParams.q !== undefined && finalParams.q.length < 2) {
      throw new ValidationError('Query must be at least 2 characters long');
    }

    return this.executor(finalParams);
  }

  protected getItems(response: SearchUsersResponse): UserWithDetails[] {
    return response.users;
  }
}

/**
 * Builder for constructing paginated user groups requests.
 *
 * @example
 * ```typescript
 * // Get groups with pagination
 * const results = await client.users.groups()
 *   .login('john.doe')
 *   .organization('my-org')
 *   .pageSize(50)
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
export class GetUserGroupsBuilder extends PaginatedBuilder<
  GetUserGroupsRequest,
  GetUserGroupsResponse,
  UserGroup
> {
  /**
   * A user login (required).
   */
  login = ParameterHelpers.createStringMethod<typeof this>('login');

  /**
   * Organization key (required).
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Limit search to group names that contain the supplied string.
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Filter by selection status.
   * Default: 'selected'
   */
  selected(value: GroupSelectionFilter): this {
    this.params.selected = value;
    return this;
  }

  async execute(): Promise<GetUserGroupsResponse> {
    const finalParams = this.params as GetUserGroupsRequest;

    // Validate required parameters
    if (!finalParams.login || finalParams.login.trim() === '') {
      throw new ValidationError('login is required');
    }
    if (!finalParams.organization || finalParams.organization.trim() === '') {
      throw new ValidationError('organization is required');
    }

    return this.executor(finalParams);
  }

  protected getItems(response: GetUserGroupsResponse): UserGroup[] {
    return response.groups;
  }
}
