/**
 * Base client for v2 API implementations
 * Provides common functionality and patterns for all v2 endpoints
 * @since 10.3
 */

import { BaseClient } from './BaseClient';
import { DownloadMixin, type DownloadCapable } from './mixins/DownloadMixin';
import type { V2SearchParams, V2PaginatedResponse, V2ErrorResponse } from './types/v2-common';

/**
 * Base class for all v2 API clients
 * Extends BaseClient with v2-specific functionality and download capabilities
 */
export class V2BaseClient extends DownloadMixin(BaseClient) implements DownloadCapable {
  /**
   * Build v2 query string with proper encoding and filtering
   * Overrides the base method to handle v2-specific parameters
   *
   * @param params - Query parameters
   * @returns Encoded query string
   * @protected
   */
  protected override buildV2Query(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    // Handle standard v2 pagination parameters
    if ('page' in params && params.page !== undefined) {
      searchParams.append('page', String(params.page));
    }
    if ('pageSize' in params && params.pageSize !== undefined) {
      searchParams.append('pageSize', String(params.pageSize));
    }

    // Handle sorting
    if ('sort' in params && params.sort !== undefined) {
      searchParams.append('sort', String(params.sort));
    }
    if ('order' in params && params.order !== undefined) {
      searchParams.append('order', String(params.order));
    }

    // Handle other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        !['page', 'pageSize', 'sort', 'order'].includes(key)
      ) {
        if (Array.isArray(value)) {
          // v2 APIs typically use comma-separated values for arrays
          searchParams.append(key, value.join(','));
        } else if (typeof value === 'boolean') {
          searchParams.append(key, value ? 'true' : 'false');
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  /**
   * Make a v2 API request with standard error handling
   *
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Promise resolving to the response data
   * @protected
   */
  protected async requestV2<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    };

    if (this.token.length > 0) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        await this.handleV2Error(response);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Response) {
        await this.handleV2Error(error);
      }
      throw error;
    }
  }

  /**
   * Handle v2 API errors with proper error mapping
   *
   * @param response - Error response
   * @throws Appropriate error based on response
   * @private
   */
  private async handleV2Error(response: Response): Promise<never> {
    let errorData: V2ErrorResponse | undefined;

    try {
      errorData = (await response.json()) as V2ErrorResponse;
    } catch {
      // If JSON parsing fails, use standard error handling
    }

    // Import error factory dynamically to avoid circular dependencies
    const { createErrorFromResponse } = await import('../errors');

    // If we have v2 error structure, enhance the error message
    if (errorData?.error) {
      const enhancedResponse = new Response(
        JSON.stringify({
          errors: [
            {
              msg: errorData.error.message,
              // Include validation errors if present
              ...(errorData.error.validations && {
                validations: errorData.error.validations,
              }),
            },
          ],
        }),
        {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
      );

      throw await createErrorFromResponse(enhancedResponse);
    }

    // Fall back to standard error handling
    throw await createErrorFromResponse(response);
  }

  /**
   * Create an async iterator for paginated v2 endpoints
   *
   * @param endpoint - API endpoint
   * @param params - Initial query parameters
   * @param pageSize - Items per page (default: 100)
   * @returns Async iterator for items
   * @protected
   */
  protected async *iterateV2Pages<T>(
    endpoint: string,
    params: V2SearchParams = {},
    pageSize = 100
  ): AsyncIterableIterator<T> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.requestV2<V2PaginatedResponse<T>>(
        `${endpoint}?${this.buildV2Query({ ...params, page, pageSize })}`
      );

      for (const item of response.data) {
        yield item;
      }

      hasMore = response.page.pageIndex * response.page.pageSize < response.page.total;
      page++;
    }
  }

  /**
   * Get all items from a paginated v2 endpoint
   *
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @param maxItems - Maximum items to retrieve (default: no limit)
   * @returns Promise resolving to all items
   * @protected
   */
  protected async getAllV2Items<T>(
    endpoint: string,
    params: V2SearchParams = {},
    maxItems?: number
  ): Promise<T[]> {
    const items: T[] = [];
    let count = 0;

    for await (const item of this.iterateV2Pages<T>(endpoint, params)) {
      items.push(item);
      count++;

      if (maxItems !== undefined && count >= maxItems) {
        break;
      }
    }

    return items;
  }
}

// Re-export types for convenience
export type { DownloadOptions, DownloadProgress } from './mixins/DownloadMixin';
