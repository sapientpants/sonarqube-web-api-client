/**
 * Integration test environment configuration
 *
 * Handles environment variable validation and platform detection
 * for running integration tests against SonarQube or SonarCloud instances.
 */

export interface IntegrationTestConfig {
  /** SonarQube/SonarCloud instance URL */
  url: string;
  /** Authentication token */
  token: string;
  /** Organization key (required for SonarCloud) */
  organization: string | undefined;
  /** Detected platform type */
  platform: 'sonarqube' | 'sonarcloud';
  /** Whether this is a SonarCloud instance */
  isSonarCloud: boolean;
  /** Whether organization is available (either provided or not needed) */
  hasOrganization: boolean;
}

/**
 * Environment variable names
 */
export const ENV_VARS = {
  url: 'SONARQUBE_URL',
  token: 'SONARQUBE_TOKEN',
  organization: 'SONARQUBE_ORGANIZATION',
} as const;

/**
 * Validates and parses integration test environment configuration
 */
export function getIntegrationTestConfig(): IntegrationTestConfig {
  const url = process.env[ENV_VARS.url];
  const token = process.env[ENV_VARS.token];
  const organization = process.env[ENV_VARS.organization];

  // Validate required environment variables
  if (!url?.trim()) {
    throw new Error(
      `Missing required environment variable: ${ENV_VARS.url}. ` +
        'Please set the URL of your SonarQube/SonarCloud instance.'
    );
  }

  if (!token?.trim()) {
    throw new Error(
      `Missing required environment variable: ${ENV_VARS.token}. ` +
        'Please set your authentication token.'
    );
  }

  // Detect platform based on URL patterns
  const platform = detectPlatform(url);
  const isSonarCloud = platform === 'sonarcloud';

  // SonarCloud requires an organization
  if (isSonarCloud && !organization?.trim()) {
    throw new Error(
      `SonarCloud instance detected but ${ENV_VARS.organization} is not set. ` +
        'SonarCloud requires an organization to be specified.'
    );
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`URL must use HTTP or HTTPS protocol: ${url}`);
  }

  return {
    url: url.replace(/\/$/, ''), // Remove trailing slash
    token,
    organization: organization || undefined,
    platform,
    isSonarCloud,
    hasOrganization: !isSonarCloud || Boolean(organization),
  };
}

/**
 * Detects whether the URL points to SonarQube or SonarCloud
 */
function detectPlatform(url: string): 'sonarqube' | 'sonarcloud' {
  const normalizedUrl = url.toLowerCase();

  // SonarCloud patterns
  if (normalizedUrl.includes('sonarcloud.io') || normalizedUrl.includes('sonarcloud.com')) {
    return 'sonarcloud';
  }

  // Default to SonarQube for all other URLs
  return 'sonarqube';
}

/**
 * Checks if integration tests can run with current environment
 */
export function canRunIntegrationTests(): boolean {
  try {
    getIntegrationTestConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a user-friendly description of the integration test environment
 */
export function getEnvironmentDescription(): string {
  if (!canRunIntegrationTests()) {
    return 'Integration tests not configured (missing environment variables)';
  }

  const config = getIntegrationTestConfig();
  const platform = config.platform.charAt(0).toUpperCase() + config.platform.slice(1);
  const orgInfo = config.organization?.trim() ? ` (org: ${config.organization})` : '';

  return `${platform} instance at ${config.url}${orgInfo}`;
}

/**
 * Environment validation errors
 */
export class IntegrationTestConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationTestConfigError';
  }
}
