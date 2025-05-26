import { createErrorFromResponse, createNetworkError } from '../errors';

/**
 * Response type options for BaseClient requests
 */
export type ResponseType = 'json' | 'text' | 'arrayBuffer' | 'blob';

/**
 * Base client class for resource modules
 */
export abstract class BaseClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly token?: string
  ) {}

  protected async request<T>(
    url: string,
    options?: RequestInit & { responseType?: ResponseType }
  ): Promise<T> {
    const responseType = options?.responseType ?? 'json';

    const headers: Record<string, string> = {
      ...(responseType === 'json' && { ['Content-Type']: 'application/json' }),
      ...(this.token !== undefined &&
        this.token.length > 0 && { ['Authorization']: `Bearer ${this.token}` }),
    };

    const mergedHeaders = {
      ...headers,
      ...(options?.headers !== undefined
        ? Object.fromEntries(Object.entries(options.headers))
        : {}),
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: mergedHeaders,
      });
    } catch (error) {
      throw createNetworkError(error);
    }

    if (!response.ok) {
      throw await createErrorFromResponse(response);
    }

    // Handle different response types
    switch (responseType) {
      case 'arrayBuffer':
        return response.arrayBuffer() as Promise<T>;
      case 'blob':
        return response.blob() as Promise<T>;
      case 'text':
        return response.text() as Promise<T>;
      case 'json':
      default: {
        // Handle empty responses for JSON
        const text = await response.text();
        if (!text) {
          return undefined as unknown as T;
        }
        return JSON.parse(text) as T;
      }
    }
  }
}
