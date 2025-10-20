import { BaseBuilder } from '../../core/builders/index.js';
import type { SearchUsersV2Request, SearchUsersV2Response, UserV2 } from './types.js';

/**
 * Builder for v2 users search API
 * @since 10.8
 */
export class SearchUsersV2Builder extends BaseBuilder<SearchUsersV2Request, SearchUsersV2Response> {
  /**
   * Set user IDs to search for
   * @param ids - Array of user IDs
   */
  ids(ids: string[]): this {
    return this.setParam('ids', ids);
  }

  /**
   * Set search query for login, name, or email
   * @param query - Search query string
   */
  query(query: string): this {
    return this.setParam('query', query);
  }

  /**
   * Filter by active status
   * @param active - Whether to include only active users
   */
  active(active = true): this {
    return this.setParam('active', active);
  }

  /**
   * Include external provider information in response
   * @param include - Whether to include external provider info
   */
  includeExternalProvider(include = true): this {
    return this.setParam('includeExternalProvider', include);
  }

  /**
   * Set page number (1-based)
   * @param page - Page number
   */
  page(page: number): this {
    return this.setParam('page', page);
  }

  /**
   * Set page size (max 500)
   * @param pageSize - Number of items per page
   */
  pageSize(pageSize: number): this {
    return this.setParam('pageSize', pageSize);
  }

  /**
   * Execute the request
   */
  async execute(): Promise<SearchUsersV2Response> {
    return this.executor(this.params as SearchUsersV2Request);
  }

  /**
   * Execute and return all items using async iteration
   */
  async *all(): AsyncGenerator<UserV2> {
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(currentPage).execute();
      const items = this.getItems(response);

      for (const item of items) {
        yield item;
      }

      const nextParams = this.getNextPageParams(response, {
        ...this.params,
        page: currentPage,
      } as SearchUsersV2Request);
      hasMore = nextParams !== null;
      currentPage++;
    }
  }

  /**
   * Extract users from the API response
   */
  protected getItems(response: SearchUsersV2Response): UserV2[] {
    return response.users;
  }

  /**
   * Get pagination info for the next page request
   */
  protected getNextPageParams(
    response: SearchUsersV2Response,
    currentParams: SearchUsersV2Request,
  ): SearchUsersV2Request | null {
    const { page } = response;
    const currentPage = currentParams.page ?? 1;

    if (currentPage >= page.totalPages) {
      return null; // No more pages
    }

    return {
      ...currentParams,
      page: currentPage + 1,
    };
  }
}
