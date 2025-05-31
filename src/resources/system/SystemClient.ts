import { BaseClient } from '../../core/BaseClient';
import { Deprecated } from '../../core/deprecation';
import type { HealthResponse, StatusResponse, InfoResponse } from './types';
import type { SystemInfoV2, SystemHealthV2, SystemStatusV2Response } from './types-v2';

/**
 * Client for interacting with system endpoints
 * **Note**: Only available in SonarQube Server, not in SonarCloud
 */
export class SystemClient extends BaseClient {
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
   * Get detailed system information (v2)
   *
   * Requires system administration permission.
   *
   * This is the REST-compliant v2 API that provides structured system information
   * including version, edition, features, database details, and plugin information.
   *
   * @returns Structured system information
   * @since 10.6
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const info = await client.getInfoV2();
   * console.log(info.version); // e.g., '10.8.0'
   * console.log(info.edition); // 'community', 'developer', 'enterprise', or 'datacenter'
   * console.log(info.features); // ['branch', 'audit', etc.]
   * ```
   */
  async getInfoV2(): Promise<SystemInfoV2> {
    return this.request<SystemInfoV2>('/api/v2/system/info');
  }

  /**
   * Get system health information (v2)
   *
   * Requires system administration permission.
   *
   * This is the REST-compliant v2 API that provides health status information.
   * For clustered setups, it includes individual node health details.
   *
   * @returns System health status with node details
   * @since 10.6
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const health = await client.getHealthV2();
   * console.log(health.status); // 'GREEN', 'YELLOW', or 'RED'
   * if (health.nodes) {
   *   health.nodes.forEach(node => {
   *     console.log(`${node.name}: ${node.status}`);
   *   });
   * }
   * ```
   */
  async getHealthV2(): Promise<SystemHealthV2> {
    return this.request<SystemHealthV2>('/api/v2/system/health');
  }

  /**
   * Get system status (v2)
   *
   * This is the REST-compliant v2 API that provides system operational status.
   * It includes additional information like migration progress and startup time.
   *
   * @returns System operational status
   * @since 10.6
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const status = await client.getStatusV2();
   * console.log(status.status); // 'UP', 'DOWN', 'STARTING', etc.
   * if (status.migrationProgress) {
   *   console.log(`Migration progress: ${status.migrationProgress}%`);
   * }
   * ```
   */
  async getStatusV2(): Promise<SystemStatusV2Response> {
    return this.request<SystemStatusV2Response>('/api/v2/system/status');
  }

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
   * @deprecated Use getHealthV2() instead for REST-compliant API
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const health = await client.health();
   * console.log(health.health); // 'GREEN', 'YELLOW', or 'RED'
   * ```
   */
  @Deprecated({
    deprecatedSince: '10.6',
    removalDate: 'TBD',
    replacement: 'getHealthV2()',
    reason: 'v1 endpoint deprecated in favor of REST-compliant v2 API',
    migrationGuide:
      'Replace health() with getHealthV2(). The v2 API returns a more structured response with additional node health information for clustered setups.',
  })
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/system/health');
  }

  /**
   * Get system status
   *
   * @returns System status including version and operational state
   * @since 5.2
   * @deprecated Use getStatusV2() instead for REST-compliant API
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const status = await client.status();
   * console.log(status.status); // 'UP', 'DOWN', 'STARTING', etc.
   * console.log(status.version); // e.g., '10.3.0.82913'
   * ```
   */
  @Deprecated({
    deprecatedSince: '10.6',
    removalDate: 'TBD',
    replacement: 'getStatusV2()',
    reason: 'v1 endpoint deprecated in favor of REST-compliant v2 API',
    migrationGuide:
      'Replace status() with getStatusV2(). The v2 API provides additional information like migration progress and startup time.',
  })
  async status(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/api/system/status');
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
   * @deprecated Use getInfoV2() instead for REST-compliant API
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const info = await client.info();
   * console.log(info['System Date']);
   * console.log(info.Database?.Version);
   * ```
   */
  @Deprecated({
    deprecatedSince: '10.6',
    removalDate: 'TBD',
    replacement: 'getInfoV2()',
    reason: 'v1 endpoint deprecated in favor of REST-compliant v2 API',
    migrationGuide:
      'Replace info() with getInfoV2(). The v2 API provides a more structured response with typed fields and consistent naming.',
  })
  async info(): Promise<InfoResponse> {
    return this.request<InfoResponse>('/api/system/info');
  }
}
