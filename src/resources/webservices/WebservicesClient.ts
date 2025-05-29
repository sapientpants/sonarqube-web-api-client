import { BaseClient } from '../../core/BaseClient';
import type {
  ListWebservicesResponse,
  ResponseExampleRequest,
  ResponseExampleResponse,
} from './types';

/**
 * Client for interacting with webservices endpoints
 *
 * The webservices API provides information about the web API supported on this instance.
 * This is a meta-API that helps discover available endpoints and their documentation.
 */
export class WebservicesClient extends BaseClient {
  /**
   * List all available web services
   *
   * Returns information about all web services available on this SonarQube instance,
   * including their endpoints, actions, and parameters.
   *
   * @returns List of available web services with their definitions
   *
   * @example
   * ```typescript
   * const client = new WebservicesClient(baseUrl, token);
   * const services = await client.list();
   * console.log(services.webServices?.length); // Number of available services
   * services.webServices?.forEach(service => {
   *   console.log(`${service.path}: ${service.description}`);
   * });
   * ```
   */
  async list(): Promise<ListWebservicesResponse> {
    return this.request<ListWebservicesResponse>('/api/webservices/list');
  }

  /**
   * Get response example for a specific web service action
   *
   * Returns an example response for the specified controller and action.
   * This is useful for understanding the structure of API responses before
   * making actual requests.
   *
   * @param request - Controller and action to get example for
   * @returns Example response for the specified endpoint
   *
   * @example
   * ```typescript
   * const client = new WebservicesClient(baseUrl, token);
   * const example = await client.responseExample({
   *   controller: 'api/issues',
   *   action: 'search'
   * });
   * console.log('Example response structure:', example);
   * ```
   */
  async responseExample(request: ResponseExampleRequest): Promise<ResponseExampleResponse> {
    const params = new URLSearchParams({
      controller: request.controller,
      action: request.action,
    });

    return this.request<ResponseExampleResponse>(
      `/api/webservices/response_example?${params.toString()}`
    );
  }
}
