/**
 * SonarQube Integration Test Suite
 *
 * Runs integration tests specifically for SonarQube instances.
 * Includes SonarQube-specific features and excludes SonarCloud-only APIs.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../config/environment.js';
import { getTestConfiguration, getEnabledTestCategories } from '../config/testConfig.js';

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
      `   Destructive Tests: ${testConfig.allowDestructiveTests ? 'Enabled' : 'Disabled'}`,
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

    // Server API - Version and server information
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/server/server.integration.test.ts');

    // Projects API - Project management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/projects/projects.integration.test.ts');

    // Users API - User search and management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/users/users.integration.test.ts');
  });

  // Foundation APIs - Basic platform information
  describe('Foundation APIs', () => {
    // Languages API - Programming language support
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/languages/languages.integration.test.ts');

    // Metrics API - Available code metrics
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/metrics/metrics.integration.test.ts');

    // Editions API - License information (SonarQube only)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/editions/editions.integration.test.ts');

    // Notifications API - User notification preferences
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/notifications/notifications.integration.test.ts');
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

  // Code Analysis APIs - Source code and quality analysis
  describe('Code Analysis APIs', () => {
    // Components API - Project structure and component search
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/components/components.integration.test.ts');

    // Sources API - Source code viewing and SCM information
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/sources/sources.integration.test.ts');

    // Hotspots API - Security hotspot management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/hotspots/hotspots.integration.test.ts');

    // Duplications API - Code duplication detection
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/duplications/duplications.integration.test.ts');

    // Analysis API - Project analysis history and details
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/analysis/analysis.integration.test.ts');

    // Analysis Cache API - Analysis cache management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/analysis-cache/analysis-cache.integration.test.ts');
  });

  // Project Management APIs - Project-level operations
  describe('Project Management APIs', () => {
    // Project Analyses API - Project analysis history management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-analyses/project-analyses.integration.test.ts');

    // Project Branches API - Branch analysis management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-branches/project-branches.integration.test.ts');

    // Project Pull Requests API - PR analysis management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-pull-requests/project-pull-requests.integration.test.ts');

    // New Code Periods API - New code period configuration
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/new-code-periods/new-code-periods.integration.test.ts');

    // Project Badges API - Badge generation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-badges/project-badges.integration.test.ts');

    // Project Links API - External link management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-links/project-links.integration.test.ts');

    // Project Tags API - Project tagging and categorization
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-tags/project-tags.integration.test.ts');

    // Project Dump API - Project export and backup
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/project-dump/project-dump.integration.test.ts');
  });

  // SonarQube-specific APIs
  describe('SonarQube-Specific APIs', () => {
    const hasEditionsCategory = enabledCategories.some((c) => c.name === 'Editions');
    const hasSystemAdminCategory = enabledCategories.some(
      (c) => c.name === 'System Administration',
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

  // Administration APIs
  describe('Administration APIs', () => {
    // Permissions API - Global and project permission management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/permissions/permissions.integration.test.ts');

    // Settings API - Global and project-level configuration management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/settings/settings.integration.test.ts');

    // User Tokens API - User authentication token management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/user-tokens/user-tokens.integration.test.ts');

    // Webhooks API - Webhook notification management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/webhooks/webhooks.integration.test.ts');

    // Favorites API - User favorite component management
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/favorites/favorites.integration.test.ts');

    // Views API - Portfolio and application view management (Enterprise)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/views/views.integration.test.ts');

    // Webservices API - API discovery and documentation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/webservices/webservices.integration.test.ts');
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
