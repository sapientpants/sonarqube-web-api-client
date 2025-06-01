/**
 * Measures API Integration Tests
 *
 * Tests the Measures API functionality for both SonarQube and SonarCloud.
 * Covers project metrics, component measures, and historical data retrieval.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { IntegrationAssertions } from '../../utils/assertions';
import { measureTime, retryOperation } from '../../utils/testHelpers';
import {
  getIntegrationTestConfig,
  getTestConfiguration,
  type IntegrationTestConfig,
  type TestConfiguration,
} from '../../config';

describe('Measures API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let envConfig: IntegrationTestConfig;
  let testConfig: TestConfiguration;
  let testProjectKey: string;
  let existingProjectKey: string;

  beforeAll(async () => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Try to find an existing project with measures
    const projectsBuilder = client.projects.search().pageSize(10);
    if (envConfig.isSonarCloud && envConfig.organization) {
      projectsBuilder.organization(envConfig.organization);
    }

    const projectsResult = await projectsBuilder.execute();
    if (projectsResult.components.length > 0) {
      existingProjectKey = projectsResult.components[0].key;
    }

    // Create a test project for measures operations
    if (testConfig.allowDestructiveTests) {
      testProjectKey = await dataManager.createTestProject({
        name: 'Measures API Test Project',
        key: `integration-test-measures-${Date.now()}`,
        visibility: 'private',
      });
    }
  }, testConfig.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig.longTimeout);

  describe('Component Measures Operations', () => {
    test('should get component measures for project', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping component measures test - no project available');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .component()
          .component(projectKey)
          .metricKeys(['ncloc', 'coverage', 'bugs', 'vulnerabilities'])
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.component).toBeDefined();
      expect(result.component.key).toBe(projectKey);
      expect(result.component.name).toBeDefined();
      expect(result.component.qualifier).toBeDefined();

      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.metrics)).toBe(true);

      if (result.component.measures) {
        expect(Array.isArray(result.component.measures)).toBe(true);

        result.component.measures.forEach((measure) => {
          expect(measure.metric).toBeDefined();
          expect(measure.value !== undefined || measure.periods !== undefined).toBe(true);

          // Validate metric keys
          expect([
            'ncloc',
            'coverage',
            'bugs',
            'vulnerabilities',
            'code_smells',
            'sqale_index',
            'reliability_rating',
            'security_rating',
          ]).toContain(measure.metric);
        });
      }
    });

    test('should get component measures with additional fields', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn(
          'Skipping component measures with additional fields test - no project available'
        );
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .component()
          .component(projectKey)
          .metricKeys(['ncloc', 'coverage'])
          .additionalFields(['metrics', 'periods'])
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.component).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.metrics)).toBe(true);

      // Verify metric definitions are included
      if (result.metrics.length > 0) {
        const metric = result.metrics[0];
        expect(metric.key).toBeDefined();
        expect(metric.name).toBeDefined();
        expect(metric.type).toBeDefined();
      }

      // Check for period information if available
      if (result.periods) {
        expect(Array.isArray(result.periods)).toBe(true);
        result.periods.forEach((period) => {
          expect(period.mode).toBeDefined();
          expect(period.date).toBeDefined();
        });
      }
    });
  });

  describe('Component Tree Measures', () => {
    test('should get measures for component tree', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping component tree measures test - no project available');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .componentTree()
          .component(projectKey)
          .metricKeys(['ncloc', 'complexity'])
          .qualifiers(['FIL'])
          .pageSize(10)
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.baseComponent).toBeDefined();
      expect(result.baseComponent.key).toBe(projectKey);

      expect(result.components).toBeDefined();
      expect(Array.isArray(result.components)).toBe(true);

      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.metrics)).toBe(true);

      expect(result.paging).toBeDefined();
      expect(result.paging.pageIndex).toBeDefined();
      expect(result.paging.pageSize).toBeDefined();
      expect(result.paging.total).toBeDefined();

      // Validate components in tree
      result.components.forEach((component) => {
        expect(component.key).toBeDefined();
        expect(component.name).toBeDefined();
        expect(component.qualifier).toBeDefined();
        expect(component.path).toBeDefined();

        if (component.measures) {
          component.measures.forEach((measure) => {
            expect(measure.metric).toBeDefined();
            expect(['ncloc', 'complexity']).toContain(measure.metric);
          });
        }
      });
    });

    test('should handle component tree with different strategies', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping component tree strategies test - no project available');
        return;
      }

      const strategies = ['all', 'leaves', 'children'] as const;

      for (const strategy of strategies) {
        const { result, durationMs } = await measureTime(() =>
          client.measures
            .componentTree()
            .component(projectKey)
            .metricKeys(['ncloc'])
            .strategy(strategy)
            .pageSize(5)
            .execute()
        );

        IntegrationAssertions.expectValidResponse(result);
        IntegrationAssertions.expectReasonableResponseTime(durationMs);

        expect(result.baseComponent).toBeDefined();
        expect(result.components).toBeDefined();
        expect(result.paging).toBeDefined();

        // Each strategy should return valid results
        expect(Array.isArray(result.components)).toBe(true);
      }
    });
  });

  describe('Measures Search Operations', () => {
    test('should search project measures with filters', async () => {
      const searchBuilder = client.measures
        .search()
        .metricKeys(['ncloc', 'coverage', 'bugs'])
        .pageSize(10);

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.measures).toBeDefined();
      expect(Array.isArray(result.measures)).toBe(true);

      expect(result.paging).toBeDefined();
      expect(result.paging.pageIndex).toBeDefined();
      expect(result.paging.pageSize).toBeDefined();

      // Validate measure structure
      result.measures.forEach((measure) => {
        expect(measure.component).toBeDefined();
        expect(measure.metric).toBeDefined();
        expect(['ncloc', 'coverage', 'bugs']).toContain(measure.metric);
        expect(measure.value !== undefined || measure.periods !== undefined).toBe(true);
      });
    });

    test('should search measures with project key filter', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping project-filtered measures search - no project available');
        return;
      }

      const searchBuilder = client.measures
        .search()
        .projectKeys([projectKey])
        .metricKeys(['ncloc', 'complexity']);

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      // All measures should belong to the specified project
      result.measures.forEach((measure) => {
        expect(measure.component).toContain(projectKey);
      });
    });
  });

  describe('Historical Measures', () => {
    test('should get measures history for component', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping measures history test - no project available');
        return;
      }

      // Calculate date range (last 30 days)
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .searchHistory()
          .component(projectKey)
          .metrics(['ncloc', 'coverage'])
          .from(fromDate.toISOString().split('T')[0])
          .to(toDate.toISOString().split('T')[0])
          .pageSize(100)
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.measures).toBeDefined();
      expect(Array.isArray(result.measures)).toBe(true);

      expect(result.paging).toBeDefined();

      // Validate historical measures structure
      result.measures.forEach((measure) => {
        expect(measure.metric).toBeDefined();
        expect(['ncloc', 'coverage']).toContain(measure.metric);
        expect(measure.history).toBeDefined();
        expect(Array.isArray(measure.history)).toBe(true);

        measure.history.forEach((historyPoint) => {
          expect(historyPoint.date).toBeDefined();
          expect(historyPoint.value !== undefined || historyPoint.value === '').toBe(true);
        });
      });
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should handle organization context for SonarCloud', async () => {
      if (!envConfig.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud organization test - not SonarCloud or no organization');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .search()
          .organization(envConfig.organization)
          .metricKeys(['ncloc'])
          .pageSize(5)
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.measures).toBeDefined();
      // All measures should be from projects within the organization
      expect(Array.isArray(result.measures)).toBe(true);
    });

    test('should access global measures for SonarQube', async () => {
      if (envConfig.isSonarCloud) {
        console.warn('Skipping SonarQube global measures test - running on SonarCloud');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures.search().metricKeys(['ncloc', 'projects']).pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.measures).toBeDefined();
      expect(Array.isArray(result.measures)).toBe(true);
    });
  });

  describe('Metric Validation', () => {
    test('should validate common metric keys', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping metric validation test - no project available');
        return;
      }

      const commonMetrics = [
        'ncloc',
        'lines',
        'statements',
        'functions',
        'classes',
        'complexity',
        'cognitive_complexity',
        'coverage',
        'line_coverage',
        'branch_coverage',
        'bugs',
        'vulnerabilities',
        'code_smells',
        'reliability_rating',
        'security_rating',
        'sqale_rating',
      ];

      const { result, durationMs } = await measureTime(() =>
        client.measures.component().component(projectKey).metricKeys(commonMetrics).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.component).toBeDefined();

      if (result.component.measures) {
        result.component.measures.forEach((measure) => {
          expect(commonMetrics).toContain(measure.metric);

          // Validate measure value format based on metric type
          if (measure.value !== undefined) {
            switch (measure.metric) {
              case 'reliability_rating':
              case 'security_rating':
              case 'sqale_rating': {
                // Ratings should be 1-5
                const rating = parseFloat(measure.value);
                expect(rating).toBeGreaterThanOrEqual(1);
                expect(rating).toBeLessThanOrEqual(5);
                break;
              }
              case 'coverage':
              case 'line_coverage':
              case 'branch_coverage': {
                // Coverage should be 0-100
                const coverage = parseFloat(measure.value);
                expect(coverage).toBeGreaterThanOrEqual(0);
                expect(coverage).toBeLessThanOrEqual(100);
                break;
              }
              default: {
                // Other metrics should be non-negative numbers
                const value = parseFloat(measure.value);
                expect(value).toBeGreaterThanOrEqual(0);
              }
            }
          }
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid component key gracefully', async () => {
      try {
        await client.measures
          .component()
          .component('invalid-component-key-that-does-not-exist')
          .metricKeys(['ncloc'])
          .execute();
      } catch (error) {
        // Expected behavior - invalid component should cause an error
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid metric keys gracefully', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping invalid metric test - no project available');
        return;
      }

      try {
        const result = await client.measures
          .component()
          .component(projectKey)
          .metricKeys(['invalid_metric_key'])
          .execute();

        // Should return valid response but no measures for invalid metrics
        IntegrationAssertions.expectValidResponse(result);
        expect(result.component).toBeDefined();
      } catch (error) {
        // Some platforms might return an error for invalid metrics
        expect(error).toBeDefined();
      }
    });
  });

  describe('Measures Performance', () => {
    test('should maintain reasonable performance for measures requests', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping measures performance test - no project available');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.measures
          .component()
          .component(projectKey)
          .metricKeys(['ncloc', 'coverage', 'bugs'])
          .execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs, {
        expected: 2000, // 2 seconds
        maximum: 8000, // 8 seconds absolute max
      });
    });

    test('should handle concurrent measures requests', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping concurrent measures test - no project available');
        return;
      }

      const requests = Array(3)
        .fill(null)
        .map(() =>
          client.measures.component().component(projectKey).metricKeys(['ncloc']).execute()
        );

      const results = await Promise.all(requests);

      results.forEach((result) => {
        IntegrationAssertions.expectValidResponse(result);
        expect(result.component).toBeDefined();
      });
    });
  });

  describe('Measures Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping measures retry test - no project available');
        return;
      }

      const operation = async (): Promise<unknown> =>
        client.measures.component().component(projectKey).metricKeys(['ncloc']).execute();

      const result = await retryOperation(operation, {
        maxRetries: testConfig.maxRetries,
        delay: testConfig.retryDelay,
      });

      IntegrationAssertions.expectValidResponse(result);
      expect(result.component).toBeDefined();
    });
  });
});
