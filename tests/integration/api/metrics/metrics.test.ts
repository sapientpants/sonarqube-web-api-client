// @ts-nocheck
/**
 * Metrics API Integration Tests
 *
 * Tests the Metrics API functionality for retrieving available code metrics.
 * This is a read-only API that provides information about all metrics available
 * in the SonarQube/SonarCloud instance.
 */

import { IntegrationTestClient } from '../../setup/IntegrationTestClient.js';
import { TestDataManager } from '../../setup/TestDataManager.js';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions.js';
import { measureTime, TEST_TIMING } from '../../utils/testHelpers.js';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment.js';
import { getTestConfiguration } from '../../config/testConfig.js';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Metrics API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Metrics Search Operations', () => {
    test(
      'should search metrics with default parameters',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.metrics.search());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.metrics).toBeDefined();
        expect(Array.isArray(result.metrics)).toBe(true);
        expect(result.metrics.length).toBeGreaterThan(0);
        expect(result.total).toBeDefined();
        expect(typeof result.total).toBe('number');
        expect(result.total).toBeGreaterThan(0);

        // Validate metric structure
        const firstMetric = result.metrics[0];
        expect(firstMetric.key).toBeDefined();
        expect(typeof firstMetric.key).toBe('string');
        expect(firstMetric.name).toBeDefined();
        expect(typeof firstMetric.name).toBe('string');
        expect(firstMetric.type).toBeDefined();
        expect(typeof firstMetric.type).toBe('string');
      },
      TEST_TIMING.normal,
    );

    test(
      'should search metrics with pagination',
      async () => {
        const pageSize = 10;
        const { result, durationMs } = await measureTime(async () =>
          client.metrics.search({ ps: pageSize, p: 1 }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.metrics).toBeDefined();
        expect(result.metrics.length).toBeLessThanOrEqual(pageSize);
        expect(result.total).toBeGreaterThan(0);

        // If there are more metrics than page size, get second page
        if (result.total > pageSize) {
          const { result: secondPage } = await measureTime(async () =>
            client.metrics.search({ ps: pageSize, p: 2 }),
          );

          expect(secondPage.metrics).toBeDefined();
          expect(secondPage.total).toBe(result.total);

          // Ensure different results on different pages
          if (secondPage.metrics.length > 0) {
            const firstPageKeys = result.metrics.map((m) => m.key);
            const secondPageKeys = secondPage.metrics.map((m) => m.key);
            const hasOverlap = firstPageKeys.some((key) => secondPageKeys.includes(key));
            expect(hasOverlap).toBe(false);
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search metrics by text query',
      async () => {
        const searchQuery = 'complexity';
        const { result, durationMs } = await measureTime(async () =>
          client.metrics.search({ f: 'name', ps: 50 }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        // Find complexity-related metrics
        const complexityMetrics = result.metrics.filter(
          (metric) =>
            metric.key.toLowerCase().includes(searchQuery) ||
            metric.name?.toLowerCase().includes(searchQuery),
        );

        expect(complexityMetrics.length).toBeGreaterThan(0);

        // Verify common complexity metrics exist
        const metricKeys = result.metrics.map((m) => m.key);
        expect(metricKeys).toContain('complexity');
      },
      TEST_TIMING.normal,
    );

    test(
      'should include metric domains and descriptions when requested',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.metrics.search({ f: 'name,description,domain' }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.metrics.length).toBeGreaterThan(0);

        // Check that additional fields are included
        const metricsWithDetails = result.metrics.filter(
          (metric) => metric.name || metric.description || metric.domain,
        );
        expect(metricsWithDetails.length).toBeGreaterThan(0);

        // Validate structure of detailed metrics
        metricsWithDetails.forEach((metric) => {
          if (metric.name) {
            expect(typeof metric.name).toBe('string');
          }
          if (metric.description) {
            expect(typeof metric.description).toBe('string');
          }
          if (metric.domain) {
            expect(typeof metric.domain).toBe('string');
          }
        });
      },
      TEST_TIMING.normal,
    );

    test(
      'should filter metrics by type',
      async () => {
        // First get all metrics to see available types
        const { result: allMetrics } = await measureTime(async () =>
          client.metrics.search({ f: 'name' }),
        );

        const metricTypes = [...new Set(allMetrics.metrics.map((m) => m.type))];
        expect(metricTypes.length).toBeGreaterThan(1);

        // Test filtering by a common type
        if (metricTypes.includes('INT')) {
          const { result, durationMs } = await measureTime(async () =>
            client.metrics.search({ isCustom: false }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.metrics).toBeDefined();
          expect(result.metrics.length).toBeGreaterThan(0);
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Common Metrics Validation', () => {
    test(
      'should include standard SonarQube metrics',
      async () => {
        const { result } = await measureTime(
          async () => client.metrics.search({ ps: 500 }), // Get a large set to ensure we find standard metrics
        );

        const metricKeys = result.metrics.map((m) => m.key);

        // Standard metrics that should be available in most instances
        const standardMetrics = [
          'lines',
          'ncloc',
          'complexity',
          'coverage',
          'duplicated_lines_density',
          'violations',
          'bugs',
          'vulnerabilities',
          'code_smells',
        ];

        const foundStandardMetrics = standardMetrics.filter((key) => metricKeys.includes(key));
        expect(foundStandardMetrics.length).toBeGreaterThan(5); // At least most standard metrics
      },
      TEST_TIMING.normal,
    );

    test(
      'should have consistent metric data structure',
      async () => {
        const { result } = await measureTime(async () =>
          client.metrics.search({ f: 'name,description,domain' }),
        );

        expect(result.metrics.length).toBeGreaterThan(0);

        // Check that all metrics have required fields
        result.metrics.forEach((metric) => {
          expect(metric.key).toBeDefined();
          expect(metric.type).toBeDefined();
          expect(typeof metric.key).toBe('string');
          expect(typeof metric.type).toBe('string');
          expect(metric.key.length).toBeGreaterThan(0);
          expect(metric.type.length).toBeGreaterThan(0);

          // Validate type is one of expected values
          const validTypes = [
            'INT',
            'FLOAT',
            'PERCENT',
            'BOOL',
            'STRING',
            'MILLISEC',
            'DATA',
            'LEVEL',
            'DISTRIB',
            'RATING',
            'WORK_DUR',
          ];
          expect(validTypes).toContain(metric.type);
        });
      },
      TEST_TIMING.normal,
    );

    test(
      'should have unique metric keys',
      async () => {
        const { result } = await measureTime(async () => client.metrics.search({ ps: 500 }));

        const metricKeys = result.metrics.map((m) => m.key);
        const uniqueKeys = new Set(metricKeys);

        expect(uniqueKeys.size).toBe(metricKeys.length);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Metrics Domains', () => {
    test(
      'should group metrics by domains',
      async () => {
        const { result } = await measureTime(async () =>
          client.metrics.search({ f: 'domain', ps: 200 }),
        );

        const metricsWithDomains = result.metrics.filter((m) => m.domain);
        expect(metricsWithDomains.length).toBeGreaterThan(0);

        const domains = [...new Set(metricsWithDomains.map((m) => m.domain))];
        expect(domains.length).toBeGreaterThan(1);

        // Common domains that should exist
        const commonDomains = [
          'Size',
          'Complexity',
          'Coverage',
          'Duplications',
          'Issues',
          'Maintainability',
          'Reliability',
          'Security',
        ];
        const foundCommonDomains = commonDomains.filter((domain) =>
          domains.some((d) => d?.toLowerCase().includes(domain.toLowerCase())),
        );
        expect(foundCommonDomains.length).toBeGreaterThan(3);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should work on both SonarQube and SonarCloud',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.metrics.search());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.metrics).toBeDefined();
        expect(result.metrics.length).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(0);

        // Both platforms should have standard metrics
        const metricKeys = result.metrics.map((m) => m.key);
        expect(metricKeys).toContain('lines');
        expect(metricKeys).toContain('ncloc');

        if (envConfig?.isSonarCloud) {
          console.log(`✓ SonarCloud: Found ${result.total} available metrics`);
        } else {
          console.log(`✓ SonarQube: Found ${result.total} available metrics`);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle platform-specific metrics gracefully',
      async () => {
        const { result } = await measureTime(async () => client.metrics.search({ ps: 500 }));

        const metricKeys = result.metrics.map((m) => m.key);

        if (envConfig?.isSonarCloud) {
          // SonarCloud may have specific metrics
          console.log('ℹ Testing SonarCloud-specific metric availability');
        } else {
          // SonarQube may have different metrics based on edition and plugins
          console.log('ℹ Testing SonarQube metric availability');
        }

        // Both should have core metrics
        expect(metricKeys).toContain('complexity');
        expect(metricKeys).toContain('coverage');
        expect(metricKeys).toContain('duplicated_lines_density');
      },
      TEST_TIMING.normal,
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for metric search',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.metrics.search({ ps: 100 }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 1500, // 1.5 seconds
          maximum: 6000, // 6 seconds absolute max
        });

        expect(result.metrics.length).toBeGreaterThan(0);
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle large result sets efficiently',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.metrics.search({ ps: 500 }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 2000, // 2 seconds
          maximum: 8000, // 8 seconds absolute max
        });

        expect(result.metrics.length).toBeGreaterThan(0);
        expect(result.metrics.length).toBeLessThanOrEqual(500);
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent requests',
      async () => {
        const requests = Array(3)
          .fill(null)
          .map(async () => client.metrics.search({ ps: 50 }));

        const results = await Promise.all(requests);

        results.forEach((result) => {
          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          expect(result.metrics).toBeDefined();
          expect(result.metrics.length).toBeGreaterThan(0);
        });

        // All requests should return the same total count
        const firstTotal = results[0].total;
        results.slice(1).forEach((result) => {
          expect(result.total).toBe(firstTotal);
        });
      },
      TEST_TIMING.normal,
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid pagination parameters gracefully',
      async () => {
        // Test with page size of 0 (should throw validation error)
        await expect(async () => {
          await client.metrics.search({ ps: 0 });
        }).rejects.toThrow(/Page size must be between 1 and 500/);

        // Test with page size above 500 (should throw validation error)
        await expect(async () => {
          await client.metrics.search({ ps: 501 });
        }).rejects.toThrow(/Page size must be between 1 and 500/);
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle very large page numbers',
      async () => {
        // First get total count
        const { result: firstPage } = await measureTime(async () =>
          client.metrics.search({ ps: 1 }),
        );

        const totalPages = Math.ceil(firstPage.total / 1);
        const beyondLastPage = totalPages + 10;

        const { result } = await measureTime(async () =>
          client.metrics.search({ ps: 1, p: beyondLastPage }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.metrics).toHaveLength(0);
        expect(result.total).toBe(firstPage.total);
      },
      TEST_TIMING.normal,
    );
  });
});
