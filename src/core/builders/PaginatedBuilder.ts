import { BaseBuilder } from './BaseBuilder.js';

/**
 * Common interface for paginated requests
 */
export interface PaginatedRequest {
  p?: number; // page number
  ps?: number; // page size
}

/**
 * Common interface for paginated responses
 */
export interface PaginatedResponse {
  paging?: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  isLastPage?: boolean;
}

/**
 * Base builder for paginated search operations
 */
export abstract class PaginatedBuilder<
  TRequest extends PaginatedRequest,
  TResponse extends PaginatedResponse,
  TItem,
> extends BaseBuilder<TRequest, TResponse> {
  /**
   * Set the page number
   */
  page(pageNumber: number): this {
    return this.setParam('p' as keyof TRequest, pageNumber as TRequest[keyof TRequest]);
  }

  /**
   * Set the page size
   */
  pageSize(size: number): this {
    return this.setParam('ps' as keyof TRequest, size as TRequest[keyof TRequest]);
  }

  /**
   * Execute and return all items using async iteration
   */
  async *all(): AsyncGenerator<TItem> {
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
   * Check if there are more pages
   */
  protected hasMorePages(response: TResponse, currentPage: number): boolean {
    // Handle different pagination formats
    if (response.paging) {
      const totalPages = Math.ceil(response.paging.total / response.paging.pageSize);
      return currentPage < totalPages;
    }

    if ('isLastPage' in response) {
      return !response.isLastPage;
    }

    return false;
  }

  /**
   * Get the items from the response
   */
  protected abstract getItems(response: TResponse): TItem[];
}
