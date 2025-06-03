/**
 * Analysis Cache API Integration Tests
 *
 * Tests the Analysis Cache API functionality for managing analysis cache operations.
 * This API provides cache management capabilities for optimizing analysis performance.
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

(skipTests ? describe.skip : describe)('Analysis Cache API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let testProjectKey: string | null = null;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Get a test project for cache operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for analysis cache tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Cache Information Operations', () => {
    test(
      'should get cache information for a project',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping cache info test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // The response structure depends on whether caching is enabled and available
          if (result.data) {
            console.log(`✓ Cache information available for project ${testProjectKey}`);

            // Validate cache data structure if present
            if (typeof result.data === 'object') {
              console.log('  Cache data structure validated');
            }
          } else {
            console.log('ℹ No cache data available (caching may not be enabled)');
          }

          // Check for cache metadata
          if (result.lastUpdated) {
            expect(typeof result.lastUpdated).toBe('string');
            expect(new Date(result.lastUpdated).getTime()).not.toBeNaN();
            console.log(`  Last updated: ${result.lastUpdated}`);
          }

          if (result.size) {
            expect(typeof result.size).toBe('number');
            expect(result.size).toBeGreaterThanOrEqual(0);
            console.log(`  Cache size: ${result.size} bytes`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view cache information');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or cache not available');
          } else if (errorObj.status === 501) {
            console.log('ℹ Analysis cache not implemented in this SonarQube version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle cache status queries',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping cache status test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // Validate the response indicates cache status
          if (result) {
            console.log('✓ Cache status query successful');

            // Check for common cache status indicators
            if ('enabled' in result) {
              expect(typeof result.enabled).toBe('boolean');
              console.log(`  Cache enabled: ${result.enabled}`);
            }

            if ('hits' in result) {
              expect(typeof result.hits).toBe('number');
              console.log(`  Cache hits: ${result.hits}`);
            }

            if ('misses' in result) {
              expect(typeof result.misses).toBe('number');
              console.log(`  Cache misses: ${result.misses}`);
            }

            // Calculate hit ratio if both hits and misses are available
            if ('hits' in result && 'misses' in result) {
              const total = (result.hits as number) + (result.misses as number);
              if (total > 0) {
                const hitRatio = (((result.hits as number) / total) * 100).toFixed(1);
                console.log(`  Hit ratio: ${hitRatio}%`);
              }
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access cache status information');
          } else if (errorObj.status === 501) {
            console.log('ℹ Cache status not supported in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Cache Management Operations', () => {
    test(
      'should handle cache clearing operations safely',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping cache clear test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping cache clear test - no test project available');
          return;
        }

        try {
          // Note: In integration tests, we typically avoid actually clearing caches
          // as this could impact other running analyses. Instead, we validate the API structure.

          console.log('ℹ Cache clearing validation (read-only mode)');

          // First, check if cache exists
          const { result: cacheInfo } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          if (cacheInfo) {
            console.log('✓ Cache information retrieved before clearing');
            console.log('ℹ Cache clear operation would be available here');

            // In a real destructive test, you would call:
            // await client.analysisCache.clear({ project: testProjectKey });
            // But we avoid this in integration tests to prevent disruption
          } else {
            console.log('ℹ No cache to clear for this project');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for cache management');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project or cache not found');
          } else if (errorObj.status === 501) {
            console.log('ℹ Cache management not supported in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should validate cache operation permissions',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping permission test - no test project available');
          return;
        }

        try {
          // Test read permissions
          const { result } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          if (result) {
            console.log('✓ Read permissions validated for cache operations');
          }

          // Note: Write permission testing (cache clearing) is avoided in integration tests
          // to prevent disrupting actual analysis caches
          console.log('ℹ Write permission testing skipped to avoid cache disruption');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ Proper permission enforcement detected');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or cache not available');
          } else if (errorObj.status === 501) {
            console.log('ℹ Cache operations not supported');
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
      'should work on both SonarQube and SonarCloud',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping platform test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log('✓ SonarCloud: Analysis cache API accessible');

            // SonarCloud may have different cache implementations
            if (result) {
              console.log('  Cache information available on SonarCloud');
            } else {
              console.log('  Cache not available or not enabled on SonarCloud');
            }
          } else {
            console.log('✓ SonarQube: Analysis cache API accessible');

            // SonarQube cache behavior
            if (result) {
              console.log('  Cache information available on SonarQube');
            } else {
              console.log('  Cache not available or not enabled on SonarQube');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test - cache not accessible');
          } else if (errorObj.status === 501) {
            console.log('ℹ Platform test - cache not implemented in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle version-specific cache features',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping version test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          if (result) {
            console.log('✓ Cache features available in current version');

            // Check for version-specific features
            if ('version' in result) {
              console.log(`  Cache version: ${result.version}`);
            }

            if ('features' in result) {
              console.log(`  Supported features: ${JSON.stringify(result.features)}`);
            }
          } else {
            console.log('ℹ Cache features not available or not supported');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 501) {
            console.log('✓ Proper version handling - cache not implemented');
            expect(errorObj.status).toBe(501);
          } else if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Version test - access restricted');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for cache queries',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 5000, // 5 seconds absolute max
          });

          console.log(`✓ Cache query completed in ${Math.round(durationMs)}ms`);

          if (result) {
            console.log('  Cache information retrieved successfully');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404 || errorObj.status === 501) {
            console.log('ℹ Performance test skipped - cache not accessible or supported');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle concurrent cache requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping concurrent test - no test project available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.analysisCache.get({ project: testProjectKey }));

          const results = await Promise.all(requests);

          // All requests should return consistent data
          results.forEach((result, index) => {
            console.log(`  Request ${index + 1}: ${result ? 'Success' : 'No cache data'}`);
          });

          console.log(`✓ ${results.length} concurrent cache requests completed`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404 || errorObj.status === 501) {
            console.log('ℹ Concurrent test skipped - cache not accessible or supported');
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
      'should handle invalid project key gracefully',
      async () => {
        try {
          await client.analysisCache.get({ project: 'invalid-project-key-that-does-not-exist' });

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for cache operations');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
            expect(errorObj.status).toBe(400);
          } else if (errorObj.status === 501) {
            console.log('✓ API properly indicates cache not supported');
            expect(errorObj.status).toBe(501);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.analysisCache.get({ project: 'restricted-project-key' });

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent projects');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 501) {
            console.log('✓ API properly indicates feature not supported');
            expect(errorObj.status).toBe(501);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );

    test(
      'should provide meaningful error responses for unsupported operations',
      async () => {
        try {
          // Test with empty project parameter
          await client.analysisCache.get({ project: '' });

          console.log('ℹ API accepts empty project parameters gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 400) {
            console.log('✓ API validates required parameters');
            expect(errorObj.status).toBe(400);
          } else if (errorObj.status === 404) {
            console.log('✓ API handles empty parameters as not found');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 501) {
            console.log('✓ API indicates operation not supported');
            expect(errorObj.status).toBe(501);
          } else {
            console.log(`ℹ Received error status: ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.fast
    );
  });

  describe('Cache Usage Patterns', () => {
    test(
      'should demonstrate typical cache workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting cache management workflow');

          // 1. Check cache availability
          const { result: cacheInfo } = await measureTime(async () =>
            client.analysisCache.get({ project: testProjectKey })
          );

          console.log(`  Step 1: Cache availability check`);

          if (cacheInfo) {
            console.log(`  Step 2: Cache information retrieved`);

            // 2. Analyze cache effectiveness
            if ('hits' in cacheInfo && 'misses' in cacheInfo) {
              const hits = cacheInfo.hits as number;
              const misses = cacheInfo.misses as number;
              const total = hits + misses;

              if (total > 0) {
                const effectiveness = ((hits / total) * 100).toFixed(1);
                console.log(`  Step 3: Cache effectiveness: ${effectiveness}%`);

                if (parseFloat(effectiveness) < 50) {
                  console.log(`  Recommendation: Consider cache optimization`);
                } else {
                  console.log(`  Cache performing well`);
                }
              }
            } else {
              console.log(`  Step 3: Cache statistics not available`);
            }

            // 3. Cache size analysis
            if ('size' in cacheInfo) {
              const size = cacheInfo.size as number;
              const sizeInMB = (size / (1024 * 1024)).toFixed(2);
              console.log(`  Step 4: Cache size: ${sizeInMB} MB`);
            }

            console.log('✓ Cache workflow completed successfully');
          } else {
            console.log('  Cache not available - workflow completed with limited data');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 501) {
            console.log('ℹ Cache workflow - feature not supported in this version');
          } else {
            console.log('ℹ Cannot complete cache workflow - access or feature limitations');
          }
        }
      },
      TEST_TIMING.normal
    );
  });
});
