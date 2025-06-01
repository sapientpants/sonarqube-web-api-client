import { BaseClient } from '../../core/BaseClient';
import type { ServerVersionResponse } from './types';

/**
 * Client for SonarQube Server API
 *
 * **Note**: This API is minimal and only provides version information.
 * For comprehensive server management functionality, use the SystemClient instead.
 *
 * @since SonarQube 2.10
 */
export class ServerClient extends BaseClient {
  /**
   * Get the SonarQube version in plain text.
   *
   * @returns Promise that resolves to the SonarQube version as a string
   *
   * @example
   * ```typescript
   * const version = await client.server.version();
   * console.log(version); // "10.8.0"
   * ```
   */
  async version(): Promise<ServerVersionResponse> {
    return this.request<ServerVersionResponse>('/api/server/version', {
      responseType: 'text',
    });
  }
}
