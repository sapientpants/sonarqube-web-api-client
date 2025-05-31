/**
 * Base client for v2 API implementations
 * Provides common functionality and patterns for all v2 endpoints
 * @since 10.3
 */

import { BaseClient } from './BaseClient';
import { createErrorFromResponse } from '../errors';
import type { DownloadCapable, DownloadOptions, DownloadProgress } from './mixins/DownloadMixin';
import type { V2SearchParams, V2PaginatedResponse, V2ErrorResponse } from './types/v2-common';

/**
 * Base class for all v2 API clients
 * Extends BaseClient with v2-specific functionality and download capabilities
 */
export class V2BaseClient extends BaseClient implements DownloadCapable {
  /**
   * Download a file with progress tracking support.
   *
   * @param url - URL to download from
   * @param options - Download options
   * @returns Downloaded content as Blob
   */
  async downloadWithProgress(url: string, options?: DownloadOptions): Promise<Blob> {
    const headers: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/octet-stream',
    };

    if (this.token.length > 0) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      headers,
      ...(options?.signal !== undefined ? { signal: options.signal } : {}),
    });

    if (!response.ok) {
      throw await createErrorFromResponse(response);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength !== null ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // If no progress callback, just return the blob
    if (!options?.onProgress) {
      return response.blob();
    }

    // Stream the response with progress
    const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    try {
      let isDone = false;
      while (!isDone) {
        const result = await reader.read();
        isDone = result.done;

        if (!isDone && result.value !== undefined) {
          chunks.push(result.value);
          loaded += result.value.length;

          const progress: DownloadProgress = {
            loaded,
            total,
            percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
          };

          options.onProgress(progress);
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks into a single blob
    return new Blob(chunks);
  }

  /**
   * Request text content from a URL.
   *
   * @param url - URL to fetch
   * @param options - Request options
   * @returns Text content
   */
  async requestText(url: string, options?: RequestInit): Promise<string> {
    const headers: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'text/plain',
    };

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await this.request<Response>(url, {
      ...options,
      headers,
      responseType: 'response' as never,
    });

    return response.text();
  }

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
    if ('page' in params && params['page'] !== undefined) {
      const pageValue = params['page'];
      if (typeof pageValue === 'object' && pageValue !== null) {
        searchParams.append('page', JSON.stringify(pageValue));
      } else {
        searchParams.append('page', String(pageValue as string | number | boolean));
      }
    }
    if ('pageSize' in params && params['pageSize'] !== undefined) {
      const pageSizeValue = params['pageSize'];
      if (typeof pageSizeValue === 'object' && pageSizeValue !== null) {
        searchParams.append('pageSize', JSON.stringify(pageSizeValue));
      } else {
        searchParams.append('pageSize', String(pageSizeValue as string | number | boolean));
      }
    }

    // Handle sorting
    if ('sort' in params && params['sort'] !== undefined) {
      const sortValue = params['sort'];
      if (typeof sortValue === 'object' && sortValue !== null) {
        searchParams.append('sort', JSON.stringify(sortValue));
      } else {
        searchParams.append('sort', String(sortValue as string | number | boolean));
      }
    }
    if ('order' in params && params['order'] !== undefined) {
      const orderValue = params['order'];
      if (typeof orderValue === 'object' && orderValue !== null) {
        searchParams.append('order', JSON.stringify(orderValue));
      } else {
        searchParams.append('order', String(orderValue as string | number | boolean));
      }
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
        } else if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value as string | number | boolean));
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
      ...(options?.headers as Record<string, string> | undefined),
    };

    if (this.token.length > 0) {
      headers['Authorization'] = `Bearer ${this.token}`;
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
}

// Re-export types for convenience
export type { DownloadOptions, DownloadProgress } from './mixins/DownloadMixin';
