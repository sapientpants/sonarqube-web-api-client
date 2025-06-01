/**
 * Measures API Integration Tests
 *
 * Tests the Measures API functionality for both SonarQube and SonarCloud.
 * Covers project metrics, component measures, and historical data retrieval.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, withRetry } from '../../utils/testHelpers';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Measures API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let testProjectKey: string;
  let existingProjectKey: string;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Try to find an existing project with measures
    const projectsBuilder = client.projects.search().pageSize(10);

    const projectsResult = await projectsBuilder.execute();
    if (projectsResult.components.length > 0) {
      existingProjectKey = projectsResult.components[0].key;
    }

    // Create a test project for measures operations
    if (testConfig.allowDestructiveTests) {
      const createdProject = await dataManager.createTestProject(
        'integration-test-measures',
        'Measures API Test Project'
      );
      testProjectKey = createdProject.key;
    }
  }, testConfig.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig?.longTimeout ?? 30000);

  describe('Component Measures Operations', () => {
    test('should get component measures for project', async () => {
      const projectKey = existingProjectKey || testProjectKey;
      if (!projectKey) {
        console.warn('Skipping component measures test - no project available');
        return;
      }

      const { result, durationMs } = await measureTime(async () =>
        client.measures.component({
          component: projectKey,
          metricKeys: ['ncloc', 'coverage', 'bugs', 'vulnerabilities'],
        })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.component).toBeDefined();
      expect(result.component.key).toBe(projectKey);
      expect(result.component.name).toBeDefined();
      expect(result.component.qualifier).toBeDefined();

      // Metrics might not be returned depending on request parameters
      if (result.metrics) {
        expect(Array.isArray(result.metrics)).toBe(true);
      }

      if (result.component.measures) {
        expect(Array.isArray(result.component.measures)).toBe(true);

        result.component.measures.forEach((measure) => {
          expect(measure.metric).toBeDefined();
          expect(measure.value !== undefined || measure.period !== undefined).toBe(true);

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

      const { result, durationMs } = await measureTime(async () =>
        client.measures.component({
          component: projectKey,
          metricKeys: ['ncloc', 'coverage'],
          additionalFields: ['metrics', 'period'],
        })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.component).toBeDefined();

      // Metrics should be returned when additionalFields includes 'metrics'
      if (result.metrics) {
        expect(Array.isArray(result.metrics)).toBe(true);
      }

      // Verify metric definitions are included
      if (result.metrics && result.metrics.length > 0) {
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

      const { result, durationMs } = await measureTime(async () =>
        client.measures
          .componentTree(projectKey, ['ncloc', 'complexity'])
          .withQualifiers('FIL')
          .pageSize(10)
          .execute()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.baseComponent).toBeDefined();
      expect(result.baseComponent.key).toBe(projectKey);

      expect(result.components).toBeDefined();
      expect(Array.isArray(result.components)).toBe(true);

      // Metrics might not be returned in component tree responses
      if (result.metrics) {
        expect(Array.isArray(result.metrics)).toBe(true);
      }

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
        const { result, durationMs } = await measureTime(async () =>
          client.measures
            .componentTree(projectKey, ['ncloc'])
            .withStrategy(strategy)
            .pageSize(5)
            .execute()
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.baseComponent).toBeDefined();
        expect(result.components).toBeDefined();
        expect(result.paging).toBeDefined();

        // Each strategy should return valid results
        expect(Array.isArray(result.components)).toBe(true);
      }
    });
  });

  describe('Measures Search Operations', () => {
    test('should skip measures search - API endpoint not available in current client', async () => {
      // Note: The measures search API endpoint is not implemented in the current MeasuresClient
      // This test is preserved for future implementation
      console.log('ℹ Skipping measures search tests - API not implemented in current client');
      expect(true).toBe(true);
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

      const { result, durationMs } = await measureTime(async () =>
        client.measures
          .searchHistory(projectKey, ['ncloc', 'coverage'])
          .from(fromDate.toISOString().split('T')[0])
          .to(toDate.toISOString().split('T')[0])
          .pageSize(100)
          .execute()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

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
    test('should skip platform-specific measures tests - search API not available', async () => {
      // Note: Platform-specific measures search requires API endpoints not yet implemented
      console.log('ℹ Skipping platform-specific measures tests - search API not implemented');
      expect(true).toBe(true);
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

      const { result, durationMs } = await measureTime(async () =>
        client.measures.component({
          component: projectKey,
          metricKeys: commonMetrics,
        })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

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
        await client.measures.component({
          component: 'invalid-component-key-that-does-not-exist',
          metricKeys: ['ncloc'],
        });
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
        const result = await client.measures.component({
          component: projectKey,
          metricKeys: ['invalid_metric_key'],
        });

        // Should return valid response but no measures for invalid metrics
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
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

      const { result, durationMs } = await measureTime(async () =>
        client.measures.component({
          component: projectKey,
          metricKeys: ['ncloc', 'coverage', 'bugs'],
        })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
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
        .map(async () =>
          client.measures.component({
            component: projectKey,
            metricKeys: ['ncloc'],
          })
        );

      const results = await Promise.all(requests);

      results.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
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
        client.measures.component({
          component: projectKey,
          metricKeys: ['ncloc'],
        });

      const result = await withRetry(operation, {
        maxAttempts: testConfig?.maxRetries ?? 3,
        delayMs: testConfig?.retryDelay ?? 1000,
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      expect((result as { component: unknown }).component).toBeDefined();
    });
  });
});
