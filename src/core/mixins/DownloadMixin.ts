/**
 * Mixin providing download functionality with progress tracking for v2 APIs
 * @since 10.3
 */

import type { BaseClient } from '../BaseClient';
import type { AuthProvider } from '../auth/AuthProvider';

/**
 * Download options for binary content
 */
export interface DownloadOptions {
  /**
   * Progress callback
   */
  onProgress?: (progress: DownloadProgress) => void;

  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  /**
   * Bytes downloaded
   */
  loaded: number;

  /**
   * Total bytes (if known)
   */
  total: number;

  /**
   * Download percentage (0-100)
   */
  percentage: number;
}

/**
 * Type for mixin constructor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Interface for classes that have download capabilities
 */
export interface DownloadCapable {
  downloadWithProgress: (url: string, options?: DownloadOptions) => Promise<Blob>;
  requestText: (url: string, options?: RequestInit) => Promise<string>;
}

/**
 * Helper function to initialize headers with authentication
 * @param authProvider - The authentication provider
 * @param initialHeaders - Initial headers to apply
 * @returns Headers object with authentication applied
 */
function initializeHeadersWithAuth(
  authProvider: AuthProvider,
  initialHeaders?: Record<string, string>
): Headers {
  let headers = new Headers();

  // Apply initial headers if provided
  if (initialHeaders) {
    Object.entries(initialHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Apply authentication
  headers = authProvider.applyAuth(headers);

  return headers;
}

/**
 * Mixin that adds download functionality to BaseClient
 * Provides methods for downloading binary content with progress tracking
 * and text content retrieval
 *
 * NOTE: This mixin is currently not used due to TypeScript issues with mixins
 * and protected properties. The functionality is implemented directly in V2BaseClient.
 * This export is kept for the test files that still use it.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function DownloadMixin<TBase extends Constructor<BaseClient>>(
  base: TBase
): TBase & Constructor<DownloadCapable> {
  return class extends base implements DownloadCapable {
    /**
     * Download a file with progress tracking support.
     *
     * @param url - URL to download from
     * @param options - Download options
     * @returns Downloaded content as Blob
     */
    async downloadWithProgress(url: string, options?: DownloadOptions): Promise<Blob> {
      const headers = initializeHeadersWithAuth(this.authProvider, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: 'application/octet-stream',
      });

      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}${url}`, {
          headers,
          signal: options?.signal ?? null,
        });
      } catch (networkError: unknown) {
        const { createNetworkError } = await import('../../errors');
        throw createNetworkError(networkError);
      }

      if (!response.ok) {
        const { createErrorFromResponse } = await import('../../errors');
        throw await createErrorFromResponse(response);
      }

      // If no progress callback or no content length, just return blob
      const contentLengthHeader = response.headers.get('content-length');
      if (!options?.onProgress || contentLengthHeader === null || contentLengthHeader === '') {
        return response.blob();
      }

      // Stream the response for progress tracking
      const contentLength = parseInt(contentLengthHeader, 10);
      const reader = response.body?.getReader();

      if (!reader) {
        return response.blob();
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
          const result = await reader.read();

          if (result.done) {
            break;
          }

          if (result.value !== undefined && result.value instanceof Uint8Array) {
            chunks.push(result.value);
            loaded += result.value.length;
          }

          const progress: DownloadProgress = {
            loaded,
            total: contentLength,
            percentage: contentLength > 0 ? Math.round((loaded / contentLength) * 100) : 0,
          };

          options.onProgress(progress);
        }
      } finally {
        reader.releaseLock();
      }

      // Combine chunks into a single blob
      return new Blob(chunks);
    }

    /**
     * Request text content (for JSON-based formats)
     *
     * @param url - URL to request
     * @param options - Request options
     * @returns Text content
     */
    async requestText(url: string, options?: RequestInit): Promise<string> {
      const headers = initializeHeadersWithAuth(this.authProvider);

      // Merge with any headers from options
      if (options?.headers) {
        const optHeaders = new Headers(options.headers);
        optHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      const requestOptions: RequestInit = { ...options, headers };

      const response = await fetch(`${this.baseUrl}${url}`, requestOptions);

      if (!response.ok) {
        const { createErrorFromResponse } = await import('../../errors');
        throw await createErrorFromResponse(response);
      }

      return response.text();
    }

    /**
     * Get authentication headers
     * @protected
     */
    protected getAuthHeaders(): Record<string, string> {
      const headers = initializeHeadersWithAuth(this.authProvider);
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
  };
}
