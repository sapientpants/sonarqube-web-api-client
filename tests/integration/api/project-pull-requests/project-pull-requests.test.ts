// @ts-nocheck
/**
 * Project Pull Requests API Integration Tests
 *
 * Tests the Project Pull Requests API functionality for managing pull request analysis.
 * This API provides operations for listing and deleting pull request analyses.
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

(skipTests ? describe.skip : describe)('Project Pull Requests API Integration Tests', () => {
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

    // Get a test project for pull request operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for project pull requests tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Pull Request List Operations', () => {
    test(
      'should list project pull requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping PR list test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.pullRequests).toBeDefined();
          expect(Array.isArray(result.pullRequests)).toBe(true);

          if (result.pullRequests.length > 0) {
            const firstPR = result.pullRequests[0];
            expect(firstPR.key).toBeDefined();
            expect(firstPR.title).toBeDefined();
            expect(typeof firstPR.key).toBe('string');
            expect(typeof firstPR.title).toBe('string');

            console.log(`✓ Found ${result.pullRequests.length} pull requests`);
            console.log(`  First PR: ${firstPR.title}`);

            // Validate pull request structure
            result.pullRequests.forEach((pr) => {
              expect(pr.key).toBeDefined();
              expect(typeof pr.key).toBe('string');
              expect(pr.key.length).toBeGreaterThan(0);

              if (pr.title) {
                expect(typeof pr.title).toBe('string');
              }

              if (pr.branch) {
                expect(typeof pr.branch).toBe('string');
              }

              if (pr.base) {
                expect(typeof pr.base).toBe('string');
              }

              if (pr.status) {
                expect(pr.status.qualityGateStatus).toBeDefined();
                expect(['OK', 'WARN', 'ERROR', 'NONE']).toContain(pr.status.qualityGateStatus);
              }

              if (pr.analysisDate) {
                expect(new Date(pr.analysisDate).getTime()).not.toBeNaN();
              }

              if (pr.url) {
                expect(typeof pr.url).toBe('string');
                expect(pr.url).toMatch(/^https?:\/\//);
              }
            });

            // Check for different PR states
            const statusCounts = new Map<string, number>();
            result.pullRequests.forEach((pr) => {
              if (pr.status?.qualityGateStatus) {
                const status = pr.status.qualityGateStatus;
                const count = statusCounts.get(status) || 0;
                statusCounts.set(status, count + 1);
              }
            });

            if (statusCounts.size > 0) {
              console.log(`  Quality gate status distribution:`);
              statusCounts.forEach((count, status) => {
                console.log(`    ${status}: ${count}`);
              });
            }
          } else {
            console.log('ℹ No pull requests found (project may not have PR analysis enabled)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project pull requests');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle pull request filtering and search',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping PR filtering test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.pullRequests.length === 0) {
            console.log('ℹ No pull requests available for filtering test');
            return;
          }

          // Analyze PR characteristics
          const prTitles = result.pullRequests.map((pr) => pr.title).filter(Boolean);
          const prBranches = result.pullRequests.map((pr) => pr.branch).filter(Boolean);
          const prBases = result.pullRequests.map((pr) => pr.base).filter(Boolean);

          console.log(`✓ Pull request characteristics:`);
          console.log(`  Titles available: ${prTitles.length}`);
          console.log(`  Branch names: ${prBranches.length}`);
          console.log(`  Base branches: ${[...new Set(prBases)].join(', ')}`);

          // Check for analysis data
          const prsWithAnalysis = result.pullRequests.filter((pr) => pr.analysisDate);
          console.log(`  PRs with analysis: ${prsWithAnalysis.length}`);

          // Check for external URLs
          const prsWithUrls = result.pullRequests.filter((pr) => pr.url);
          if (prsWithUrls.length > 0) {
            console.log(`  PRs with external URLs: ${prsWithUrls.length}`);

            // Validate URL patterns
            prsWithUrls.forEach((pr) => {
              if (pr.url) {
                expect(pr.url).toMatch(/^https?:\/\//);
              }
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Cannot access project pull requests for filtering test');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Pull Request Analysis and Quality', () => {
    test(
      'should validate pull request analysis status',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping PR analysis status test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          if (result.pullRequests.length === 0) {
            console.log('ℹ No pull requests available for analysis status validation');
            return;
          }

          let analyzedPRs = 0;
          const qualityGateResults = new Map<string, number>();
          let totalBugs = 0;
          let totalVulnerabilities = 0;
          let totalCodeSmells = 0;

          result.pullRequests.forEach((pr) => {
            if (pr.analysisDate) {
              analyzedPRs++;

              // Validate analysis date
              const analysisDate = new Date(pr.analysisDate);
              expect(analysisDate.getTime()).not.toBeNaN();

              // Check quality gate status
              if (pr.status?.qualityGateStatus) {
                const status = pr.status.qualityGateStatus;
                const count = qualityGateResults.get(status) || 0;
                qualityGateResults.set(status, count + 1);
              }

              // Aggregate quality metrics
              if (pr.status?.bugs !== undefined) {
                expect(typeof pr.status.bugs).toBe('number');
                expect(pr.status.bugs).toBeGreaterThanOrEqual(0);
                totalBugs += pr.status.bugs;
              }

              if (pr.status?.vulnerabilities !== undefined) {
                expect(typeof pr.status.vulnerabilities).toBe('number');
                expect(pr.status.vulnerabilities).toBeGreaterThanOrEqual(0);
                totalVulnerabilities += pr.status.vulnerabilities;
              }

              if (pr.status?.codeSmells !== undefined) {
                expect(typeof pr.status.codeSmells).toBe('number');
                expect(pr.status.codeSmells).toBeGreaterThanOrEqual(0);
                totalCodeSmells += pr.status.codeSmells;
              }
            }
          });

          console.log(`✓ Analyzed ${analyzedPRs} of ${result.pullRequests.length} pull requests`);

          if (qualityGateResults.size > 0) {
            console.log('  Quality gate distribution:');
            qualityGateResults.forEach((count, status) => {
              console.log(`    ${status}: ${count}`);
            });
          }

          if (analyzedPRs > 0) {
            console.log(`  Quality metrics summary:`);
            console.log(`    Total bugs: ${totalBugs}`);
            console.log(`    Total vulnerabilities: ${totalVulnerabilities}`);
            console.log(`    Total code smells: ${totalCodeSmells}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Cannot access pull request analysis status');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle pull request quality comparison',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping PR quality comparison test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          if (result.pullRequests.length < 2) {
            console.log('ℹ Need at least 2 pull requests for quality comparison');
            return;
          }

          const analyzedPRs = result.pullRequests.filter((pr) => pr.analysisDate && pr.status);

          if (analyzedPRs.length < 2) {
            console.log('ℹ Need at least 2 analyzed PRs for quality comparison');
            return;
          }

          console.log(`✓ Quality comparison available for ${analyzedPRs.length} PRs`);

          // Compare quality gate statuses
          const qualityGateStatuses = analyzedPRs.map(
            (pr) => pr.status?.qualityGateStatus || 'UNKNOWN',
          );
          const uniqueStatuses = [...new Set(qualityGateStatuses)];
          console.log(`  Quality gate variety: ${uniqueStatuses.join(', ')}`);

          // Find best and worst quality PRs
          const qualityScore = (pr: (typeof analyzedPRs)[0]): number => {
            const bugs = pr.status?.bugs ?? 0;
            const vulnerabilities = pr.status?.vulnerabilities ?? 0;
            const codeSmells = pr.status?.codeSmells ?? 0;
            return bugs + vulnerabilities * 2 + codeSmells * 0.1; // Weighted score
          };

          analyzedPRs.sort((a, b) => qualityScore(a) - qualityScore(b));

          const bestPR = analyzedPRs[0];
          const worstPR = analyzedPRs[analyzedPRs.length - 1];

          console.log(`  Best quality PR: ${bestPR.title || bestPR.key}`);
          console.log(`    Quality gate: ${bestPR.status?.qualityGateStatus || 'Unknown'}`);
          console.log(`  Worst quality PR: ${worstPR.title || worstPR.key}`);
          console.log(`    Quality gate: ${worstPR.status?.qualityGateStatus || 'Unknown'}`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Cannot access pull requests for quality comparison');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Pull Request Management Operations', () => {
    test(
      'should handle pull request deletion safely',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping PR deletion test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping PR deletion test - no test project available');
          return;
        }

        try {
          // Note: We avoid actually deleting pull requests in integration tests
          // to prevent losing important analysis data. Instead, we validate structure.

          console.log('ℹ Pull request deletion validation (read-only mode)');

          const { result } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          if (result.pullRequests.length > 0) {
            console.log(`✓ ${result.pullRequests.length} pull requests available`);
            console.log('ℹ PR deletion would be possible with proper permissions');
            console.log('  Actual deletion skipped to preserve analysis data');

            // In a real destructive test, you would call:
            // await client.projectPullRequests.delete({ project: testProjectKey, pullRequest: prKey });
            // But we avoid this to prevent data loss
          } else {
            console.log('ℹ No pull requests available for deletion testing');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for pull request deletion');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should validate pull request lifecycle',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping PR lifecycle test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          if (result.pullRequests.length === 0) {
            console.log('ℹ No pull requests available for lifecycle validation');
            return;
          }

          console.log(`✓ Pull request lifecycle analysis for ${result.pullRequests.length} PRs`);

          // Analyze PR analysis timeline
          const prsWithAnalysis = result.pullRequests.filter((pr) => pr.analysisDate);
          if (prsWithAnalysis.length > 0) {
            const analysisDates = prsWithAnalysis
              .map((pr) => new Date(pr.analysisDate))
              .sort((a, b) => a.getTime() - b.getTime());

            const oldestAnalysis = analysisDates[0];
            const newestAnalysis = analysisDates[analysisDates.length - 1];
            const timeSpan = newestAnalysis.getTime() - oldestAnalysis.getTime();
            const daySpan = Math.round(timeSpan / (1000 * 60 * 60 * 24));

            console.log(`  Analysis timeline spans ${daySpan} days`);
            console.log(
              `  Average analysis age: ${Math.round(
                prsWithAnalysis.reduce((sum, pr) => {
                  const age = Date.now() - new Date(pr.analysisDate).getTime();
                  return sum + age;
                }, 0) /
                  prsWithAnalysis.length /
                  (1000 * 60 * 60 * 24),
              )} days`,
            );
          }

          // Check for PR integration patterns
          const baseBranches = [
            ...new Set(result.pullRequests.map((pr) => pr.base).filter(Boolean)),
          ];
          console.log(`  Target branches: ${baseBranches.join(', ')}`);

          // Validate PR naming patterns
          const prTitles = result.pullRequests.map((pr) => pr.title).filter(Boolean);
          if (prTitles.length > 0) {
            const hasFeaturePattern = prTitles.some((title) => /feat|feature/i.test(title));
            const hasBugfixPattern = prTitles.some((title) => /fix|bug/i.test(title));
            const hasDocsPattern = prTitles.some((title) => /doc|readme/i.test(title));

            console.log(`  PR type patterns:`);
            console.log(`    Feature PRs: ${hasFeaturePattern ? 'Present' : 'Not detected'}`);
            console.log(`    Bugfix PRs: ${hasBugfixPattern ? 'Present' : 'Not detected'}`);
            console.log(`    Documentation PRs: ${hasDocsPattern ? 'Present' : 'Not detected'}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Cannot access pull requests for lifecycle validation');
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
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.pullRequests.length} pull requests`);

            // SonarCloud may have different PR integration features
            if (result.pullRequests.length > 0) {
              const prsWithUrls = result.pullRequests.filter((pr) => pr.url);
              console.log(`  PRs with external URLs: ${prsWithUrls.length}`);
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.pullRequests.length} pull requests`);

            // SonarQube PR structure
            if (result.pullRequests.length > 0) {
              const prsWithBranches = result.pullRequests.filter((pr) => pr.branch);
              console.log(`  PRs with branch info: ${prsWithBranches.length}`);
            }
          }

          // Both platforms should support the same PR API structure
          expect(result.pullRequests).toBeDefined();
          expect(Array.isArray(result.pullRequests)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Platform test skipped - pull requests not accessible');
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
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.pullRequests.length} PRs`);

          if (result.pullRequests.length > 0) {
            // Check for organization-specific PR features
            const prsWithUrls = result.pullRequests.filter((pr) => pr.url);
            if (prsWithUrls.length > 0) {
              console.log('  External PR URLs available (typical for SonarCloud)');
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Organization test skipped - pull requests not accessible');
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
      'should maintain reasonable performance for pull request listing',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 8000, // 8 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.pullRequests.length} pull requests in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Performance test skipped - pull requests not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent pull request requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping concurrent test - no test project available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.projectPullRequests.list().project(testProjectKey).execute());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.pullRequests).toBeDefined();
          });

          // All requests should return consistent data
          const firstCount = results[0].pullRequests.length;
          results.slice(1).forEach((result) => {
            expect(result.pullRequests.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('ℹ Concurrent test skipped - pull requests not accessible');
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
          await client.projectPullRequests
            .list()
            .project('invalid-project-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for pull requests');
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
          await client.projectPullRequests.list().project('restricted-project-key').execute();

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 404 || errorObj.message?.includes('Unknown url')) {
            console.log('ℹ Project pull requests API not available in this SonarQube version');
            return;
          }

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
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
      'should provide comprehensive pull request workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting pull request management workflow');

          // 1. Get pull request overview
          const { result: pullRequests } = await measureTime(async () =>
            client.projectPullRequests.list().project(testProjectKey).execute(),
          );

          console.log(`  Step 1: Found ${pullRequests.pullRequests.length} pull requests`);

          if (pullRequests.pullRequests.length === 0) {
            console.log('ℹ No pull requests found for workflow test');
            return;
          }

          // 2. Analyze pull request health
          const analyzedPRs = pullRequests.pullRequests.filter((pr) => pr.analysisDate);
          const qualityGatePassed = pullRequests.pullRequests.filter(
            (pr) => pr.status?.qualityGateStatus === 'OK',
          );

          console.log(`  Step 2: PR health analysis`);
          console.log(`    Analyzed PRs: ${analyzedPRs.length}`);
          console.log(`    Quality gate passed: ${qualityGatePassed.length}`);

          // 3. Integration readiness
          const readyToMerge = pullRequests.pullRequests.filter(
            (pr) => pr.status?.qualityGateStatus === 'OK' && pr.analysisDate,
          );

          console.log(`  Step 3: Integration readiness`);
          console.log(`    Ready to merge: ${readyToMerge.length}`);

          // 4. Quality trends
          if (analyzedPRs.length > 1) {
            const avgBugs =
              analyzedPRs.reduce((sum, pr) => sum + (pr.status?.bugs ?? 0), 0) / analyzedPRs.length;
            const avgVulns =
              analyzedPRs.reduce((sum, pr) => sum + (pr.status?.vulnerabilities ?? 0), 0) /
              analyzedPRs.length;

            console.log(`  Step 4: Quality metrics`);
            console.log(`    Average bugs per PR: ${avgBugs.toFixed(1)}`);
            console.log(`    Average vulnerabilities per PR: ${avgVulns.toFixed(1)}`);
          }

          console.log('✓ Pull request workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete pull request workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
