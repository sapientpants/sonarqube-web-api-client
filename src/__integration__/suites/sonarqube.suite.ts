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

describe.skipIf(skipSuite)('SonarQube Integration Tests', () => {
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
    console.log(`   Organization: ${envConfig.organization || 'N/A'}`);
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
    require('../api/system/system.integration.test.ts');

    // Projects API - Project management
    require('../api/projects/projects.integration.test.ts');

    // Users API - User search and management
    require('../api/users/users.integration.test.ts');
  });

  // Analysis APIs - Code analysis and quality
  describe('Analysis APIs', () => {
    // These would be loaded conditionally based on enabled categories
    const hasIssuesCategory = enabledCategories.some((c) => c.name === 'Issues');
    const hasQualityGatesCategory = enabledCategories.some((c) => c.name === 'Quality Gates');
    const hasMeasuresCategory = enabledCategories.some((c) => c.name === 'Measures');

    if (hasIssuesCategory) {
      // require('../api/issues/issues.integration.test.ts');
      test.todo('Issues API integration tests');
    }

    if (hasQualityGatesCategory) {
      // require('../api/quality-gates/quality-gates.integration.test.ts');
      test.todo('Quality Gates API integration tests');
    }

    if (hasMeasuresCategory) {
      // require('../api/measures/measures.integration.test.ts');
      test.todo('Measures API integration tests');
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

  // Administrative APIs (if admin tests are enabled)
  if (testConfig.runAdminTests) {
    describe('Administrative APIs', () => {
      test.todo('User management integration tests');
      test.todo('Group management integration tests');
      test.todo('Permission management integration tests');
      test.todo('Settings management integration tests');
    });
  }

  // Enterprise APIs (if enterprise tests are enabled)
  if (testConfig.runEnterpriseTests) {
    describe('Enterprise APIs', () => {
      test.todo('Portfolio management integration tests');
      test.todo('Application management integration tests');
      test.todo('Branch analysis integration tests');
    });
  }

  // Destructive tests (if enabled)
  if (testConfig.allowDestructiveTests) {
    describe('Destructive Operations', () => {
      test.todo('Project lifecycle management tests');
      test.todo('Bulk operations integration tests');
    });
  }

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
