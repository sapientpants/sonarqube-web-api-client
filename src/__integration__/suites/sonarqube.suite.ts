/**
 * SonarQube Integration Test Suite
 *
 * Runs integration tests specifically for SonarQube instances.
 * Includes SonarQube-specific features and excludes SonarCloud-only APIs.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../config/environment';
import { getTestConfiguration, getEnabledTestCategories } from '../config/testConfig';

// Skip entire suite if integration tests are not configured or if not SonarQube
const skipSuite =
  !canRunIntegrationTests() ||
  (canRunIntegrationTests() && getIntegrationTestConfig().platform !== 'sonarqube');

// Initialize configurations at module load time for conditional describe blocks
const envConfig = skipSuite ? null : getIntegrationTestConfig();
const testConfig = skipSuite || !envConfig ? null : getTestConfiguration(envConfig);
const enabledCategories =
  skipSuite || !envConfig || !testConfig ? [] : getEnabledTestCategories(envConfig, testConfig);

(skipSuite ? describe.skip : describe)('SonarQube Integration Tests', () => {
  beforeAll(() => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    console.log('🔧 SonarQube Integration Test Configuration:');
    console.log(`   URL: ${envConfig.url}`);
    console.log(`   Platform: ${envConfig.platform}`);
    console.log(`   Organization: ${envConfig.organization ?? 'N/A'}`);
    console.log(
      `   Destructive Tests: ${testConfig.allowDestructiveTests ? 'Enabled' : 'Disabled'}`
    );
    console.log(`   Enterprise Tests: ${testConfig.runEnterpriseTests ? 'Enabled' : 'Disabled'}`);
    console.log(`   Enabled Categories: ${enabledCategories.map((c) => c.name).join(', ')}`);
  });

  // Core APIs - Always available on SonarQube
  describe('Core APIs', () => {
    // Authentication API - Token validation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/authentication/authentication.integration.test.ts');

    // System API - Basic connectivity and health
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/system/system.integration.test.ts');

    // Projects API - Project management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/projects/projects.integration.test.ts');

    // Users API - User search and management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/users/users.integration.test.ts');
  });

  // Analysis APIs - Code analysis and quality
  describe('Analysis APIs', () => {
    // Core analysis APIs - always available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/issues/issues.integration.test.ts');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/quality-gates/quality-gates.integration.test.ts');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/measures/measures.integration.test.ts');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/quality-profiles/quality-profiles.integration.test.ts');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/rules/rules.integration.test.ts');
  });

  // SonarQube-specific APIs
  describe('SonarQube-Specific APIs', () => {
    const hasEditionsCategory = enabledCategories.some((c) => c.name === 'Editions');
    const hasSystemAdminCategory = enabledCategories.some(
      (c) => c.name === 'System Administration'
    );

    if (hasEditionsCategory) {
      describe('Editions API', () => {
        test.todo('License management integration tests');
        test.todo('Grace period activation tests');
      });
    }

    if (hasSystemAdminCategory) {
      describe('System Administration', () => {
        test.todo('System configuration tests');
        test.todo('Plugin management tests');
      });
    }

    // Always test that SonarCloud-specific APIs are not available
    describe('SonarCloud API Exclusions', () => {
      test('should not have SonarCloud-specific endpoints', () => {
        // This is a meta-test to ensure we're testing the right platform
        expect(envConfig?.platform).toBe('sonarqube');
        expect(envConfig?.isSonarCloud).toBe(false);
      });
    });
  });

  // Administrative APIs - Always available (assumes admin permissions)
  describe('Administrative APIs', () => {
    test.todo('User management integration tests');
    test.todo('Group management integration tests');
    test.todo('Permission management integration tests');
    test.todo('Settings management integration tests');
  });

  (testConfig?.runEnterpriseTests ? describe : describe.skip)('Enterprise APIs', () => {
    test.todo('Portfolio management integration tests');
    test.todo('Application management integration tests');
    test.todo('Branch analysis integration tests');
  });

  (testConfig?.allowDestructiveTests ? describe : describe.skip)('Destructive Operations', () => {
    test.todo('Project lifecycle management tests');
    test.todo('Bulk operations integration tests');
  });

  // Performance and reliability tests
  describe('Performance & Reliability', () => {
    test.todo('API response time benchmarks');
    test.todo('Concurrent request handling');
    test.todo('Rate limiting behavior');
    test.todo('Large dataset handling');
  });

  afterAll(() => {
    console.log('✅ SonarQube Integration Tests Complete');
  });
});
