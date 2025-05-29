import { PaginatedBuilder } from '../../core/builders/PaginatedBuilder';
import type {
  SearchGroupsRequest,
  SearchGroupsResponse,
  UserGroup,
  UsersRequest,
  UsersResponse,
  UserWithMembership,
} from './types';

/**
 * Builder for searching user groups
 *
 * @example
 * ```typescript
 * const groups = await client.userGroups.search()
 *   .organization('my-org')
 *   .query('admin')
 *   .fields(['name', 'membersCount'])
 *   .pageSize(50)
 *   .execute();
 * ```
 */
export class SearchUserGroupsBuilder extends PaginatedBuilder<
  SearchGroupsRequest,
  SearchGroupsResponse,
  UserGroup
> {
  /**
   * Set the organization key (required)
   */
  organization(value: string): this {
    this.params.organization = value;
    return this;
  }

  /**
   * Limit search to names that contain the supplied string
   */
  query(value: string): this {
    this.params.q = value;
    return this;
  }

  /**
   * Set the fields to be returned in response
   * @param fields - Array of field names: 'name', 'description', 'membersCount'
   */
  fields(fields: Array<'name' | 'description' | 'membersCount'>): this {
    this.params.f = fields;
    return this;
  }

  async execute(): Promise<SearchGroupsResponse> {
    if (this.params.organization === undefined || this.params.organization === '') {
      throw new Error('Organization is required for searching user groups');
    }
    return this.executor(this.params as SearchGroupsRequest);
  }

  protected getItems(response: SearchGroupsResponse): UserGroup[] {
    return response.groups;
  }
}

/**
 * Builder for searching users with membership information
 *
 * @example
 * ```typescript
 * const users = await client.userGroups.users()
 *   .group('sonar-administrators')
 *   .organization('my-org')
 *   .query('john')
 *   .selected('all')
 *   .pageSize(25)
 *   .execute();
 * ```
 */
export class UsersBuilder extends PaginatedBuilder<
  UsersRequest,
  UsersResponse,
  UserWithMembership
> {
  /**
   * Set the group by ID
   */
  groupId(id: string): this {
    this.params.id = id;
    delete this.params.name; // Only one of id or name should be set
    return this;
  }

  /**
   * Set the group by name
   */
  groupName(name: string): this {
    this.params.name = name;
    delete this.params.id; // Only one of id or name should be set
    return this;
  }

  /**
   * Convenience method to set group by either id or name
   */
  group(idOrName: string): this {
    // If it looks like a numeric ID, use groupId, otherwise use groupName
    if (/^\d+$/.test(idOrName)) {
      return this.groupId(idOrName);
    } else {
      return this.groupName(idOrName);
    }
  }

  /**
   * Set the organization key
   */
  organization(value: string): this {
    this.params.organization = value;
    return this;
  }

  /**
   * Limit search to names or logins that contain the supplied string
   */
  query(value: string): this {
    this.params.q = value;
    return this;
  }

  /**
   * Filter users based on their membership status
   * @param value - 'selected' (members only), 'deselected' (non-members only), or 'all'
   */
  selected(value: 'all' | 'deselected' | 'selected'): this {
    this.params.selected = value;
    return this;
  }

  async execute(): Promise<UsersResponse> {
    if (this.params.id === undefined && this.params.name === undefined) {
      throw new Error('Either group ID or name must be provided');
    }
    return this.executor(this.params as UsersRequest);
  }

  protected getItems(response: UsersResponse): UserWithMembership[] {
    return response.users;
  }

  protected override hasMorePages(response: UsersResponse, currentPage: number): boolean {
    // The users endpoint uses a different pagination format with p, ps, total
    const totalPages = Math.ceil(response.total / response.ps);
    return currentPage < totalPages;
  }
}
