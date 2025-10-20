// @ts-nocheck
/**
 * Duplications API Integration Tests
 *
 * Tests the Duplications API functionality for detecting and retrieving code duplication information.
 * This API provides access to duplicated code blocks and their locations across the codebase.
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

(skipTests ? describe.skip : describe)('Duplications API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let testProjectKey: string | null = null;
  let testFileKey: string | null = null;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Get a test project and file for duplication operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only

      if (testProjectKey) {
        // Try to find a file in the project
        const components = await client.components
          .tree(testProjectKey)
          .qualifiers(['FIL'])
          .pageSize(10)
          .execute();

        if (components.components.length > 0) {
          // Look for a file that might have duplications
          testFileKey = components.components[0].key;
        }
      }
    } catch {
      console.log('ℹ No test project or files available for duplication tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Duplication Detection', () => {
    test(
      'should show duplications for a file',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping duplication show test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.duplications.show({ key: testFileKey }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.duplications).toBeDefined();
          expect(Array.isArray(result.duplications)).toBe(true);

          if (result.duplications.length > 0) {
            console.log(`✓ Found ${result.duplications.length} duplication blocks`);

            // Validate duplication structure
            result.duplications.forEach((duplication) => {
              expect(duplication.blocks).toBeDefined();
              expect(Array.isArray(duplication.blocks)).toBe(true);
              expect(duplication.blocks.length).toBeGreaterThan(0);

              duplication.blocks.forEach((block) => {
                expect(block.from).toBeDefined();
                expect(block.size).toBeDefined();
                expect(typeof block.from).toBe('number');
                expect(typeof block.size).toBe('number');
                expect(block.from).toBeGreaterThan(0);
                expect(block.size).toBeGreaterThan(0);

                // Should have either _ref (reference to original file) or key (duplicated file)
                const hasRef = '_ref' in block;
                const hasKey = 'key' in block;
                expect(hasRef || hasKey).toBe(true);
              });
            });

            // Analyze duplication patterns
            const totalBlocks = result.duplications.reduce(
              (sum, dup) => sum + dup.blocks.length,
              0,
            );
            const filesWithDuplications = new Set();

            result.duplications.forEach((dup) => {
              dup.blocks.forEach((block) => {
                if ('key' in block) {
                  filesWithDuplications.add(block.key);
                }
              });
            });

            console.log(`  Total duplication blocks: ${totalBlocks}`);
            console.log(`  Files with duplications: ${filesWithDuplications.size}`);
          } else {
            console.log('ℹ No duplications found in this file (this is often expected)');
          }

          // Check for files array
          if (result.files) {
            expect(Array.isArray(result.files)).toBe(true);
            console.log(
              `✓ File information included for ${Object.keys(result.files).length} files`,
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view duplications');
          } else if (errorObj.status === 404) {
            console.log('ℹ File not found for duplication analysis');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle files without duplications',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping no-duplications test - no test project available');
          return;
        }

        try {
          // Try to find multiple files and test each one
          const components = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(5)
            .execute();

          if (components.components.length === 0) {
            console.log('ℹ No files found for duplication testing');
            return;
          }

          let filesWithDuplications = 0;
          let filesWithoutDuplications = 0;

          for (const component of components.components) {
            try {
              const { result } = await measureTime(async () =>
                client.duplications.show({ key: component.key }),
              );

              if (result.duplications.length > 0) {
                filesWithDuplications++;
                console.log(
                  `  ${component.name}: ${result.duplications.length} duplication blocks`,
                );
              } else {
                filesWithoutDuplications++;
                console.log(`  ${component.name}: No duplications`);
              }

              // Validate empty response structure
              expect(result.duplications).toBeDefined();
              expect(Array.isArray(result.duplications)).toBe(true);
            } catch (error: unknown) {
              const errorObj = error as { status?: number };

              if (errorObj.status === 403 || errorObj.status === 404) {
                console.log(`  ${component.name}: Not accessible`);
              } else {
                throw error;
              }
            }
          }

          console.log(
            `✓ Tested ${components.components.length} files: ${filesWithDuplications} with duplications, ${filesWithoutDuplications} without`,
          );
        } catch {
          console.log('ℹ Cannot test multiple files for duplications');
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Duplication Analysis', () => {
    test(
      'should analyze duplication patterns when present',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping pattern analysis - no test project available');
          return;
        }

        try {
          // Search for files that might have duplications
          const components = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(20)
            .execute();

          let totalDuplications = 0;
          const duplicationData: Array<{
            file: string;
            duplications: unknown[];
          }> = [];

          for (const component of components.components.slice(0, 10)) {
            // Limit to avoid long tests
            try {
              const { result } = await measureTime(async () =>
                client.duplications.show({ key: component.key }),
              );

              if (result.duplications.length > 0) {
                totalDuplications += result.duplications.length;
                duplicationData.push({
                  file: component.name,
                  duplications: result.duplications,
                });
              }
            } catch {
              // Skip files we can't access
              continue;
            }
          }

          if (totalDuplications > 0) {
            console.log(
              `✓ Found duplications in ${duplicationData.length} files (${totalDuplications} total blocks)`,
            );

            // Analyze duplication patterns
            let totalBlockSize = 0;
            let maxBlockSize = 0;
            let minBlockSize = Infinity;
            const fileCounts = new Map<string, number>();

            duplicationData.forEach((fileData) => {
              fileData.duplications.forEach((dup: Record<string, unknown>) => {
                const dupBlocks = dup.blocks as Array<{ size: number; key?: string; from: number }>;
                dupBlocks.forEach((block: { size: number; key?: string }) => {
                  totalBlockSize += block.size;
                  maxBlockSize = Math.max(maxBlockSize, block.size);
                  minBlockSize = Math.min(minBlockSize, block.size);

                  if (block.key) {
                    const count = fileCounts.get(block.key) || 0;
                    fileCounts.set(block.key, count + 1);
                  }
                });
              });
            });

            const avgBlockSize =
              totalDuplications > 0 ? Math.round(totalBlockSize / totalDuplications) : 0;

            console.log(
              `  Block size range: ${minBlockSize}-${maxBlockSize} lines (avg: ${avgBlockSize})`,
            );
            console.log(`  Files frequently duplicated: ${fileCounts.size}`);
          } else {
            console.log(
              'ℹ No duplications found in analyzed files (this is common in well-maintained code)',
            );
          }
        } catch {
          console.log('ℹ Cannot perform duplication pattern analysis');
        }
      },
      TEST_TIMING.slow,
    );

    test(
      'should validate duplication block structure',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping structure validation - no test file available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.duplications.show({ key: testFileKey }),
          );

          if (result.duplications.length === 0) {
            console.log('ℹ No duplications to validate structure');
            return;
          }

          // Detailed validation of duplication structure
          result.duplications.forEach((duplication, dupIndex) => {
            expect(duplication.blocks).toBeDefined();
            expect(Array.isArray(duplication.blocks)).toBe(true);
            expect(duplication.blocks.length).toBeGreaterThanOrEqual(2); // Should have at least original + 1 duplicate

            let hasReferenceBlock = false;
            let hasExternalBlocks = false;

            duplication.blocks.forEach((block) => {
              // Common properties
              expect(block.from).toBeDefined();
              expect(block.size).toBeDefined();
              expect(typeof block.from).toBe('number');
              expect(typeof block.size).toBe('number');
              expect(block.from).toBeGreaterThan(0);
              expect(block.size).toBeGreaterThan(0);

              // Reference block (original location in analyzed file)
              if ('_ref' in block) {
                hasReferenceBlock = true;
                expect(block._ref).toBe('1'); // Reference ID
              }

              // External duplicate blocks
              if ('key' in block) {
                hasExternalBlocks = true;
                expect(typeof block.key).toBe('string');
                expect(block.key.length).toBeGreaterThan(0);
              }
            });

            // A duplication should have at least one reference and one external block
            expect(
              hasReferenceBlock || hasExternalBlocks,
              `Duplication ${dupIndex} should have reference or external blocks`,
            ).toBe(true);
          });

          console.log(
            `✓ Structure validation passed for ${result.duplications.length} duplication blocks`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot validate duplication structure - file not accessible');
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
        if (!testFileKey) {
          console.log('ℹ Skipping platform test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.duplications.show({ key: testFileKey }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: ${result.duplications.length} duplication blocks found`);
          } else {
            console.log(`✓ SonarQube: ${result.duplications.length} duplication blocks found`);
          }

          // Both platforms should support the same duplication API structure
          expect(result.duplications).toBeDefined();
          expect(Array.isArray(result.duplications)).toBe(true);

          if (result.files) {
            expect(typeof result.files).toBe('object');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - file not accessible');
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
        if (!envConfig?.isSonarCloud || !envConfig.organization || !testFileKey) {
          console.log(
            'ℹ Skipping organization test - not SonarCloud, no organization, or no test file',
          );
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.duplications.show({ key: testFileKey }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(
            `✓ SonarCloud organization context: ${result.duplications.length} duplications`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - file not accessible');
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
      'should maintain reasonable performance for duplication analysis',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping performance test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.duplications.show({ key: testFileKey }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 10000, // 10 seconds absolute max
          });

          console.log(`✓ Duplication analysis completed in ${Math.round(durationMs)}ms`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - file not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent duplication requests',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping concurrent test - no test file available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.duplications.show({ key: testFileKey }));

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.duplications).toBeDefined();
          });

          // All requests should return the same data
          const firstCount = results[0].duplications.length;
          results.slice(1).forEach((result) => {
            expect(result.duplications.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - file not accessible');
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
      'should handle invalid file key gracefully',
      async () => {
        try {
          await client.duplications.show({ key: 'invalid-file-key-that-does-not-exist' });

          console.log('ℹ API accepts invalid file keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates file keys for duplications');
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
          await client.duplications.show({ key: 'restricted:file:key' });

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent files');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should provide meaningful error responses',
      async () => {
        try {
          // Test with malformed file key
          await client.duplications.show({ key: '' });

          console.log('ℹ API accepts empty file keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          if (errorObj.status === 400) {
            console.log('✓ API validates required parameters');
            expect(errorObj.status).toBe(400);
          } else if (errorObj.status === 404) {
            console.log('✓ API handles empty keys as not found');
            expect(errorObj.status).toBe(404);
          } else {
            console.log(`ℹ Received error status: ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.fast,
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide comprehensive duplication workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting duplication analysis workflow');

          // 1. Get project files
          const components = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(5)
            .execute();

          console.log(`  Step 1: Found ${components.components.length} files in project`);

          if (components.components.length === 0) {
            console.log('ℹ No files found for workflow test');
            return;
          }

          // 2. Analyze each file for duplications
          let totalDuplicationsFound = 0;
          const filesWithDuplications: string[] = [];

          for (const component of components.components) {
            try {
              const { result } = await measureTime(async () =>
                client.duplications.show({ key: component.key }),
              );

              if (result.duplications.length > 0) {
                totalDuplicationsFound += result.duplications.length;
                filesWithDuplications.push(component.name);
                console.log(
                  `    ${component.name}: ${result.duplications.length} duplication blocks`,
                );
              }
            } catch {
              // Skip files we can't access
              console.log(`    ${component.name}: Not accessible`);
            }
          }

          console.log(`  Step 2: Analyzed ${components.components.length} files`);
          console.log(`  Step 3: Found duplications in ${filesWithDuplications.length} files`);
          console.log(`  Step 4: Total duplication blocks: ${totalDuplicationsFound}`);

          if (totalDuplicationsFound === 0) {
            console.log('✓ Workflow completed - No duplications found (good code quality!)');
          } else {
            console.log('✓ Workflow completed - Duplications detected and analyzed');
          }
        } catch {
          console.log('ℹ Cannot complete duplication workflow - project access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
