/**
 * Integration test configuration and settings
 *
 * Defines timeouts, retry logic, and test behavior for different
 * types of integration tests.
 */

import type { IntegrationTestConfig } from './environment.js';

export interface TestConfiguration {
  /** Default timeout for API calls (ms) */
  defaultTimeout: number;
  /** Timeout for long-running operations (ms) */
  longTimeout: number;
  /** Maximum number of retries for flaky tests */
  maxRetries: number;
  /** Delay between retries (ms) */
  retryDelay: number;
  /** Whether to run destructive tests (delete operations) */
  allowDestructiveTests: boolean;
  /** Whether to run enterprise feature tests */
  runEnterpriseTests: boolean;
}

/**
 * Default test configuration
 */
export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  defaultTimeout: 10000, // 10 seconds
  longTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  allowDestructiveTests: false,
  runEnterpriseTests: false,
};

/**
 * Test categories and their requirements
 */
export interface TestCategory {
  name: string;
  description: string;
  requiredPermissions?: string[];
  platformSupport: Array<'sonarqube' | 'sonarcloud'>;
  requiresOrganization?: boolean;
  isDestructive?: boolean;
  isEnterpriseOnly?: boolean;
}

export const TEST_CATEGORIES: Record<string, TestCategory> = {
  system: {
    name: 'System',
    description: 'Basic system information and health checks',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  authentication: {
    name: 'Authentication',
    description: 'Token validation and user authentication',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  projects: {
    name: 'Projects',
    description: 'Project management and CRUD operations',
    requiredPermissions: ['Browse'],
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  users: {
    name: 'Users',
    description: 'User search and management',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  issues: {
    name: 'Issues',
    description: 'Issue search and management',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  qualityGates: {
    name: 'Quality Gates',
    description: 'Quality gate management',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  qualityProfiles: {
    name: 'Quality Profiles',
    description: 'Quality profile management',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  rules: {
    name: 'Rules',
    description: 'Rule search and management',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  measures: {
    name: 'Measures',
    description: 'Project and component measures',
    platformSupport: ['sonarqube', 'sonarcloud'],
  },
  // Platform-specific categories
  editions: {
    name: 'Editions',
    description: 'Commercial edition management',
    requiredPermissions: ['Administer System'],
    platformSupport: ['sonarqube'],
    isEnterpriseOnly: true,
  },
  organizations: {
    name: 'Organizations',
    description: 'Organization management',
    platformSupport: ['sonarcloud'],
    requiresOrganization: true,
  },
  // Destructive test categories
  projectsAdmin: {
    name: 'Projects (Admin)',
    description: 'Project creation and deletion',
    requiredPermissions: ['Create Projects', 'Administer'],
    platformSupport: ['sonarqube', 'sonarcloud'],
    isDestructive: true,
  },
  systemAdmin: {
    name: 'System Administration',
    description: 'System-level administrative functions',
    requiredPermissions: ['Administer System'],
    platformSupport: ['sonarqube', 'sonarcloud'],
    isDestructive: true,
  },
};

/**
 * Gets test configuration with environment-specific overrides
 */
export function getTestConfiguration(_envConfig: IntegrationTestConfig): TestConfiguration {
  const config = { ...DEFAULT_TEST_CONFIG };

  // Override from environment variables
  if (process.env['INTEGRATION_TEST_TIMEOUT']?.trim()) {
    config.defaultTimeout = parseInt(process.env['INTEGRATION_TEST_TIMEOUT'], 10);
  }

  if (process.env['INTEGRATION_TEST_MAX_RETRIES']?.trim()) {
    config.maxRetries = parseInt(process.env['INTEGRATION_TEST_MAX_RETRIES'], 10);
  }

  // Enable destructive tests only if explicitly requested
  config.allowDestructiveTests = process.env['INTEGRATION_TEST_DESTRUCTIVE'] === 'true';

  // Enable enterprise tests only if explicitly requested
  config.runEnterpriseTests = process.env['INTEGRATION_TEST_ENTERPRISE'] === 'true';

  return config;
}

/**
 * Determines which test categories should run based on configuration
 */
export function getEnabledTestCategories(
  envConfig: IntegrationTestConfig,
  testConfig: TestConfiguration,
): TestCategory[] {
  return Object.values(TEST_CATEGORIES).filter((category) => {
    // Check platform support
    if (!category.platformSupport.includes(envConfig.platform)) {
      return false;
    }

    // Check organization requirement
    if (Boolean(category.requiresOrganization) && !envConfig.hasOrganization) {
      return false;
    }

    // Check destructive test setting
    if (Boolean(category.isDestructive) && !testConfig.allowDestructiveTests) {
      return false;
    }

    // Check enterprise test setting
    if (Boolean(category.isEnterpriseOnly) && !testConfig.runEnterpriseTests) {
      return false;
    }

    return true;
  });
}

/**
 * Gets a description of what tests will run
 */
export function getTestPlan(
  envConfig: IntegrationTestConfig,
  testConfig: TestConfiguration,
): string {
  const enabledCategories = getEnabledTestCategories(envConfig, testConfig);
  const categoryNames = enabledCategories.map((cat) => cat.name).join(', ');

  const platform = envConfig.platform.charAt(0).toUpperCase() + envConfig.platform.slice(1);
  const destructiveNote = testConfig.allowDestructiveTests ? ' (including destructive tests)' : '';

  return `Testing ${categoryNames} against ${platform}${destructiveNote}`;
}
