// @ts-nocheck
/**
 * Server API Integration Tests
 *
 * Tests the Server API functionality for retrieving server information and version details.
 * This is a read-only API that provides basic server information.
 */

import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, TEST_TIMING } from '../../utils/testHelpers';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Server API Integration Tests', () => {
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

  describe('Server Version Information', () => {
    test(
      'should get server version',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.server.version());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        // Version response should be a simple string
        const versionString = typeof result === 'string' ? result : String(result);
        expect(versionString.length).toBeGreaterThan(0);

        // Should follow semantic versioning pattern (major.minor.patch)
        const versionPattern = /^\d+\.\d+(\.\d+)?/;
        expect(versionString).toMatch(versionPattern);

        console.log(`✓ Server version: ${result}`);
      },
      TEST_TIMING.fast,
    );
  });

  describe('Platform Detection', () => {
    test(
      'should detect platform type correctly',
      async () => {
        const { result: version } = await measureTime(async () => client.server.version());

        if (envConfig?.isSonarCloud) {
          // SonarCloud version format may differ
          expect(typeof version).toBe('string');
          expect(version.length).toBeGreaterThan(0);
          console.log(`✓ SonarCloud version: ${version}`);
        } else {
          // SonarQube version should follow standard format
          const versionPattern = /^\d+\.\d+/;
          expect(version).toMatch(versionPattern);

          // Extract major version for compatibility checks
          const majorVersion = parseInt(version.split('.')[0], 10);
          expect(majorVersion).toBeGreaterThanOrEqual(8); // Minimum supported version

          console.log(`✓ SonarQube version: ${version} (major: ${majorVersion})`);
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should validate server accessibility',
      async () => {
        // The version endpoint is a good indicator of server health
        const { result, durationMs } = await measureTime(async () => client.server.version());

        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 500, // 0.5 seconds
          maximum: 3000, // 3 seconds absolute max for version endpoint
        });

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        // Server should be responsive
        expect(durationMs).toBeLessThan(3000);

        console.log(`✓ Server responded in ${durationMs}ms`);
      },
      TEST_TIMING.fast,
    );
  });

  describe('API Compatibility', () => {
    test(
      'should support expected API version',
      async () => {
        const { result: version } = await measureTime(async () => client.server.version());

        if (envConfig?.isSonarCloud) {
          // SonarCloud is always up-to-date
          expect(typeof version).toBe('string');
          console.log(`ℹ SonarCloud version: ${version}`);
        } else {
          // Check minimum SonarQube version compatibility
          const versionNumbers = version.split('.').map((num) => parseInt(num, 10));
          const majorVersion = versionNumbers[0];
          const minorVersion = versionNumbers[1] || 0;

          // Client supports SonarQube 8.0+
          if (majorVersion < 8) {
            console.warn(
              `⚠ SonarQube version ${version} may not support all API features. Recommended: 8.0+`,
            );
          } else if (majorVersion === 8 && minorVersion < 9) {
            console.log(`ℹ SonarQube ${version} - some newer features may not be available`);
          } else {
            console.log(`✓ SonarQube ${version} - full feature compatibility expected`);
          }

          expect(majorVersion).toBeGreaterThanOrEqual(7); // Absolute minimum
        }
      },
      TEST_TIMING.fast,
    );
  });

  describe('Performance', () => {
    test(
      'should have fast response time for version endpoint',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.server.version());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 300, // 300ms
          maximum: 2000, // 2 seconds absolute max
        });

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle concurrent version requests',
      async () => {
        const requests = Array(5)
          .fill(null)
          .map(async () => {
            const start = Date.now();
            const version = await client.server.version();
            const duration = Date.now() - start;
            return { version, duration };
          });

        const results = await Promise.all(requests);

        // All requests should succeed
        results.forEach((result) => {
          expect(typeof result.version).toBe('string');
          expect(result.version.length).toBeGreaterThan(0);
          expect(result.duration).toBeLessThan(3000);
        });

        // All requests should return the same version
        const firstVersion = results[0].version;
        results.slice(1).forEach((result) => {
          expect(result.version).toBe(firstVersion);
        });

        const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
        console.log(
          `✓ Average response time for ${results.length} concurrent requests: ${Math.round(avgDuration)}ms`,
        );
      },
      TEST_TIMING.normal,
    );

    test(
      'should maintain performance under repeated requests',
      async () => {
        const requestCount = 10;
        const durations: number[] = [];

        for (let i = 0; i < requestCount; i++) {
          const { result, durationMs } = await measureTime(async () => client.server.version());

          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          durations.push(durationMs);

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);

        expect(avgDuration).toBeLessThan(1000); // Average should be under 1 second
        expect(maxDuration).toBeLessThan(3000); // No single request should take over 3 seconds

        console.log(
          `✓ ${requestCount} sequential requests - avg: ${Math.round(avgDuration)}ms, max: ${Math.round(maxDuration)}ms`,
        );
      },
      TEST_TIMING.normal,
    );
  });

  describe('Network Reliability', () => {
    test(
      'should handle network variations gracefully',
      async () => {
        const attempts = 3;
        const results: string[] = [];

        for (let i = 0; i < attempts; i++) {
          try {
            const { result, durationMs } = await measureTime(async () => client.server.version());

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            results.push(result);

            // Log timing for analysis
            console.log(`  Attempt ${i + 1}: ${Math.round(durationMs)}ms`);
          } catch (error) {
            console.warn(`  Attempt ${i + 1} failed:`, error);
            throw error; // Re-throw to fail the test
          }

          // Brief delay between attempts
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // All attempts should return the same version
        expect(results.length).toBe(attempts);
        const firstVersion = results[0];
        results.slice(1).forEach((version) => {
          expect(version).toBe(firstVersion);
        });
      },
      TEST_TIMING.normal,
    );
  });

  describe('Error Scenarios', () => {
    test(
      'should provide meaningful response on success',
      async () => {
        const { result } = await measureTime(async () => client.server.version());

        // Validate the response format
        expect(typeof result).toBe('string');
        expect(result.trim()).toBe(result); // Should not have leading/trailing whitespace
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThan(100); // Reasonable upper bound

        // Should not contain unexpected characters
        expect(result).not.toContain('\n');
        expect(result).not.toContain('\r');
        expect(result).not.toContain('\t');
      },
      TEST_TIMING.fast,
    );
  });

  describe('Integration Validation', () => {
    test(
      'should confirm server is compatible with client',
      async () => {
        const { result: version } = await measureTime(async () => client.server.version());

        // This test validates that we can successfully communicate with the server
        // and retrieve version information, which is a prerequisite for all other tests

        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);

        // Store version info for other tests to use
        (global as Record<string, unknown>).__SONARQUBE_VERSION__ = version;
        (global as Record<string, unknown>).__SONARQUBE_IS_CLOUD__ = envConfig?.isSonarCloud;

        if (envConfig?.isSonarCloud) {
          console.log(`✓ Integration test setup complete - SonarCloud version: ${version}`);
        } else {
          const majorVersion = parseInt(version.split('.')[0], 10);
          console.log(
            `✓ Integration test setup complete - SonarQube ${version} (v${majorVersion})`,
          );

          if (majorVersion >= 9) {
            console.log('  ℹ Modern SonarQube version - all features should be available');
          } else if (majorVersion >= 8) {
            console.log('  ℹ Stable SonarQube version - most features should be available');
          } else {
            console.log('  ⚠ Older SonarQube version - some features may not be available');
          }
        }
      },
      TEST_TIMING.fast,
    );
  });
});
