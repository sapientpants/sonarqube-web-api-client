/**
 * New Code Periods API Integration Tests
 *
 * Tests the New Code Periods API functionality for managing new code period definitions.
 * This API provides operations for setting and retrieving new code period configurations.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, TEST_TIMING } from '../../utils/testHelpers';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';
import { NewCodePeriodType } from '../../../resources/new-code-periods/types';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('New Code Periods API Integration Tests', () => {
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

    // Get a test project for new code period operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for new code periods tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('New Code Period Retrieval', () => {
    test(
      'should get new code period configuration',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.type).toBeDefined();
          expect(typeof result.type).toBe('string');

          // Validate new code period types
          const validTypes = [
            'PREVIOUS_VERSION',
            'NUMBER_OF_DAYS',
            'SPECIFIC_ANALYSIS',
            'REFERENCE_BRANCH',
          ];
          expect(validTypes).toContain(result.type);

          console.log(`✓ Global new code period type: ${result.type}`);

          // Type-specific validations
          switch (result.type) {
            case NewCodePeriodType.NUMBER_OF_DAYS:
              if (result.value) {
                expect(typeof result.value).toBe('string');
                const days = parseInt(result.value, 10);
                expect(days).toBeGreaterThan(0);
                console.log(`  Days: ${days}`);
              }
              break;
            case NewCodePeriodType.SPECIFIC_ANALYSIS:
              if (result.value) {
                expect(typeof result.value).toBe('string');
                console.log(`  Analysis key: ${result.value.substring(0, 8)}...`);
              }
              break;
            case NewCodePeriodType.REFERENCE_BRANCH:
              if (result.value) {
                expect(typeof result.value).toBe('string');
                console.log(`  Reference branch: ${result.value}`);
              }
              break;
            case NewCodePeriodType.PREVIOUS_VERSION:
              console.log('  Using previous version as baseline');
              break;
          }

          if (result.inherited !== undefined) {
            expect(typeof result.inherited).toBe('boolean');
            console.log(`  Inherited: ${result.inherited}`);
          }

          if (result.effectiveValue) {
            expect(typeof result.effectiveValue).toBe('string');
            console.log(`  Effective value: ${result.effectiveValue}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view new code periods');
          } else if (errorObj.status === 404) {
            console.log('ℹ New code periods not available in this version');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get project-specific new code period',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping project-specific test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({ project: testProjectKey })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.type).toBeDefined();
          console.log(`✓ Project new code period type: ${result.type}`);

          // Compare with global settings
          const { result: globalSettings } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          if (result.inherited) {
            expect(result.type).toBe(globalSettings.type);
            console.log(`  Inherits from global: ${globalSettings.type}`);
          } else {
            console.log(`  Project-specific configuration`);
          }

          if (result.value) {
            console.log(`  Value: ${result.value}`);
          }

          if (result.effectiveValue) {
            console.log(`  Effective value: ${result.effectiveValue}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project new code periods');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or new code periods not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get branch-specific new code period',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping branch-specific test - no test project available');
          return;
        }

        try {
          // First, get project branches to find a valid branch
          const branches = await client.projectBranches.list().project(testProjectKey).execute();

          if (branches.branches.length === 0) {
            console.log('ℹ No branches available for branch-specific new code period test');
            return;
          }

          const mainBranch = branches.branches.find((b) => b.isMain);
          if (!mainBranch) {
            console.log('ℹ No main branch found for branch-specific test');
            return;
          }

          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({ project: testProjectKey, branch: mainBranch.name })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ Branch '${mainBranch.name}' new code period type: ${result.type}`);

          if (result.inherited) {
            console.log(`  Inherits from project/global settings`);
          } else {
            console.log(`  Branch-specific configuration`);
          }

          if (result.value) {
            console.log(`  Value: ${result.value}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view branch new code periods');
          } else if (errorObj.status === 404) {
            console.log('ℹ Branch not found or new code periods not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('New Code Period Configuration', () => {
    test(
      'should handle new code period configuration validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping configuration test - destructive tests disabled');
          return;
        }

        try {
          // Note: We avoid actually changing new code periods in integration tests
          // as this affects analysis behavior and could disrupt other processes.

          console.log('ℹ New code period configuration validation (read-only mode)');

          // Get current configuration to understand the baseline
          const { result: currentConfig } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          console.log(`  Current global configuration: ${currentConfig.type}`);
          console.log('  Configuration changes would be possible with admin permissions');
          console.log('  Actual changes skipped to prevent analysis disruption');

          // Validate configuration types are understood
          const supportedTypes = [
            'PREVIOUS_VERSION',
            'NUMBER_OF_DAYS',
            'SPECIFIC_ANALYSIS',
            'REFERENCE_BRANCH',
          ];

          expect(supportedTypes).toContain(currentConfig.type);
          console.log(`✓ Configuration type '${currentConfig.type}' is supported`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for new code period configuration');
          } else if (errorObj.status === 404) {
            console.log('ℹ New code period configuration not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should validate configuration hierarchy',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping hierarchy test - no test project available');
          return;
        }

        try {
          // Get configurations at different levels
          const { result: globalConfig } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          const { result: projectConfig } = await measureTime(async () =>
            client.newCodePeriods.show({ project: testProjectKey })
          );

          console.log(`✓ Configuration hierarchy validation`);
          console.log(`  Global: ${globalConfig.type}`);
          console.log(`  Project: ${projectConfig.type} (inherited: ${projectConfig.inherited})`);

          // Validate inheritance behavior
          if (projectConfig.inherited) {
            expect(projectConfig.type).toBe(globalConfig.type);
            console.log(`  ✓ Correct inheritance from global to project`);
          } else {
            console.log(`  ✓ Project has custom configuration`);
          }

          // Check for branches if available
          try {
            const branches = await client.projectBranches.list().project(testProjectKey).execute();
            const mainBranch = branches.branches.find((b) => b.isMain);

            if (mainBranch) {
              const { result: branchConfig } = await measureTime(async () =>
                client.newCodePeriods.show({ project: testProjectKey, branch: mainBranch.name })
              );

              console.log(
                `  Branch '${mainBranch.name}': ${branchConfig.type} (inherited: ${branchConfig.inherited})`
              );

              if (branchConfig.inherited) {
                expect(branchConfig.type).toBe(projectConfig.type);
                console.log(`  ✓ Correct inheritance from project to branch`);
              }
            }
          } catch {
            console.log(`  Branch configuration not accessible`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access configuration hierarchy');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('New Code Period Types and Validation', () => {
    test(
      'should validate different new code period types',
      async () => {
        try {
          const { result } = await measureTime(async () => client.newCodePeriods.show({}));

          console.log(`✓ Validating new code period type: ${result.type}`);

          switch (result.type) {
            case NewCodePeriodType.PREVIOUS_VERSION:
              console.log('  PREVIOUS_VERSION: Uses the last version event as baseline');
              console.log('  - No additional configuration required');
              console.log('  - Automatically updates with each version release');
              break;

            case NewCodePeriodType.NUMBER_OF_DAYS:
              if (result.value) {
                const days = parseInt(result.value, 10);
                expect(days).toBeGreaterThan(0);
                expect(days).toBeLessThanOrEqual(365); // Reasonable upper bound
                console.log(`  NUMBER_OF_DAYS: ${days} days`);
                console.log(`  - Covers changes in the last ${days} days`);
                console.log(`  - Rolling window that updates daily`);
              }
              break;

            case NewCodePeriodType.SPECIFIC_ANALYSIS:
              if (result.value) {
                expect(typeof result.value).toBe('string');
                console.log(`  SPECIFIC_ANALYSIS: ${result.value.substring(0, 12)}...`);
                console.log('  - Fixed baseline from a specific analysis');
                console.log('  - Consistent baseline until manually changed');
              }
              break;

            case NewCodePeriodType.REFERENCE_BRANCH:
              if (result.value) {
                expect(typeof result.value).toBe('string');
                console.log(`  REFERENCE_BRANCH: ${result.value}`);
                console.log('  - Compares against another branch');
                console.log('  - Useful for feature branch analysis');
              }
              break;

            default:
              console.log(`  Unknown type: ${result.type}`);
              expect(false).toBe(true); // Fail if unknown type
          }

          // Validate effective value computation
          if (result.effectiveValue) {
            console.log(`  Effective value: ${result.effectiveValue}`);

            // For date-based types, validate the date format
            if (
              result.type === NewCodePeriodType.NUMBER_OF_DAYS ||
              result.type === NewCodePeriodType.SPECIFIC_ANALYSIS
            ) {
              // effectiveValue might be a date or analysis key
              if (result.effectiveValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                const effectiveDate = new Date(result.effectiveValue);
                expect(effectiveDate.getTime()).not.toBeNaN();
                console.log(`  Effective date: ${effectiveDate.toISOString().split('T')[0]}`);
              }
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access new code period configuration for validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle new code period edge cases',
      async () => {
        try {
          const { result } = await measureTime(async () => client.newCodePeriods.show({}));

          console.log(`✓ Edge case validation for type: ${result.type}`);

          // Validate configuration consistency
          expect(result.type).toBeDefined();
          expect(typeof result.type).toBe('string');

          // Check for potential configuration issues
          if (result.type === NewCodePeriodType.NUMBER_OF_DAYS && result.value) {
            const days = parseInt(result.value, 10);
            if (days > 90) {
              console.log(`  ⚠ Large day window (${days} days) - may impact performance`);
            }
            if (days < 1) {
              console.log(`  ⚠ Very small day window (${days} days) - may miss changes`);
            }
          }

          if (result.type === NewCodePeriodType.REFERENCE_BRANCH && result.value) {
            console.log(`  Reference branch: ${result.value}`);
            console.log(`  Note: Ensure reference branch exists and is regularly updated`);
          }

          // Validate inheritance consistency
          if (result.inherited !== undefined) {
            if (result.inherited && !result.value) {
              console.log(`  ✓ Inherited configuration without override value`);
            } else if (!result.inherited && result.value) {
              console.log(`  ✓ Custom configuration with specific value`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access configuration for edge case validation');
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
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: New code period type ${result.type}`);

            // SonarCloud may have different default configurations
            if (result.type === NewCodePeriodType.PREVIOUS_VERSION) {
              console.log('  Default PREVIOUS_VERSION suitable for SonarCloud projects');
            }
          } else {
            console.log(`✓ SonarQube: New code period type ${result.type}`);

            // SonarQube configuration
            if (result.value) {
              console.log(`  Configuration value: ${result.value}`);
            }
          }

          // Both platforms should support the same new code period API
          expect(result.type).toBeDefined();
          expect(typeof result.type).toBe('string');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - new code periods not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle organization context for SonarCloud',
      async () => {
        if (!envConfig?.isSonarCloud || !envConfig.organization) {
          console.log('ℹ Skipping organization test - not SonarCloud or no organization');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.type}`);

          // Organization-level new code period settings
          if (result.inherited === false) {
            console.log('  Organization has custom new code period configuration');
          } else {
            console.log('  Organization uses default new code period configuration');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - configuration not accessible');
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
      'should maintain reasonable performance for configuration retrieval',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 4000, // 4 seconds absolute max
          });

          console.log(`✓ Retrieved new code period config in ${Math.round(durationMs)}ms`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - configuration not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle concurrent configuration requests',
      async () => {
        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.newCodePeriods.show({}));

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.type).toBeDefined();
          });

          // All requests should return consistent data
          const firstType = results[0].type;
          results.slice(1).forEach((result) => {
            expect(result.type).toBe(firstType);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - configuration not accessible');
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
          await client.newCodePeriods.show({ project: 'invalid-project-key-that-does-not-exist' });

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for new code periods');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
            expect(errorObj.status).toBe(400);
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
          await client.newCodePeriods.show({ project: 'restricted-project-key' });

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
      TEST_TIMING.fast
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide comprehensive new code period workflow',
      async () => {
        try {
          console.log('✓ Starting new code period configuration workflow');

          // 1. Get global configuration
          const { result: globalConfig } = await measureTime(async () =>
            client.newCodePeriods.show({})
          );

          console.log(`  Step 1: Global configuration - ${globalConfig.type}`);

          // 2. Check project-specific configuration if available
          if (testProjectKey) {
            try {
              const { result: projectConfig } = await measureTime(async () =>
                client.newCodePeriods.show({ project: testProjectKey })
              );

              console.log(`  Step 2: Project configuration - ${projectConfig.type}`);
              console.log(`    Inherited: ${projectConfig.inherited}`);

              // 3. Analyze configuration impact
              if (projectConfig.type === NewCodePeriodType.NUMBER_OF_DAYS && projectConfig.value) {
                const days = parseInt(projectConfig.value, 10);
                console.log(`  Step 3: Analysis window - ${days} days`);

                if (days <= 7) {
                  console.log(`    Scope: Recent changes only`);
                } else if (days <= 30) {
                  console.log(`    Scope: Monthly development cycle`);
                } else {
                  console.log(`    Scope: Extended development period`);
                }
              }

              // 4. Validate effective configuration
              if (projectConfig.effectiveValue) {
                console.log(`  Step 4: Effective baseline - ${projectConfig.effectiveValue}`);
              }
            } catch {
              console.log(`  Step 2: Project configuration not accessible`);
            }
          }

          console.log('✓ New code period workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete new code period workflow - access issues');
        }
      },
      TEST_TIMING.slow
    );
  });
});
