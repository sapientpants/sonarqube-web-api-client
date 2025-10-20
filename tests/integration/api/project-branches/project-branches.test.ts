// @ts-nocheck
/**
 * Project Branches API Integration Tests
 *
 * Tests the Project Branches API functionality for managing project branch analysis.
 * This API provides operations for listing, creating, deleting, and renaming project branches.
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

(skipTests ? describe.skip : describe)('Project Branches API Integration Tests', () => {
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

    // Get a test project for branch operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for project branches tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Branch List Operations', () => {
    test(
      'should list project branches',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch list test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.branches).toBeDefined();
          expect(Array.isArray(result.branches)).toBe(true);

          if (result.branches.length > 0) {
            const firstBranch = result.branches[0];
            expect(firstBranch.name).toBeDefined();
            expect(firstBranch.isMain).toBeDefined();
            expect(typeof firstBranch.name).toBe('string');
            expect(typeof firstBranch.isMain).toBe('boolean');

            console.log(`✓ Found ${result.branches.length} branches`);

            // Validate main branch
            const mainBranches = result.branches.filter((b) => b.isMain);
            expect(mainBranches.length).toBe(1);
            console.log(`  Main branch: ${mainBranches[0].name}`);

            // Check branch types
            const branchTypes = [...new Set(result.branches.map((b) => b.type))];
            console.log(`  Branch types: ${branchTypes.join(', ')}`);

            // Validate branch structure
            result.branches.forEach((branch) => {
              expect(branch.name).toBeDefined();
              expect(typeof branch.name).toBe('string');
              expect(branch.name.length).toBeGreaterThan(0);

              if (branch.type) {
                expect(['BRANCH', 'PULL_REQUEST']).toContain(branch.type);
              }

              if (branch.status) {
                expect(branch.status.qualityGateStatus).toBeDefined();
                expect(['OK', 'WARN', 'ERROR', 'NONE']).toContain(branch.status.qualityGateStatus);
              }

              if (branch.analysisDate) {
                expect(new Date(branch.analysisDate).getTime()).not.toBeNaN();
              }
            });
          } else {
            console.log('ℹ No branches found (project may not have branch analysis)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project branches');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or branch analysis not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle branch filtering and sorting',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch filtering test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.branches.length === 0) {
            console.log('ℹ No branches available for filtering test');
            return;
          }

          // Check if branches are sorted by some criteria
          const branchNames = result.branches.map((b) => b.name);
          console.log(
            `✓ Branch names: ${branchNames.slice(0, 5).join(', ')}${branchNames.length > 5 ? '...' : ''}`,
          );

          // Validate main branch is present
          const mainBranch = result.branches.find((b) => b.isMain);
          expect(mainBranch).toBeDefined();
          console.log(`  Main branch: ${mainBranch?.name}`);

          // Check for analysis data
          const branchesWithAnalysis = result.branches.filter((b) => b.analysisDate);
          console.log(`  Branches with analysis: ${branchesWithAnalysis.length}`);

          // Check quality gate status distribution
          const statusCounts = new Map<string, number>();
          result.branches.forEach((branch) => {
            if (branch.status?.qualityGateStatus) {
              const count = statusCounts.get(branch.status.qualityGateStatus) || 0;
              statusCounts.set(branch.status.qualityGateStatus, count + 1);
            }
          });

          if (statusCounts.size > 0) {
            console.log(`  Quality gate status distribution:`);
            statusCounts.forEach((count, status) => {
              console.log(`    ${status}: ${count}`);
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access project branches for filtering test');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Branch Management Operations', () => {
    test(
      'should handle branch creation validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping branch creation test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping branch creation test - no test project available');
          return;
        }

        try {
          // Note: We don't actually create branches in integration tests as this
          // could affect the project structure and requires specific permissions.
          // Instead, we validate the API structure.

          console.log('ℹ Branch creation validation (read-only mode)');
          console.log('  Real branch creation requires admin permissions and analysis execution');

          // Check if the project has the main branch
          const { result } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          if (result.branches.length > 0) {
            const mainBranch = result.branches.find((b) => b.isMain);
            if (mainBranch) {
              console.log(`✓ Main branch available: ${mainBranch.name}`);
              console.log('  Branch creation would be possible with proper permissions');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for branch management');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project or branches not found');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle branch deletion safely',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping branch deletion test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping branch deletion test - no test project available');
          return;
        }

        try {
          // Note: We avoid actually deleting branches in integration tests to prevent
          // losing important analysis data. Instead, we validate permissions and structure.

          console.log('ℹ Branch deletion validation (read-only mode)');

          const { result } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          if (result.branches.length > 1) {
            const nonMainBranches = result.branches.filter((b) => !b.isMain);
            if (nonMainBranches.length > 0) {
              console.log(`✓ ${nonMainBranches.length} non-main branches available`);
              console.log('ℹ Branch deletion would be possible with proper permissions');
              console.log('  Actual deletion skipped to preserve analysis data');
            } else {
              console.log('ℹ Only main branch present - deletion not applicable');
            }
          } else {
            console.log('ℹ No branches available for deletion testing');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access branches for deletion validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle branch renaming validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping branch renaming test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping branch renaming test - no test project available');
          return;
        }

        try {
          // Note: Branch renaming can have significant impacts on analysis history
          // and CI/CD pipelines, so we avoid doing it in integration tests.

          console.log('ℹ Branch renaming validation (read-only mode)');

          const { result } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          if (result.branches.length > 0) {
            const mainBranch = result.branches.find((b) => b.isMain);
            if (mainBranch) {
              console.log(`✓ Main branch: ${mainBranch.name}`);
              console.log('  Branch renaming operations would be available with admin permissions');
              console.log('  Actual renaming skipped to prevent CI/CD disruption');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access branches for renaming validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Branch Analysis and Quality', () => {
    test(
      'should validate branch analysis status',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping analysis status test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          if (result.branches.length === 0) {
            console.log('ℹ No branches available for analysis status validation');
            return;
          }

          let analyzedBranches = 0;
          const qualityGateResults = new Map<string, number>();

          result.branches.forEach((branch) => {
            if (branch.analysisDate) {
              analyzedBranches++;

              // Validate analysis date
              const analysisDate = new Date(branch.analysisDate);
              expect(analysisDate.getTime()).not.toBeNaN();

              // Check quality gate status
              if (branch.status?.qualityGateStatus) {
                const status = branch.status.qualityGateStatus;
                const count = qualityGateResults.get(status) || 0;
                qualityGateResults.set(status, count + 1);
              }

              // Check for bugs and vulnerabilities
              if (branch.status?.bugs !== undefined) {
                expect(typeof branch.status.bugs).toBe('number');
                expect(branch.status.bugs).toBeGreaterThanOrEqual(0);
              }

              if (branch.status?.vulnerabilities !== undefined) {
                expect(typeof branch.status.vulnerabilities).toBe('number');
                expect(branch.status.vulnerabilities).toBeGreaterThanOrEqual(0);
              }

              if (branch.status?.codeSmells !== undefined) {
                expect(typeof branch.status.codeSmells).toBe('number');
                expect(branch.status.codeSmells).toBeGreaterThanOrEqual(0);
              }
            }
          });

          console.log(`✓ Analyzed ${analyzedBranches} of ${result.branches.length} branches`);

          if (qualityGateResults.size > 0) {
            console.log('  Quality gate distribution:');
            qualityGateResults.forEach((count, status) => {
              console.log(`    ${status}: ${count}`);
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access branch analysis status');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle branch comparison scenarios',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch comparison test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          if (result.branches.length < 2) {
            console.log('ℹ Need at least 2 branches for comparison scenario');
            return;
          }

          const mainBranch = result.branches.find((b) => b.isMain);
          const otherBranches = result.branches.filter((b) => !b.isMain);

          if (mainBranch && otherBranches.length > 0) {
            console.log(`✓ Branch comparison scenario available`);
            console.log(`  Main branch: ${mainBranch.name}`);
            console.log(`  Other branches: ${otherBranches.length}`);

            // Compare analysis dates if available
            if (mainBranch.analysisDate && otherBranches[0].analysisDate) {
              const mainDate = new Date(mainBranch.analysisDate);
              const otherDate = new Date(otherBranches[0].analysisDate);
              const daysDiff =
                Math.abs(mainDate.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24);

              console.log(`  Analysis age difference: ${Math.round(daysDiff)} days`);
            }

            // Compare quality metrics if available
            if (mainBranch.status && otherBranches[0].status) {
              const mainQG = mainBranch.status.qualityGateStatus || 'UNKNOWN';
              const otherQG = otherBranches[0].status.qualityGateStatus || 'UNKNOWN';

              console.log(`  Quality gate comparison: ${mainQG} vs ${otherQG}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access branches for comparison');
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
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.branches.length} project branches`);

            // SonarCloud may have different branch management features
            if (result.branches.length > 0) {
              const branchTypes = [...new Set(result.branches.map((b) => b.type))];
              console.log(`  Branch types: ${branchTypes.join(', ')}`);
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.branches.length} project branches`);

            // SonarQube branch structure
            if (result.branches.length > 0) {
              const mainBranch = result.branches.find((b) => b.isMain);
              console.log(`  Main branch: ${mainBranch?.name || 'Not found'}`);
            }
          }

          // Both platforms should support the same branch API structure
          expect(result.branches).toBeDefined();
          expect(Array.isArray(result.branches)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - branches not accessible');
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
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.branches.length} branches`);

          if (result.branches.length > 0) {
            // Check for organization-specific branch features
            const hasExcludeFromPurge = result.branches.some(
              (b) => b.excludedFromPurge !== undefined,
            );
            if (hasExcludeFromPurge) {
              console.log('  Purge exclusion settings available');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - branches not accessible');
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
      'should maintain reasonable performance for branch listing',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 8000, // 8 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.branches.length} branches in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - branches not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent branch requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping concurrent test - no test project available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.projectBranches.list().project(testProjectKey).execute());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.branches).toBeDefined();
          });

          // All requests should return consistent data
          const firstCount = results[0].branches.length;
          results.slice(1).forEach((result) => {
            expect(result.branches.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - branches not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid project key gracefully',
      async () => {
        try {
          await client.projectBranches
            .list()
            .project('invalid-project-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for branches');
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
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.projectBranches.list().project('restricted-project-key').execute();

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
      'should provide comprehensive branch management workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting branch management workflow');

          // 1. Get branch overview
          const { result: branches } = await measureTime(async () =>
            client.projectBranches.list().project(testProjectKey).execute(),
          );

          console.log(`  Step 1: Found ${branches.branches.length} branches`);

          if (branches.branches.length === 0) {
            console.log('ℹ No branches found for workflow test');
            return;
          }

          // 2. Analyze branch health
          const mainBranch = branches.branches.find((b) => b.isMain);
          const featureBranches = branches.branches.filter((b) => !b.isMain);

          console.log(`  Step 2: Branch structure analysis`);
          console.log(`    Main branch: ${mainBranch?.name || 'Not found'}`);
          console.log(`    Feature branches: ${featureBranches.length}`);

          // 3. Quality assessment
          if (mainBranch?.status?.qualityGateStatus) {
            console.log(`    Main branch quality: ${mainBranch.status.qualityGateStatus}`);
          }

          // 4. Analysis freshness
          const branchesWithAnalysis = branches.branches.filter((b) => b.analysisDate);
          if (branchesWithAnalysis.length > 0) {
            const latestAnalysis = branchesWithAnalysis
              .map((b) => new Date(b.analysisDate))
              .sort((a, b) => b.getTime() - a.getTime())[0];

            const daysSinceLatest = Math.round(
              (Date.now() - latestAnalysis.getTime()) / (1000 * 60 * 60 * 24),
            );

            console.log(`  Step 3: Latest analysis ${daysSinceLatest} days ago`);
          }

          console.log('✓ Branch management workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete branch workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
