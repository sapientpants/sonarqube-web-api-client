/**
 * System API Integration Tests
 *
 * Tests basic system information and health endpoints.
 * These tests should work on both SonarQube and SonarCloud.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { withRetry, measureTime, TestTiming } from '../../utils/testHelpers';
import { IntegrationAssertions } from '../../utils/assertions';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

describe.skipIf(skipTests)('System API Integration Tests', () => {
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
  }, TestTiming.NORMAL);

  afterAll(async () => {
    if (dataManager) {
      await dataManager.cleanup();
    }
  }, TestTiming.NORMAL);

  describe('System Ping', () => {
    test(
      'should respond to ping',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.system.ping());

        expect(result).toBe('pong');
        IntegrationAssertions.expectReasonableResponseTime(durationMs, 2000);
      },
      TestTiming.FAST
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
      TestTiming.FAST
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

        IntegrationAssertions.expectReasonableResponseTime(durationMs, 3000);
      },
      TestTiming.FAST
    );

    test(
      'should get v2 system status',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.system.getStatusV2());

        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('version');
        expect(['UP', 'DOWN', 'STARTING', 'DB_MIGRATION_NEEDED', 'DB_MIGRATION_RUNNING']).toContain(
          result.status
        );

        IntegrationAssertions.expectReasonableResponseTime(durationMs, 3000);
      },
      TestTiming.FAST
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

        IntegrationAssertions.expectReasonableResponseTime(durationMs, 2000);
      },
      TestTiming.FAST
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

          IntegrationAssertions.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: any) {
          // Expect authorization error if user doesn't have admin permissions
          if (error.status === 403) {
            IntegrationAssertions.expectAuthorizationError(error);
            console.log('ℹ Skipping system health test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should get v2 system health (admin only)',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.system.getHealthV2());

          expect(result).toHaveProperty('status');
          expect(['GREEN', 'YELLOW', 'RED']).toContain(result.status);

          IntegrationAssertions.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: any) {
          if (error.status === 403) {
            IntegrationAssertions.expectAuthorizationError(error);
            console.log('ℹ Skipping v2 system health test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
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

          IntegrationAssertions.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: any) {
          if (error.status === 403) {
            IntegrationAssertions.expectAuthorizationError(error);
            console.log('ℹ Skipping system info test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should get v2 system information',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.system.getInfoV2());

          expect(result).toHaveProperty('version');
          expect(result).toHaveProperty('edition');

          IntegrationAssertions.expectReasonableResponseTime(durationMs, 5000);
        } catch (error: any) {
          if (error.status === 403) {
            IntegrationAssertions.expectAuthorizationError(error);
            console.log('ℹ Skipping v2 system info test - requires admin permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle network timeouts gracefully',
      async () => {
        // Test retry logic with a potentially flaky operation
        const result = await withRetry(async () => client.system.ping(), {
          maxAttempts: 2,
          delayMs: 500,
        });

        expect(result).toBe('pong');
      },
      TestTiming.NORMAL
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

    test('should report instance capabilities', async () => {
      const supportsProjects = await client.supportsFeature('projects');
      const supportsIssues = await client.supportsFeature('issues');
      const supportsOrganizations = await client.supportsFeature('organizations');
      const supportsEditions = await client.supportsFeature('editions');

      expect(supportsProjects).toBe(true);
      expect(supportsIssues).toBe(true);
      expect(supportsOrganizations).toBe(envConfig.isSonarCloud);
      expect(supportsEditions).toBe(!envConfig.isSonarCloud);
    });
  });
});
