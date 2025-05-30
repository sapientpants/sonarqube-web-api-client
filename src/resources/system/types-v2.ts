/**
 * Types for SonarQube System API v2
 * @since 10.6
 */

/**
 * System edition types
 */
export type SystemEdition = 'community' | 'developer' | 'enterprise' | 'datacenter';

/**
 * System feature flags
 */
export type SystemFeature =
  | 'branch'
  | 'audit'
  | 'portfolios'
  | 'governance'
  | 'security'
  | 'developerEdition'
  | 'license';

/**
 * System status
 */
export type SystemStatusV2 = 'UP' | 'DOWN' | 'STARTING' | 'RESTARTING' | 'DB_MIGRATION_RUNNING';

/**
 * Health status
 */
export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

/**
 * System information (v2)
 */
export interface SystemInfoV2 {
  /**
   * SonarQube version
   */
  version: string;

  /**
   * System edition
   */
  edition: SystemEdition;

  /**
   * Enabled features
   */
  features: SystemFeature[];

  /**
   * Server ID (UUID)
   */
  serverId: string;

  /**
   * Installation date (ISO 8601)
   */
  installedAt: string;

  /**
   * Database information
   */
  database: {
    name: string;
    version: string;
  };

  /**
   * Plugins information
   */
  plugins?: Array<{
    key: string;
    name: string;
    version: string;
  }>;

  /**
   * External authentication providers
   */
  externalAuthProviders?: string[];

  /**
   * Whether system is in production mode
   */
  productionMode: boolean;

  /**
   * Branch support information
   */
  branchSupport?: {
    enabled: boolean;
    includedLanguages?: string[];
  };
}

/**
 * System health (v2)
 */
export interface SystemHealthV2 {
  /**
   * Overall health status
   */
  status: HealthStatus;

  /**
   * Individual node health (for clustered setups)
   */
  nodes?: Array<{
    name: string;
    status: HealthStatus;
    causes?: string[];
  }>;

  /**
   * Health check timestamp (ISO 8601)
   */
  checkedAt: string;
}

/**
 * System status (v2)
 */
export interface SystemStatusV2Response {
  /**
   * System operational status
   */
  status: SystemStatusV2;

  /**
   * Additional status message
   */
  message?: string;

  /**
   * Migration percentage (if DB_MIGRATION_RUNNING)
   */
  migrationProgress?: number;

  /**
   * Startup time (if STARTING)
   */
  startupTime?: number;
}
