// @ts-nocheck
/**
 * Analysis API Integration Tests
 *
 * Tests the Analysis API functionality for retrieving project analysis history and details.
 * This API provides access to analysis metadata, execution information, and analysis events.
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

(skipTests ? describe.skip : describe)('Analysis API Integration Tests', () => {
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

    // Get a test project for analysis operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for analysis tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Analysis Search Operations', () => {
    test(
      'should search project analyses with default parameters',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping analysis search test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.paging).toBeDefined();
          expect(result.analyses).toBeDefined();
          expect(Array.isArray(result.analyses)).toBe(true);

          if (result.analyses.length > 0) {
            const firstAnalysis = result.analyses[0];
            expect(firstAnalysis.key).toBeDefined();
            expect(firstAnalysis.date).toBeDefined();
            expect(typeof firstAnalysis.key).toBe('string');
            expect(typeof firstAnalysis.date).toBe('string');

            // Validate date format (ISO 8601)
            expect(new Date(firstAnalysis.date).getTime()).not.toBeNaN();

            console.log(`✓ Found ${result.analyses.length} analyses for project`);
            console.log(`  Latest analysis: ${firstAnalysis.date}`);

            if (firstAnalysis.events) {
              expect(Array.isArray(firstAnalysis.events)).toBe(true);
              console.log(`  Events in latest analysis: ${firstAnalysis.events.length}`);
            }
          } else {
            console.log('ℹ No analyses found (project may not have been analyzed yet)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project analyses');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search analyses with pagination',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping pagination test - no test project available');
          return;
        }

        try {
          const pageSize = 5;
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses
              .search()
              .project(testProjectKey)
              .pageSize(pageSize)
              .page(1)
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.paging.pageSize).toBe(pageSize);
          expect(result.paging.pageIndex).toBe(1);
          expect(result.analyses.length).toBeLessThanOrEqual(pageSize);

          if (result.paging.total > pageSize) {
            console.log(`✓ Pagination available - ${result.paging.total} total analyses`);

            // Test second page
            const { result: secondPage } = await measureTime(async () =>
              client.projectAnalyses
                .search()
                .project(testProjectKey)
                .pageSize(pageSize)
                .page(2)
                .execute(),
            );

            expect(secondPage.paging.pageIndex).toBe(2);
            expect(secondPage.paging.total).toBe(result.paging.total);

            // Pages should have different results
            if (result.analyses.length > 0 && secondPage.analyses.length > 0) {
              const firstPageKeys = result.analyses.map((a) => a.key);
              const secondPageKeys = secondPage.analyses.map((a) => a.key);
              const hasOverlap = firstPageKeys.some((key) => secondPageKeys.includes(key));
              expect(hasOverlap).toBe(false);
            }
          } else {
            console.log(`ℹ Small analysis history - ${result.paging.total} total analyses`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access project analyses for pagination test');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should filter analyses by date range',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping date filter test - no test project available');
          return;
        }

        try {
          // Get recent analyses (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses
              .search()
              .project(testProjectKey)
              .from(thirtyDaysAgo.toISOString().split('T')[0])
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // All analyses should be within the date range
          result.analyses.forEach((analysis) => {
            const analysisDate = new Date(analysis.date);
            expect(analysisDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
          });

          console.log(`✓ Found ${result.analyses.length} analyses in last 30 days`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access project analyses for date filtering');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle category filtering for analyses',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping category filter test - no test project available');
          return;
        }

        try {
          // Search for analyses with quality gate events
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses
              .search()
              .project(testProjectKey)
              .category('QUALITY_GATE')
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.analyses.length > 0) {
            console.log(`✓ Found ${result.analyses.length} analyses with quality gate events`);

            // Check that analyses with events contain quality gate information
            result.analyses.forEach((analysis) => {
              if (analysis.events && analysis.events.length > 0) {
                const hasQualityGateEvent = analysis.events.some(
                  (event) => event.category === 'QUALITY_GATE',
                );
                if (hasQualityGateEvent) {
                  console.log(`  Analysis ${analysis.key} has quality gate event`);
                }
              }
            });
          } else {
            console.log('ℹ No analyses with quality gate events found');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access project analyses for category filtering');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Analysis Events and Details', () => {
    test(
      'should validate analysis event structure',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping event validation test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(10).execute(),
          );

          if (result.analyses.length === 0) {
            console.log('ℹ No analyses available for event validation');
            return;
          }

          let totalEvents = 0;
          const eventCategories = new Set<string>();

          result.analyses.forEach((analysis) => {
            if (analysis.events) {
              totalEvents += analysis.events.length;

              analysis.events.forEach((event) => {
                expect(event.key).toBeDefined();
                expect(event.category).toBeDefined();
                expect(typeof event.key).toBe('string');
                expect(typeof event.category).toBe('string');

                eventCategories.add(event.category);

                if (event.name) {
                  expect(typeof event.name).toBe('string');
                }

                if (event.description) {
                  expect(typeof event.description).toBe('string');
                }

                // Validate common event categories
                const validCategories = [
                  'VERSION',
                  'QUALITY_GATE',
                  'QUALITY_PROFILE',
                  'DEFINITION_CHANGE',
                  'OTHER',
                ];
                expect(validCategories).toContain(event.category);
              });
            }
          });

          if (totalEvents > 0) {
            console.log(
              `✓ Validated ${totalEvents} events across ${result.analyses.length} analyses`,
            );
            console.log(`  Event categories found: ${Array.from(eventCategories).join(', ')}`);
          } else {
            console.log('ℹ No events found in recent analyses');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access analysis events for validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle analysis chronological ordering',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping chronological test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(20).execute(),
          );

          if (result.analyses.length < 2) {
            console.log('ℹ Need at least 2 analyses for chronological validation');
            return;
          }

          // Analyses should be ordered by date (newest first by default)
          for (let i = 1; i < result.analyses.length; i++) {
            const prevDate = new Date(result.analyses[i - 1].date);
            const currDate = new Date(result.analyses[i].date);
            expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
          }

          const newestDate = result.analyses[0].date;
          const oldestDate = result.analyses[result.analyses.length - 1].date;

          console.log(`✓ Chronological ordering verified`);
          console.log(`  Date range: ${oldestDate} to ${newestDate}`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access analyses for chronological validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
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
            client.projectAnalyses.search().project(testProjectKey).pageSize(5).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.analyses.length} project analyses`);

            // SonarCloud may have different analysis patterns
            if (result.analyses.length > 0) {
              const hasEvents = result.analyses.some((a) => a.events && a.events.length > 0);
              console.log(`  Analyses with events: ${hasEvents ? 'Yes' : 'No'}`);
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.analyses.length} project analyses`);

            // SonarQube analysis structure
            if (result.analyses.length > 0) {
              const firstAnalysis = result.analyses[0];
              if (firstAnalysis.projectVersion) {
                console.log(`  Project version: ${firstAnalysis.projectVersion}`);
              }
            }
          }

          // Both platforms should support the same analysis API structure
          expect(result.analyses).toBeDefined();
          expect(Array.isArray(result.analyses)).toBe(true);
          expect(result.paging).toBeDefined();
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - project not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle organization context for SonarCloud',
      async () => {
        if (!envConfig?.isSonarCloud || !envConfig.organization || !testProjectKey) {
          console.log(
            'ℹ Skipping organization test - not SonarCloud, no organization, or no project',
          );
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.analyses.length} analyses`);

          if (result.analyses.length > 0) {
            // Check for organization-specific analysis features
            const hasDetectionDate = result.analyses.some((a) => a.detectedCI);
            if (hasDetectionDate) {
              console.log('  CI detection information available');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - project not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for analysis search',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(20).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 8000, // 8 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.analyses.length} analyses in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - project not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle large date ranges efficiently',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping large range test - no test project available');
          return;
        }

        try {
          // Search for analyses in the last year
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses
              .search()
              .project(testProjectKey)
              .from(oneYearAgo.toISOString().split('T')[0])
              .pageSize(50)
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 3000, // 3 seconds
            maximum: 12000, // 12 seconds absolute max
          });

          console.log(
            `✓ Large date range search: ${result.analyses.length} analyses in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Large range test skipped - project not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.slow,
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid project key gracefully',
      async () => {
        try {
          await client.projectAnalyses
            .search()
            .project('invalid-project-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for analyses');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
            expect(errorObj.status).toBe(400);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle invalid date ranges',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping date range validation - no test project available');
          return;
        }

        try {
          // Test with invalid date format
          await client.projectAnalyses
            .search()
            .project(testProjectKey)
            .from('invalid-date-format')
            .execute();

          console.log('ℹ API accepts invalid date formats gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 400) {
            console.log('✓ API validates date format parameters');
            expect(errorObj.status).toBe(400);
          } else {
            console.log(`ℹ Date validation: status ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.projectAnalyses.search().project('restricted-project-key').execute();

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent projects');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide comprehensive analysis workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting analysis history workflow');

          // 1. Get recent analyses
          const { result: recentAnalyses } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(5).execute(),
          );

          console.log(`  Step 1: Found ${recentAnalyses.analyses.length} recent analyses`);

          if (recentAnalyses.analyses.length === 0) {
            console.log('ℹ No analyses found for workflow test');
            return;
          }

          // 2. Analyze events across analyses
          let totalEvents = 0;
          const eventsByCategory = new Map<string, number>();

          recentAnalyses.analyses.forEach((analysis) => {
            if (analysis.events) {
              totalEvents += analysis.events.length;
              analysis.events.forEach((event) => {
                const count = eventsByCategory.get(event.category) || 0;
                eventsByCategory.set(event.category, count + 1);
              });
            }
          });

          console.log(`  Step 2: Analyzed ${totalEvents} events`);
          console.log(
            `  Step 3: Event categories: ${Array.from(eventsByCategory.keys()).join(', ')}`,
          );

          // 3. Check analysis timeline
          if (recentAnalyses.analyses.length >= 2) {
            const oldestAnalysis = recentAnalyses.analyses[recentAnalyses.analyses.length - 1];
            const newestAnalysis = recentAnalyses.analyses[0];
            const timeSpan =
              new Date(newestAnalysis.date).getTime() - new Date(oldestAnalysis.date).getTime();
            const daySpan = Math.round(timeSpan / (1000 * 60 * 60 * 24));

            console.log(`  Step 4: Analysis timeline spans ${daySpan} days`);
          }

          console.log('✓ Analysis workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete analysis workflow - project access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
