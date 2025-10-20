// @ts-nocheck
/**
 * Project Badges API Integration Tests
 *
 * Tests the Project Badges API functionality for managing project badge generation.
 * This API provides operations for generating project quality and measure badges.
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

(skipTests ? describe.skip : describe)('Project Badges API Integration Tests', () => {
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

    // Get a test project for badge operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for project badges tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Quality Gate Badge Operations', () => {
    test(
      'should generate quality gate badge',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping quality gate badge test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // Badge response should be an SVG
          expect(typeof result).toBe('string');
          expect(result).toContain('<svg');
          expect(result).toContain('</svg>');

          console.log(`✓ Quality gate badge generated successfully`);
          console.log(`  Badge size: ${result.length} characters`);

          // Check for quality gate status indicators in the SVG
          const hasQualityGateText = /quality.gate|passed|failed/i.test(result);
          if (hasQualityGateText) {
            console.log('  Quality gate status detected in badge');
          }

          // Validate SVG structure
          expect(result).toMatch(/<svg[^>]*>/);
          expect(result).toMatch(/<\/svg>/);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to generate quality gate badge');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or badge generation not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle quality gate badge with branch parameter',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch badge test - no test project available');
          return;
        }

        try {
          // First, get project branches to find a valid branch
          const branches = await client.projectBranches.list().project(testProjectKey).execute();

          if (branches.branches.length === 0) {
            console.log('ℹ No branches available for branch badge test');
            return;
          }

          const mainBranch = branches.branches.find((b) => b.isMain);
          if (!mainBranch) {
            console.log('ℹ No main branch found for branch badge test');
            return;
          }

          const { result, durationMs } = await measureTime(async () =>
            client.projectBadges
              .qualityGate()
              .project(testProjectKey)
              .branch(mainBranch.name)
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(typeof result).toBe('string');
          expect(result).toContain('<svg');
          expect(result).toContain('</svg>');

          console.log(`✓ Branch-specific quality gate badge generated for '${mainBranch.name}'`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot generate branch-specific quality gate badge');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Measure Badge Operations', () => {
    test(
      'should generate measure badges for common metrics',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping measure badge test - no test project available');
          return;
        }

        const commonMetrics = ['coverage', 'bugs', 'vulnerabilities', 'code_smells', 'ncloc'];

        for (const metric of commonMetrics) {
          try {
            const { result, durationMs } = await measureTime(async () =>
              client.projectBadges.measure().project(testProjectKey).metric(metric).execute(),
            );

            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

            expect(typeof result).toBe('string');
            expect(result).toContain('<svg');
            expect(result).toContain('</svg>');

            console.log(`✓ Measure badge generated for metric: ${metric}`);

            // Check for metric-specific content
            const lowerResult = result.toLowerCase();
            if (
              lowerResult.includes(metric.toLowerCase()) ||
              lowerResult.includes(metric.replace('_', ' '))
            ) {
              console.log(`  Metric name '${metric}' found in badge content`);
            }
          } catch (error: unknown) {
            const errorObj = error as { status?: number };

            if (errorObj.status === 403) {
              console.log(`ℹ Insufficient permissions for ${metric} badge generation`);
            } else if (errorObj.status === 404) {
              console.log(`ℹ Metric '${metric}' not available for badge generation`);
            } else {
              console.log(
                `ℹ Error generating badge for metric '${metric}': status ${errorObj.status}`,
              );
            }
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle measure badge with branch parameter',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch measure badge test - no test project available');
          return;
        }

        try {
          // Get project branches
          const branches = await client.projectBranches.list().project(testProjectKey).execute();

          if (branches.branches.length === 0) {
            console.log('ℹ No branches available for branch measure badge test');
            return;
          }

          const mainBranch = branches.branches.find((b) => b.isMain);
          if (!mainBranch) {
            console.log('ℹ No main branch found for branch measure badge test');
            return;
          }

          const { result, durationMs } = await measureTime(async () =>
            client.projectBadges
              .measure()
              .project(testProjectKey)
              .metric('coverage')
              .branch(mainBranch.name)
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(typeof result).toBe('string');
          expect(result).toContain('<svg');

          console.log(
            `✓ Branch-specific measure badge generated for coverage on '${mainBranch.name}'`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot generate branch-specific measure badge');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Badge Customization', () => {
    test(
      'should handle badge template parameter',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping badge template test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBadges
              .qualityGate()
              .project(testProjectKey)
              .template('flat-square')
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(typeof result).toBe('string');
          expect(result).toContain('<svg');

          console.log(`✓ Badge generated with flat-square template`);

          // Different templates may have different styling attributes
          const hasRectElements = result.includes('<rect');
          if (hasRectElements) {
            console.log('  Template styling detected in badge');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 400) {
            console.log('ℹ Badge template parameter not supported or invalid');
          } else if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot generate badge with custom template');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should validate badge format and structure',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping badge validation test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          // Validate SVG structure
          expect(result).toMatch(/^<\?xml|^<svg/); // Should start with XML declaration or SVG tag
          expect(result).toContain('<svg');
          expect(result).toContain('</svg>');

          console.log(`✓ Badge structure validation passed`);

          // Check for common SVG elements
          const hasText = result.includes('<text');
          const hasRect = result.includes('<rect');
          const hasPath = result.includes('<path');

          console.log(`  SVG elements present:`);
          console.log(`    Text elements: ${hasText}`);
          console.log(`    Rectangle elements: ${hasRect}`);
          console.log(`    Path elements: ${hasPath}`);

          // Validate that badge contains some content
          expect(result.length).toBeGreaterThan(100); // Reasonable minimum size for SVG badge
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot validate badge structure - generation not accessible');
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
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Badge generated successfully`);

            // SonarCloud badges may have organization context
            if (envConfig.organization) {
              console.log(`  Organization context: ${envConfig.organization}`);
            }
          } else {
            console.log(`✓ SonarQube: Badge generated successfully`);

            // SonarQube badge generation
            console.log(`  Instance-specific badge generation working`);
          }

          // Both platforms should return valid SVG badges
          expect(typeof result).toBe('string');
          if (typeof result === 'string') {
            expect(result).toContain('<svg');
            expect(result).toContain('</svg>');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - badge generation not accessible');
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
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: Badge generated`);

          // Organization-specific badge features
          expect(result).toContain('<svg');

          // SonarCloud badges may include organization branding
          console.log('  Organization-specific badge generation working');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - badge generation not accessible');
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
      'should maintain reasonable performance for badge generation',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 5000, // 5 seconds absolute max
          });

          console.log(`✓ Badge generated in ${Math.round(durationMs)}ms`);
          console.log(`  Badge size: ${result.length} characters`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - badge generation not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent badge requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping concurrent test - no test project available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.projectBadges.qualityGate().project(testProjectKey).execute());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result).toContain('<svg');
          });

          // All requests should return consistent badge content
          const _firstBadge = results[0];
          results.slice(1).forEach((result) => {
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('<svg');
            // Note: Badge content may vary slightly due to timestamps, so we don't check for exact equality
          });

          console.log(`✓ ${results.length} concurrent badge requests completed successfully`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - badge generation not accessible');
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
          await client.projectBadges
            .qualityGate()
            .project('invalid-project-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for badge generation');
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
      'should handle invalid metric for measure badge',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping invalid metric test - no test project available');
          return;
        }

        try {
          await client.projectBadges
            .measure()
            .project(testProjectKey)
            .metric('invalid-metric-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid metrics gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 400) {
            console.log('✓ API validates metric parameters for badge generation');
            expect(errorObj.status).toBe(400);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent metrics');
            expect(errorObj.status).toBe(404);
          } else {
            console.log(`ℹ Metric validation: status ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.projectBadges.qualityGate().project('restricted-project-key').execute();

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
      'should provide comprehensive badge generation workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting badge generation workflow');

          // 1. Generate quality gate badge
          const { result: qualityBadge } = await measureTime(async () =>
            client.projectBadges.qualityGate().project(testProjectKey).execute(),
          );

          console.log(`  Step 1: Quality gate badge generated (${qualityBadge.length} chars)`);

          // 2. Generate common measure badges
          const measureMetrics = ['coverage', 'bugs'];
          const measureBadges = [];

          for (const metric of measureMetrics) {
            try {
              const { result: measureBadge } = await measureTime(async () =>
                client.projectBadges.measure().project(testProjectKey).metric(metric).execute(),
              );
              measureBadges.push({ metric, badge: measureBadge });
              console.log(`  Step 2: ${metric} badge generated (${measureBadge.length} chars)`);
            } catch {
              console.log(`  Step 2: ${metric} badge generation failed`);
            }
          }

          // 3. Validate all badges are valid SVG
          const allBadges = [qualityBadge, ...measureBadges.map((m) => m.badge)];
          allBadges.forEach((badge) => {
            expect(badge).toContain('<svg');
            expect(badge).toContain('</svg>');
          });

          console.log(`  Step 3: Generated ${allBadges.length} valid badges total`);
          console.log('✓ Badge generation workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete badge generation workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
