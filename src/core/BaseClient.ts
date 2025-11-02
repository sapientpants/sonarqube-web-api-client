import { createErrorFromResponse, createNetworkError } from '../errors/index.js';
import type { DeprecationOptions } from './deprecation/index.js';
import { buildV2Query } from './utils/v2-query-builder.js';
import { type AuthProvider, BearerTokenAuthProvider, NoAuthProvider } from './auth/index.js';

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
    organizationOrOptions?: string | ClientOptions,
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
    options?: RequestInit & { responseType?: ResponseType },
  ): Promise<T> {
    const responseType = options?.responseType ?? 'json';
    const headers = this.buildRequestHeaders(
      responseType,
      options?.headers as HeadersInit | undefined,
    );
    const finalUrl = this.appendOrganizationToUrl(url);

    const response = await this.performFetch(finalUrl, options, headers);
    return this.processResponse<T>(response, responseType);
  }

  /**
   * Build request headers with auth and content type
   * @private
   */
  private buildRequestHeaders(responseType: ResponseType, optionHeaders?: HeadersInit): Headers {
    let headers = new Headers();
    if (responseType === 'json') {
      headers.set('Content-Type', 'application/json');
    }
    headers = this.authProvider.applyAuth(headers);

    // Merge with any headers from options
    if (optionHeaders !== undefined) {
      // Convert to Headers to normalize all possible HeadersInit formats
      // We need to cast to satisfy TypeScript's strict checking of the Headers constructor
      // The Headers constructor accepts HeadersInit but TypeScript's strict mode has issues
      // with the string[][] variant and tuple type checking
      const optHeaders = new Headers(optionHeaders as Record<string, string>);
      optHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Append organization parameter to URL if configured
   * @private
   */
  private appendOrganizationToUrl(url: string): string {
    if (this.organization === undefined || this.organization.length === 0) {
      return url;
    }

    const urlObj = new URL(url, this.baseUrl);
    // Only add organization if it's not already in the URL
    if (!urlObj.searchParams.has('organization')) {
      urlObj.searchParams.set('organization', this.organization);
    }
    return urlObj.pathname + urlObj.search;
  }

  /**
   * Perform fetch request with error handling
   * @private
   */
  private async performFetch(
    url: string,
    options: RequestInit | undefined,
    headers: Headers,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw createNetworkError(error);
    }

    if (!response.ok) {
      throw await createErrorFromResponse(response);
    }

    return response;
  }

  /**
   * Process response based on requested type
   * @private
   */
  private async processResponse<T>(response: Response, responseType: ResponseType): Promise<T> {
    switch (responseType) {
      case 'arrayBuffer':
        return response.arrayBuffer() as Promise<T>;
      case 'blob':
        return response.blob() as Promise<T>;
      case 'text':
        return response.text() as Promise<T>;
      case 'json':
      default:
        return this.processJsonResponse<T>(response);
    }
  }

  /**
   * Process JSON response with empty response handling
   * @private
   */
  private async processJsonResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return undefined as unknown as T;
    }
    return JSON.parse(text) as T;
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
