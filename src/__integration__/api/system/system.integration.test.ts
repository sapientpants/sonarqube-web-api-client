/**
 * System API Integration Tests
 *
 * Tests basic system information and health endpoints.
 * These tests should work on both SonarQube and SonarCloud.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { withRetry, measureTime, TEST_TIMING } from '../../utils/testHelpers';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

(skipTests ? describe.skip : describe)('System API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let envConfig: ReturnType<typeof getIntegrationTestConfig>;
  let testConfig: ReturnType<typeof getTestConfiguration>;

  beforeAll(async () => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    // Validate connection before running tests
    await client.validateConnection();
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('System Ping', () => {
    test(
      'should respond to ping',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.system.ping());

        expect(result).toBe('pong');
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 2000);
      },
      TEST_TIMING.fast
    );

    test(
      'should handle multiple concurrent pings',
      async () => {
        const pingPromises = Array(5)
          .fill(null)
          .map(async () => client.system.ping());
        const results = await Promise.all(pingPromises);

        results.forEach((result) => {
          expect(result).toBe('pong');
        });
      },
      TEST_TIMING.fast
    );
  });

  describe('System Status', () => {
    test(
      'should get system status',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.system.status());

        expect(result).toHaveProperty('status');
        expect(['UP', 'DOWN', 'STARTING', 'DB_MIGRATION_NEEDED', 'DB_MIGRATION_RUNNING']).toContain(
          result.status
        );

        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 3000);
      },
      TEST_TIMING.fast
    );

    test(
      'should get v2 system liveness',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.system.getLivenessV2()
          );

          expect(result).toHaveProperty('status');
          expect(typeof result.status).toBe('string');
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 3000);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log('ℹ Skipping v2 system liveness test - API not available in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );
  });

  describe('Server Version', () => {
    test(
      'should get server version',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.server.version());

        expect(typeof result).toBe('string');
        expect(result).toBeTruthy();
        expect(result).toMatch(/^\d+\.\d+/); // Should start with version number pattern

        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 2000);
      },
      TEST_TIMING.fast
    );
  });

  describe('System Health', () => {
    test(
      'should get system health (admin only)',
      async () => {
        // This test requires admin permissions, so we handle permission errors gracefully
        try {
          const { result, durationMs } = await measureTime(async () => client.system.health());

          expect(result).toHaveProperty('health');
          expect(['GREEN', 'YELLOW', 'RED']).toContain(result.health);

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: unknown) {
          // Expect authorization error if user doesn't have admin permissions
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            INTEGRATION_ASSERTIONS.expectAuthorizationError(errorObj);
            console.log('ℹ Skipping system health test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get v2 system health (admin only)',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.system.getHealthV2());

          expect(result).toHaveProperty('status');
          expect(['GREEN', 'YELLOW', 'RED']).toContain(result.status);

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            INTEGRATION_ASSERTIONS.expectAuthorizationError(errorObj);
            console.log('ℹ Skipping v2 system health test - requires admin permissions');
          } else if (errorObj.status === 404) {
            console.log(
              'ℹ Skipping v2 system health test - API not available in this SonarQube version'
            );
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('System Info', () => {
    test(
      'should get system information (admin only)',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.system.info());

          expect(result).toHaveProperty('System');
          expect(result.System).toHaveProperty('Version');

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            INTEGRATION_ASSERTIONS.expectAuthorizationError(errorObj);
            console.log('ℹ Skipping system info test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get v2 system migrations status',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.system.getMigrationsStatusV2()
          );

          expect(result).toHaveProperty('status');
          expect(typeof result.status).toBe('string');
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, 3000);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log(
              'ℹ Skipping v2 system migrations status test - API not available in this version'
            );
          } else if (errorObj.status === 403) {
            console.log(
              'ℹ Skipping v2 system migrations status test - requires admin permissions'
            );
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle network timeouts gracefully',
      async () => {
        // Test retry logic with a potentially flaky operation
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const result = await withRetry(async () => client.system.ping(), {
          maxAttempts: 2,
          delayMs: 500,
        });

        expect(result).toBe('pong');
      },
      TEST_TIMING.normal
    );
  });

  describe('Platform Detection', () => {
    test('should detect platform correctly', () => {
      const instanceInfo = client.config;

      expect(['sonarqube', 'sonarcloud']).toContain(instanceInfo.platform);
      expect(typeof instanceInfo.isSonarCloud).toBe('boolean');

      if (instanceInfo.isSonarCloud) {
        expect(instanceInfo.organization).toBeTruthy();
      }
    });

    test('should report instance capabilities', () => {
      const supportsProjects = client.supportsFeature('projects');
      const supportsIssues = client.supportsFeature('issues');
      const supportsOrganizations = client.supportsFeature('organizations');
      const supportsEditions = client.supportsFeature('editions');

      expect(supportsProjects).toBe(true);
      expect(supportsIssues).toBe(true);
      expect(supportsOrganizations).toBe(envConfig.isSonarCloud);
      expect(supportsEditions).toBe(!envConfig.isSonarCloud);
    });
  });
});
