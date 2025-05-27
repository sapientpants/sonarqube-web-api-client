/**
 * Health status levels for SonarQube instance
 */
export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

/**
 * System status
 */
export type SystemStatus =
  | 'UP'
  | 'DOWN'
  | 'STARTING'
  | 'RESTARTING'
  | 'DB_MIGRATION_RUNNING'
  | 'DB_MIGRATION_NEEDED';

/**
 * Response from the health endpoint
 * @since 6.6
 */
export interface HealthResponse {
  /**
   * Overall health status
   */
  health: HealthStatus;

  /**
   * Causes for non-GREEN status
   */
  causes?: string[];
}

/**
 * Response from the status endpoint
 * @since 5.2
 */
export interface StatusResponse {
  /**
   * Unique instance ID
   */
  id: string;

  /**
   * SonarQube version
   */
  version: string;

  /**
   * Current system status
   */
  status: SystemStatus;
}

/**
 * Response from the ping endpoint
 * Simple text response: "pong"
 */
export type PingResponse = string;

/**
 * System information
 * Note: This endpoint might not be available in all versions
 * The property names match the API response format
 */
/* eslint-disable @typescript-eslint/naming-convention */
export interface SystemInfo {
  /**
   * System date/time
   */
  'System Date': string;

  /**
   * Database information
   */
  Database?: {
    Name?: string;
    Version?: string;
  };

  /**
   * Compute Engine information
   */
  'Compute Engine'?: {
    'Pending Tasks'?: number;
    'In Progress Tasks'?: number;
  };

  /**
   * Elasticsearch information
   */
  Elasticsearch?: {
    State?: string;
    Indices?: Record<
      string,
      {
        'Index Size'?: string;
        'Docs Count'?: number;
      }
    >;
  };

  /**
   * JVM information
   */
  'JVM Properties'?: Record<string, string>;

  /**
   * System properties
   */
  'System Properties'?: Record<string, string>;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Response from the info endpoint
 * Contains detailed system information
 */
export type InfoResponse = Record<string, unknown>;
