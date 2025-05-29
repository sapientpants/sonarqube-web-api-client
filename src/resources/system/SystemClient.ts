import { BaseClient } from '../../core/BaseClient';
import type { HealthResponse, StatusResponse, InfoResponse } from './types';

/**
 * Client for interacting with system endpoints
 * **Note**: Only available in SonarQube Server, not in SonarCloud
 */
export class SystemClient extends BaseClient {
  /**
   * Get system health information
   *
   * Requires system administration permission.
   *
   * Since SonarQube 9.1, this endpoint can be accessed using the system passcode (X-Sonar-Passcode header)
   * during startup to monitor database migration progress.
   *
   * @returns System health status
   * @since 6.6
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const health = await client.health();
   * console.log(health.health); // 'GREEN', 'YELLOW', or 'RED'
   * ```
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/system/health');
  }

  /**
   * Get system status
   *
   * @returns System status including version and operational state
   * @since 5.2
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const status = await client.status();
   * console.log(status.status); // 'UP', 'DOWN', 'STARTING', etc.
   * console.log(status.version); // e.g., '10.3.0.82913'
   * ```
   */
  async status(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/api/system/status');
  }

  /**
   * Ping the system
   *
   * Answers "pong" as plain text. This endpoint can be used for system availability checks.
   *
   * Note: Authentication might be required depending on your SonarQube configuration.
   * Some installations allow unauthenticated access to this endpoint for monitoring purposes.
   *
   * @returns "pong" as plain text
   * @since 6.3
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl);
   * const response = await client.ping();
   * console.log(response); // 'pong'
   * ```
   */
  async ping(): Promise<string> {
    return this.request<string>('/api/system/ping', { responseType: 'text' });
  }

  /**
   * Get detailed system information
   *
   * Requires system administration permission.
   *
   * Note: This endpoint might not be available in all SonarQube versions or configurations.
   * It provides detailed information about the system including database, compute engine,
   * search engine, and JVM details.
   *
   * @returns Detailed system information
   * @since 5.1
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const info = await client.info();
   * console.log(info['System Date']);
   * console.log(info.Database?.Version);
   * ```
   */
  async info(): Promise<InfoResponse> {
    return this.request<InfoResponse>('/api/system/info');
  }
}
