/**
 * SonarCloud Integration Test Suite
 *
 * Runs integration tests specifically for SonarCloud instances.
 * Includes SonarCloud-specific features and excludes SonarQube-only APIs.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../config/environment';
import { getTestConfiguration, getEnabledTestCategories } from '../config/testConfig';

// Skip entire suite if integration tests are not configured or if not SonarCloud
const skipSuite =
  !canRunIntegrationTests() ||
  (canRunIntegrationTests() && getIntegrationTestConfig().platform !== 'sonarcloud');

// Initialize configurations at module load time for conditional describe blocks
const envConfig = skipSuite ? null : getIntegrationTestConfig();
const testConfig = skipSuite || !envConfig ? null : getTestConfiguration(envConfig);
const enabledCategories =
  skipSuite || !envConfig || !testConfig ? [] : getEnabledTestCategories(envConfig, testConfig);

(skipSuite ? describe.skip : describe)('SonarCloud Integration Tests', () => {
  beforeAll(() => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    console.log('☁️ SonarCloud Integration Test Configuration:');
    console.log(`   URL: ${envConfig.url}`);
    console.log(`   Platform: ${envConfig.platform}`);
    console.log(`   Organization: ${envConfig.organization ?? 'N/A'}`);
    console.log(
      `   Destructive Tests: ${testConfig.allowDestructiveTests ? 'Enabled' : 'Disabled'}`,
    );
    console.log(`   Enabled Categories: ${enabledCategories.map((c) => c.name).join(', ')}`);
  });

  // Core APIs - Available on both platforms but may have different behavior
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

    // Projects API - Project management (organization-scoped)
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

    // Notifications API - User notification preferences
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/notifications/notifications.integration.test.ts');
  });

  // Analysis APIs - Code analysis and quality
  describe('Analysis APIs', () => {
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

    // Quality Profiles - Always available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../api/quality-profiles/quality-profiles.integration.test.ts');

    // Rules API - Rule search and management
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

  // SonarCloud-specific APIs and behaviors
  describe('SonarCloud-Specific Features', () => {
    const hasOrganizationsCategory = enabledCategories.some((c) => c.name === 'Organizations');

    describe('Organization Context', () => {
      test('should require organization for all operations', () => {
        expect(envConfig?.organization).toBeTruthy();
        expect(envConfig?.hasOrganization).toBe(true);
      });

      test('should include organization in API calls', () => {
        // This is a meta-test to verify our client configuration
        expect(envConfig?.isSonarCloud).toBe(true);
        expect(envConfig?.platform).toBe('sonarcloud');
      });
    });

    if (hasOrganizationsCategory) {
      describe('Organizations API', () => {
        test.todo('Organization information retrieval');
        test.todo('Organization member management');
        test.todo('Organization settings management');
      });
    }

    describe('Billing & Subscriptions', () => {
      test.todo('Billing information access (admin only)');
      test.todo('Usage metrics and limits');
      test.todo('Subscription status checks');
    });

    describe('ALM Integrations', () => {
      test.todo('GitHub integration tests');
      test.todo('GitLab integration tests');
      test.todo('Bitbucket integration tests');
      test.todo('Azure DevOps integration tests');
    });

    // Always test that SonarQube-specific APIs are not available
    describe('SonarQube API Exclusions', () => {
      test('should not have SonarQube-specific endpoints', () => {
        expect(envConfig?.platform).toBe('sonarcloud');
        expect(envConfig?.isSonarCloud).toBe(true);
      });

      test.todo('should not access Editions API (SonarQube-only)');
      test.todo('should not access System administration APIs');
    });
  });

  // Multi-tenancy and organization isolation
  describe('Organization Isolation', () => {
    test.todo('should only access projects within organization');
    test.todo('should scope user searches to organization');
    test.todo('should respect organization permissions');
  });

  // SonarCloud-specific authentication and permissions
  describe('Authentication & Permissions', () => {
    test.todo('Token-based authentication validation');
    test.todo('Organization-level permission checks');
    test.todo('Project-level permission inheritance');
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

  // Administrative operations - Always available (assumes admin permissions)
  describe('Organization Administration', () => {
    test.todo('Organization member management');
    test.todo('Permission template management');
    test.todo('Organization settings configuration');
    test.todo('Billing and usage management');
  });

  // Destructive operations (only if enabled)
  (testConfig?.allowDestructiveTests ? describe : describe.skip)(
    'Organization-Scoped Destructive Operations',
    () => {
      test.todo('Project lifecycle within organization');
      test.todo('Member invitation and removal');
      test.todo('Bulk organization operations');
    },
  );

  // SonarCloud-specific performance considerations
  describe('SonarCloud Performance & Limits', () => {
    test.todo('Rate limiting behavior (cloud-specific)');
    test.todo('API quota and usage tracking');
    test.todo('Large organization handling');
    test.todo('Cross-region latency considerations');
  });

  // Integration with external services
  describe('External Service Integration', () => {
    test.todo('GitHub App integration validation');
    test.todo('Pull request decoration testing');
    test.todo('Webhook configuration and delivery');
    test.todo('SAML/SSO integration (if configured)');
  });

  afterAll(() => {
    console.log('✅ SonarCloud Integration Tests Complete');
  });
});
