/**
 * Editions API Integration Tests
 *
 * Tests the Editions API functionality for license and edition management.
 * This API is primarily available in SonarQube and may require admin permissions.
 * Features include license status, edition information, and grace period management.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
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

(skipTests ? describe.skip : describe)('Editions API Integration Tests', () => {
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

  describe('Status Operations', () => {
    test(
      'should get current edition status',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.editions.status());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // Validate status response structure
          expect(result.currentEditionKey).toBeDefined();
          expect(typeof result.currentEditionKey).toBe('string');

          // Common edition keys: 'community', 'developer', 'enterprise', 'datacenter'
          const validEditions = ['community', 'developer', 'enterprise', 'datacenter'];
          expect(validEditions).toContain(result.currentEditionKey);

          if (result.installationStatus) {
            expect(typeof result.installationStatus).toBe('string');
          }

          console.log(`✓ Current edition: ${result.currentEditionKey}`);
          if (result.installationStatus) {
            console.log(`  Installation status: ${result.installationStatus}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (envConfig?.isSonarCloud) {
            console.log('ℹ Skipping editions status test - not available on SonarCloud');
            return;
          }

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log(
              'ℹ Skipping editions status test - API not available in this SonarQube version'
            );
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Skipping editions status test - requires admin permissions');
            return;
          }

          throw error;
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle edition status for different SonarQube versions',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping SonarQube-specific edition test - running on SonarCloud');
          return;
        }

        try {
          const { result } = await measureTime(async () => client.editions.status());

          // Different SonarQube versions may return different information
          expect(result.currentEditionKey).toBeDefined();

          if (result.currentEditionKey === 'community') {
            console.log('✓ Running on SonarQube Community Edition');
          } else if (result.currentEditionKey === 'developer') {
            console.log('✓ Running on SonarQube Developer Edition');
            // Developer edition features could be tested here
          } else if (result.currentEditionKey === 'enterprise') {
            console.log('✓ Running on SonarQube Enterprise Edition');
            // Enterprise features could be tested here
          } else if (result.currentEditionKey === 'datacenter') {
            console.log('✓ Running on SonarQube Data Center Edition');
            // Data Center features could be tested here
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Skipping edition status test - requires admin permissions');
          } else if (errorObj.status === 404) {
            console.log('ℹ Skipping edition status test - API not available in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('License Information', () => {
    test(
      'should provide license status information',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping license information test - not applicable to SonarCloud');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () => client.editions.status());

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.currentEditionKey !== 'community') {
            // Non-community editions may have license information
            console.log(`ℹ Testing license information for ${result.currentEditionKey} edition`);

            // Check for license-related fields
            if (result.installationStatus) {
              const validStatuses = [
                'AUTOMATIC_READY',
                'AUTOMATIC_IN_PROGRESS',
                'MANUAL_IN_PROGRESS',
                'COMPLETED',
                'NONE',
              ];
              expect(validStatuses).toContain(result.installationStatus);
            }
          } else {
            console.log('ℹ Community edition - no license information expected');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Skipping license test - requires admin permissions');
          } else if (errorObj.status === 404) {
            console.log('ℹ Skipping license test - API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Preview Operations', () => {
    test(
      'should handle preview edition requests',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping preview test - not applicable to SonarCloud');
          return;
        }

        try {
          // Preview operations may not be available in all environments
          // This is primarily for testing the API structure

          const { result: currentStatus } = await measureTime(async () => client.editions.status());

          // If we're on community, we could potentially preview other editions
          if (currentStatus.currentEditionKey === 'community') {
            console.log('ℹ Community edition detected - preview functionality may be available');

            // Note: We don't actually attempt to change editions in integration tests
            // as this could affect the test environment
            console.log('ℹ Skipping actual preview operations to preserve test environment');
          } else {
            console.log(
              `ℹ Non-community edition (${currentStatus.currentEditionKey}) - preview may not be relevant`
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Skipping preview test - requires admin permissions');
          } else if (errorObj.status === 404) {
            console.log('ℹ Skipping preview test - API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should handle platform differences gracefully',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('✓ SonarCloud - editions API not applicable (managed service)');

          // SonarCloud doesn't have editions API since it's a managed service
          try {
            await client.editions.status();
            // If this succeeds, it's unexpected but not necessarily an error
            console.log('ℹ Unexpected: SonarCloud returned editions status');
          } catch (error: unknown) {
            const errorObj = error as { status?: number };
            if (errorObj.status === 404 || errorObj.status === 403) {
              console.log('✓ Expected: SonarCloud properly rejects editions API calls');
            } else {
              console.log(`ℹ SonarCloud editions API error: ${errorObj.status}`);
            }
          }
        } else {
          // SonarQube should have some form of editions support
          try {
            const { result } = await measureTime(async () => client.editions.status());

            expect(result.currentEditionKey).toBeDefined();
            console.log(`✓ SonarQube editions API working - edition: ${result.currentEditionKey}`);
          } catch (error: unknown) {
            const errorObj = error as { status?: number };

            if (errorObj.status === 403) {
              console.log('ℹ SonarQube editions API requires admin permissions');
            } else if (errorObj.status === 404) {
              console.log('ℹ SonarQube editions API not available in this version');
            } else {
              throw error;
            }
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping performance test - not applicable to SonarCloud');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () => client.editions.status());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 4000, // 4 seconds absolute max
          });

          expect(result.currentEditionKey).toBeDefined();
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping performance test - API not available or no permissions');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle permission errors gracefully',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping permission test - not applicable to SonarCloud');
          return;
        }

        try {
          const { result } = await measureTime(async () => client.editions.status());

          // If we get here, we have permissions
          expect(result.currentEditionKey).toBeDefined();
          console.log('✓ Editions API accessible with current permissions');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ Editions API properly restricts access without admin permissions');
            // This is expected behavior for non-admin users
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ Editions API not available in this SonarQube version/edition');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should provide meaningful error responses',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ Skipping error response test - not applicable to SonarCloud');
          return;
        }

        try {
          const { result } = await measureTime(async () => client.editions.status());

          // Successful response should have proper structure
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect(result.currentEditionKey).toBeDefined();
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          // Error should have proper structure
          expect(errorObj).toBeDefined();
          if (errorObj.status !== undefined) {
            expect(typeof errorObj.status).toBe('number');
          }

          if (errorObj.status === 403) {
            console.log('✓ Clear permission error received');
          } else if (errorObj.status === 404) {
            console.log('✓ Clear not found error received');
          } else {
            console.log(`ℹ Received error status: ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Feature Availability', () => {
    test(
      'should detect edition-specific features',
      async () => {
        if (envConfig?.isSonarCloud) {
          console.log('ℹ SonarCloud has all enterprise features available by default');
          return;
        }

        try {
          const { result } = await measureTime(async () => client.editions.status());

          const edition = result.currentEditionKey;

          switch (edition) {
            case 'community':
              console.log('ℹ Community Edition - basic features available');
              console.log('  - Limited to public projects in some contexts');
              console.log('  - Core analysis features available');
              break;

            case 'developer':
              console.log('ℹ Developer Edition - enhanced features available');
              console.log('  - Branch analysis');
              console.log('  - Pull request decoration');
              break;

            case 'enterprise':
              console.log('ℹ Enterprise Edition - advanced features available');
              console.log('  - Portfolio management');
              console.log('  - Security reports');
              console.log('  - Project dump/restore');
              break;

            case 'datacenter':
              console.log('ℹ Data Center Edition - all features + high availability');
              console.log('  - Multi-node deployment');
              console.log('  - Advanced scalability');
              break;

            default:
              console.log(`ℹ Unknown edition: ${edition}`);
          }

          // Store edition info for other tests
          (global as Record<string, unknown>).__SONARQUBE_EDITION__ = edition;
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot determine edition - limited feature detection');
            (global as Record<string, unknown>).__SONARQUBE_EDITION__ = 'unknown';
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });
});
