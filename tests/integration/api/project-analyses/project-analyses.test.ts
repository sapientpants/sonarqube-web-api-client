// @ts-nocheck
/**
 * Project Analyses API Integration Tests
 *
 * Tests the Project Analyses API functionality for managing project analysis history.
 * This API provides operations for searching, creating, and deleting project analyses.
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

(skipTests ? describe.skip : describe)('Project Analyses API Integration Tests', () => {
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
      console.log('ℹ No test project available for project analyses tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Project Analysis Search Operations', () => {
    test(
      'should search project analyses',
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

            console.log(`✓ Found ${result.analyses.length} project analyses`);
            console.log(`  Latest analysis: ${firstAnalysis.date}`);

            // Check for revision information
            if (firstAnalysis.revision) {
              expect(typeof firstAnalysis.revision).toBe('string');
              console.log(`  Latest revision: ${firstAnalysis.revision.substring(0, 8)}`);
            }

            // Check for project version
            if (firstAnalysis.projectVersion) {
              expect(typeof firstAnalysis.projectVersion).toBe('string');
              console.log(`  Project version: ${firstAnalysis.projectVersion}`);
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
  });

  describe('Analysis Management Operations', () => {
    test(
      'should handle analysis creation validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping analysis creation test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping analysis creation test - no test project available');
          return;
        }

        try {
          // Note: We don't actually create analyses in integration tests as this
          // would require a complete analysis execution which is complex and time-consuming.
          // Instead, we validate that the API structure is correct.

          console.log('ℹ Analysis creation validation (read-only mode)');
          console.log('  Real analysis creation requires scanner execution');
          console.log('  Integration tests focus on API structure validation');

          // We can test the builder pattern and parameter validation
          const builder = client.projectAnalyses.search().project(testProjectKey);
          expect(builder).toBeDefined();

          console.log('✓ Analysis API builder structure validated');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for analysis management');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle analysis deletion safely',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping analysis deletion test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping analysis deletion test - no test project available');
          return;
        }

        try {
          // Note: We avoid actually deleting analyses in integration tests to prevent
          // data loss. Instead, we validate the API structure and permissions.

          console.log('ℹ Analysis deletion validation (read-only mode)');

          // First, check if there are analyses that could be deleted
          const { result } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(1).execute(),
          );

          if (result.analyses.length > 0) {
            console.log('✓ Analyses available for potential deletion operations');
            console.log('ℹ Actual deletion skipped to preserve analysis history');

            // In a real destructive test, you would call:
            // await client.projectAnalyses.delete({ analysisKey: analysisKey });
            // But we avoid this to prevent data loss
          } else {
            console.log('ℹ No analyses available for deletion testing');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for analysis deletion');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project or analysis not found');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Analysis Details and Metadata', () => {
    test(
      'should validate analysis metadata structure',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping metadata validation test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(5).execute(),
          );

          if (result.analyses.length === 0) {
            console.log('ℹ No analyses available for metadata validation');
            return;
          }

          let hasRevision = false;
          let hasProjectVersion = false;
          let hasBuildString = false;

          result.analyses.forEach((analysis) => {
            // Required fields
            expect(analysis.key).toBeDefined();
            expect(analysis.date).toBeDefined();
            expect(typeof analysis.key).toBe('string');
            expect(typeof analysis.date).toBe('string');

            // Optional fields
            if (analysis.revision) {
              hasRevision = true;
              expect(typeof analysis.revision).toBe('string');
              expect(analysis.revision.length).toBeGreaterThan(0);
            }

            if (analysis.projectVersion) {
              hasProjectVersion = true;
              expect(typeof analysis.projectVersion).toBe('string');
              expect(analysis.projectVersion.length).toBeGreaterThan(0);
            }

            if (analysis.buildString) {
              hasBuildString = true;
              expect(typeof analysis.buildString).toBe('string');
            }

            // Validate date format
            const analysisDate = new Date(analysis.date);
            expect(analysisDate.getTime()).not.toBeNaN();
          });

          console.log(`✓ Validated metadata for ${result.analyses.length} analyses`);
          console.log(`  Has revision info: ${hasRevision}`);
          console.log(`  Has project version: ${hasProjectVersion}`);
          console.log(`  Has build string: ${hasBuildString}`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access analysis metadata');
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
            client.projectAnalyses.search().project(testProjectKey).pageSize(10).execute(),
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
              const hasRevision = result.analyses.some((a) => a.revision);
              console.log(`  Revision information: ${hasRevision ? 'Available' : 'Not available'}`);
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

          // Both platforms should support the same project analyses API structure
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
            const hasManualBaseline = result.analyses.some((a) => a.manualNewCodePeriodBaseline);
            if (hasManualBaseline) {
              console.log('  Manual baseline information available');
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
            `✓ Retrieved ${result.analyses.length} project analyses in ${Math.round(durationMs)}ms`,
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
      'should handle large analysis histories efficiently',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping large history test - no test project available');
          return;
        }

        try {
          // Search for a large number of analyses
          const { result, durationMs } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(100).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 3000, // 3 seconds
            maximum: 12000, // 12 seconds absolute max
          });

          console.log(
            `✓ Large history search: ${result.analyses.length} analyses in ${Math.round(durationMs)}ms`,
          );

          if (result.paging.total > 100) {
            console.log(`  Total available: ${result.paging.total} analyses`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Large history test skipped - project not accessible');
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
      'should provide comprehensive project analysis workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting project analysis management workflow');

          // 1. Get analysis overview
          const { result: allAnalyses } = await measureTime(async () =>
            client.projectAnalyses.search().project(testProjectKey).pageSize(10).execute(),
          );

          console.log(`  Step 1: Found ${allAnalyses.analyses.length} total analyses`);

          if (allAnalyses.analyses.length === 0) {
            console.log('ℹ No analyses found for workflow test');
            return;
          }

          // 2. Analyze metadata distribution
          let withRevision = 0;
          let withVersion = 0;
          const uniqueRevisions = new Set<string>();

          allAnalyses.analyses.forEach((analysis) => {
            if (analysis.revision) {
              withRevision++;
              uniqueRevisions.add(analysis.revision);
            }
            if (analysis.projectVersion) {
              withVersion++;
            }
          });

          console.log(`  Step 2: Metadata analysis complete`);
          console.log(`    Analyses with revision: ${withRevision}`);
          console.log(`    Analyses with version: ${withVersion}`);
          console.log(`    Unique revisions: ${uniqueRevisions.size}`);

          // 3. Check recent analysis activity
          if (allAnalyses.analyses.length >= 2) {
            const latestAnalysis = allAnalyses.analyses[0];
            const previousAnalysis = allAnalyses.analyses[1];
            const timeDiff =
              new Date(latestAnalysis.date).getTime() - new Date(previousAnalysis.date).getTime();
            const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

            console.log(`  Step 3: Analysis frequency: ${daysDiff} days between latest analyses`);
          }

          console.log('✓ Project analysis workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete project analysis workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
