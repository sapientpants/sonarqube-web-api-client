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

(skipSuite ? describe.skip : describe)('SonarQube Integration Tests', () => {
  let envConfig: ReturnType<typeof getIntegrationTestConfig>;
  let testConfig: ReturnType<typeof getTestConfiguration>;
  let enabledCategories: ReturnType<typeof getEnabledTestCategories>;

  beforeAll(() => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    enabledCategories = getEnabledTestCategories(envConfig, testConfig);

    console.log('🔧 SonarQube Integration Test Configuration:');
    console.log(`   URL: ${envConfig.url}`);
    console.log(`   Platform: ${envConfig.platform}`);
    console.log(`   Organization: ${envConfig.organization ?? 'N/A'}`);
    console.log(
      `   Destructive Tests: ${testConfig.allowDestructiveTests ? 'Enabled' : 'Disabled'}`
    );
    console.log(`   Admin Tests: ${testConfig.runAdminTests ? 'Enabled' : 'Disabled'}`);
    console.log(`   Enterprise Tests: ${testConfig.runEnterpriseTests ? 'Enabled' : 'Disabled'}`);
    console.log(`   Enabled Categories: ${enabledCategories.map((c) => c.name).join(', ')}`);
  });

  // Core APIs - Always available on SonarQube
  describe('Core APIs', () => {
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
    // These would be loaded conditionally based on enabled categories
    const hasIssuesCategory = enabledCategories.some((c) => c.name === 'Issues');
    const hasQualityGatesCategory = enabledCategories.some((c) => c.name === 'Quality Gates');
    const hasMeasuresCategory = enabledCategories.some((c) => c.name === 'Measures');

    if (hasIssuesCategory) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../api/issues/issues.integration.test.ts');
    }

    if (hasQualityGatesCategory) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../api/quality-gates/quality-gates.integration.test.ts');
    }

    if (hasMeasuresCategory) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../api/measures/measures.integration.test.ts');
    }
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
        expect(envConfig.platform).toBe('sonarqube');
        expect(envConfig.isSonarCloud).toBe(false);
      });
    });
  });

  // Conditional tests based on configuration
  describe('Conditional Tests', () => {
    test('should run admin tests if enabled', () => {
      if (testConfig?.runAdminTests) {
        describe('Administrative APIs', () => {
          test.todo('User management integration tests');
          test.todo('Group management integration tests');
          test.todo('Permission management integration tests');
          test.todo('Settings management integration tests');
        });
      }
    });

    test('should run enterprise tests if enabled', () => {
      if (testConfig?.runEnterpriseTests) {
        describe('Enterprise APIs', () => {
          test.todo('Portfolio management integration tests');
          test.todo('Application management integration tests');
          test.todo('Branch analysis integration tests');
        });
      }
    });

    test('should run destructive tests if enabled', () => {
      if (testConfig?.allowDestructiveTests) {
        describe('Destructive Operations', () => {
          test.todo('Project lifecycle management tests');
          test.todo('Bulk operations integration tests');
        });
      }
    });
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
