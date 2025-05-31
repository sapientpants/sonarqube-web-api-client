import { BaseBuilder } from '../../core/builders';
import type {
  SearchGroupsV2Request,
  SearchGroupsV2Response,
  GroupV2,
  SearchGroupMembershipsV2Request,
  SearchGroupMembershipsV2Response,
  GroupMembershipV2,
} from './types';

/**
 * Builder for searching groups with the v2 API
 * @since 10.5
 */
export class SearchGroupsV2Builder extends BaseBuilder<
  SearchGroupsV2Request,
  SearchGroupsV2Response
> {
  /**
   * Search query (searches in name and description)
   */
  query(query: string): this {
    return this.setParam('query', query);
  }

  /**
   * Filter by managed status
   */
  managed(managed: boolean): this {
    return this.setParam('managed', managed);
  }

  /**
   * Include default groups
   */
  includeDefault(include: boolean): this {
    return this.setParam('includeDefault', include);
  }

  /**
   * Filter by external provider
   */
  externalProvider(provider: string): this {
    return this.setParam('externalProvider', provider);
  }

  /**
   * Include permission counts
   */
  includePermissions(include: boolean): this {
    return this.setParam('includePermissions', include);
  }

  /**
   * Minimum number of members
   */
  minMembers(min: number): this {
    return this.setParam('minMembers', min);
  }

  /**
   * Maximum number of members
   */
  maxMembers(max: number): this {
    return this.setParam('maxMembers', max);
  }

  /**
   * Set the page number (1-based)
   * Note: v2 APIs use 'page' instead of 'p'
   */
  page(page: number): this {
    return this.setParam('page', page);
  }

  /**
   * Set the page size
   * Note: v2 APIs use 'pageSize' instead of 'ps'
   */
  pageSize(pageSize: number): this {
    return this.setParam('pageSize', pageSize);
  }

  /**
   * Execute the request
   */
  async execute(): Promise<SearchGroupsV2Response> {
    return this.executor(this.params as SearchGroupsV2Request);
  }

  /**
   * Execute and return all items using async iteration
   */
  async *all(): AsyncGenerator<GroupV2> {
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(currentPage).execute();
      const items = this.getItems(response);

      for (const item of items) {
        yield item;
      }

      hasMore = this.hasMorePages(response, currentPage);
      currentPage++;
    }
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchGroupsV2Response): GroupV2[] {
    return response.groups;
  }

  /**
   * Check if there are more pages
   */
  protected hasMorePages(response: SearchGroupsV2Response, currentPage: number): boolean {
    const totalPages = Math.ceil(response.page.total / response.page.pageSize);
    return currentPage < totalPages;
  }
}

/**
 * Builder for searching group memberships with the v2 API
 * @since 10.5
 */
export class SearchGroupMembershipsV2Builder extends BaseBuilder<
  SearchGroupMembershipsV2Request,
  SearchGroupMembershipsV2Response
> {
  /**
   * Filter by group IDs
   */
  groupIds(ids: string[]): this {
    return this.setParam('groupIds', ids);
  }

  /**
   * Filter by a single group ID
   */
  groupId(id: string): this {
    return this.setParam('groupIds', [id]);
  }

  /**
   * Filter by user IDs
   */
  userIds(ids: string[]): this {
    return this.setParam('userIds', ids);
  }

  /**
   * Filter by a single user ID
   */
  userId(id: string): this {
    return this.setParam('userIds', [id]);
  }

  /**
   * Search query
   */
  query(query: string): this {
    return this.setParam('query', query);
  }

  /**
   * Set the page number (1-based)
   * Note: v2 APIs use 'page' instead of 'p'
   */
  page(page: number): this {
    return this.setParam('page', page);
  }

  /**
   * Set the page size
   * Note: v2 APIs use 'pageSize' instead of 'ps'
   */
  pageSize(pageSize: number): this {
    return this.setParam('pageSize', pageSize);
  }

  /**
   * Execute the request
   */
  async execute(): Promise<SearchGroupMembershipsV2Response> {
    return this.executor(this.params as SearchGroupMembershipsV2Request);
  }

  /**
   * Execute and return all items using async iteration
   */
  async *all(): AsyncGenerator<GroupMembershipV2> {
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(currentPage).execute();
      const items = this.getItems(response);

      for (const item of items) {
        yield item;
      }

      hasMore = this.hasMorePages(response, currentPage);
      currentPage++;
    }
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchGroupMembershipsV2Response): GroupMembershipV2[] {
    return response.memberships;
  }

  /**
   * Check if there are more pages
   */
  protected hasMorePages(response: SearchGroupMembershipsV2Response, currentPage: number): boolean {
    const totalPages = Math.ceil(response.page.total / response.page.pageSize);
    return currentPage < totalPages;
  }
}
