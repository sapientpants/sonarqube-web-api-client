import { BaseClient } from '../../core/BaseClient.js';
import { Deprecated } from '../../core/deprecation/index.js';
import type { HealthResponse, StatusResponse, InfoResponse } from './types.js';
import type { SystemHealthV2 } from './types-v2.js';

// Constants for repeated deprecation messages
const V2_NOT_AVAILABLE_MESSAGE = 'v2 endpoint not yet available';
const DEPRECATION_REASON_V2_NOT_IMPLEMENTED =
  'v1 endpoint deprecated but v2 replacement not yet implemented in SonarQube';

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
   * Get system liveness status (v2)
   *
   * This endpoint provides a simple liveness check for the system.
   * It's designed for container orchestration and monitoring systems.
   *
   * @returns System liveness status
   * @since 10.3
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const liveness = await client.getLivenessV2();
   * console.log(liveness.status); // 'UP' or 'DOWN'
   * ```
   */
  async getLivenessV2(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/v2/system/liveness');
  }

  /**
   * Get system migrations status (v2)
   *
   * Provides information about database migration status.
   * Useful for monitoring system startup and upgrade processes.
   *
   * @returns Database migration status
   * @since 10.3
   *
   * @example
   * ```typescript
   * const client = new SystemClient(baseUrl, token);
   * const migrations = await client.getMigrationsStatusV2();
   * console.log(migrations.status); // 'UP_TO_DATE', 'RUNNING', etc.
   * ```
   */
  async getMigrationsStatusV2(): Promise<{ status: string; message?: string }> {
    return this.request<{ status: string; message?: string }>('/api/v2/system/migrations-status');
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
   * @since 10.3
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
    replacement: `continue using status() - ${V2_NOT_AVAILABLE_MESSAGE}`,
    reason: DEPRECATION_REASON_V2_NOT_IMPLEMENTED,
    migrationGuide:
      'Continue using status() for now. The v2 system status endpoint is not yet available in current SonarQube versions.',
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
    replacement: `continue using info() - ${V2_NOT_AVAILABLE_MESSAGE}`,
    reason: DEPRECATION_REASON_V2_NOT_IMPLEMENTED,
    migrationGuide:
      'Continue using info() for now. The v2 system info endpoint is not yet available in current SonarQube versions.',
  })
  async info(): Promise<InfoResponse> {
    return this.request<InfoResponse>('/api/system/info');
  }
}
