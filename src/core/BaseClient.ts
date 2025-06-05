import { createErrorFromResponse, createNetworkError } from '../errors';
import type { DeprecationOptions } from './deprecation';
import { buildV2Query } from './utils/v2-query-builder';
import { type AuthProvider, BearerTokenAuthProvider, NoAuthProvider } from './auth';

/**
 * Response type options for BaseClient requests
 */
export type ResponseType = 'json' | 'text' | 'arrayBuffer' | 'blob';

/**
 * Client configuration options
 */
export interface ClientOptions extends DeprecationOptions {
  /** Organization key for SonarQube Cloud */
  organization?: string;
}

/**
 * Base client class for resource modules
 */
export abstract class BaseClient {
  protected readonly options: ClientOptions;
  protected readonly authProvider: AuthProvider;

  constructor(
    protected readonly baseUrl: string,
    authProviderOrToken: AuthProvider | string,
    organizationOrOptions?: string | ClientOptions
  ) {
    // Handle backward compatibility: accept string token and convert to appropriate AuthProvider
    if (typeof authProviderOrToken === 'string') {
      // If empty string, use NoAuthProvider, otherwise BearerTokenAuthProvider
      this.authProvider =
        authProviderOrToken.length === 0
          ? new NoAuthProvider()
          : new BearerTokenAuthProvider(authProviderOrToken);
    } else {
      this.authProvider = authProviderOrToken;
    }

    // Handle backward compatibility: organization can be string or options object
    if (typeof organizationOrOptions === 'string') {
      this.options = { organization: organizationOrOptions };
    } else {
      this.options = organizationOrOptions ?? {};
    }
  }

  protected get organization(): string | undefined {
    return this.options.organization;
  }

  protected async request<T>(
    url: string,
    options?: RequestInit & { responseType?: ResponseType }
  ): Promise<T> {
    const responseType = options?.responseType ?? 'json';

    let headers = new Headers();
    if (responseType === 'json') {
      headers.set('Content-Type', 'application/json');
    }
    headers = this.authProvider.applyAuth(headers);

    // Merge with any headers from options
    if (options?.headers) {
      const optHeaders = new Headers(options.headers);
      optHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    // Append organization parameter if provided and not already in URL
    let finalUrl = url;
    if (this.organization !== undefined && this.organization.length > 0) {
      const urlObj = new URL(url, this.baseUrl);
      // Only add organization if it's not already in the URL
      if (!urlObj.searchParams.has('organization')) {
        urlObj.searchParams.set('organization', this.organization);
      }
      finalUrl = urlObj.pathname + urlObj.search;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${finalUrl}`, {
        ...options,
        headers,
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

  /**
   * Build a query string for v2 APIs
   * @param params - Query parameters
   * @returns URL-encoded query string
   */
  protected buildV2Query(params: Record<string, unknown>): string {
    return buildV2Query(params);
  }
}
