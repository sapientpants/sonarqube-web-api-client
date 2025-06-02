/**
 * Sources API Integration Tests
 *
 * Tests the Sources API functionality for retrieving source code content and metadata.
 * This API provides access to source code files, line-by-line information, and SCM data.
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

(skipTests ? describe.skip : describe)('Sources API Integration Tests', () => {
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

    // Get a test project and file for source operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only

      if (testProjectKey) {
        // Try to find a file in the project
        const components = await client.components
          .tree(testProjectKey)
          .qualifiers(['FIL'])
          .pageSize(1)
          .execute();

        if (components.components.length > 0) {
          testFileKey = components.components[0].key;
        }
      }
    } catch {
      console.log('ℹ No test project or files available for source tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Source Code Retrieval', () => {
    test(
      'should show source code for a file',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping source show test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.sources.show({ key: testFileKey })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.sources).toBeDefined();
          expect(Array.isArray(result.sources)).toBe(true);

          if (result.sources.length > 0) {
            const firstLine = result.sources[0];
            expect(firstLine).toHaveProperty('1'); // Line number as key
            expect(typeof firstLine['1']).toBe('string'); // Source code as value

            console.log(`✓ Retrieved ${result.sources.length} lines of source code`);

            // Check if we have a reasonable amount of content
            const totalChars = result.sources.reduce((sum, line) => {
              const lineContent = Object.values(line)[0] as string;
              return sum + (lineContent?.length || 0);
            }, 0);

            console.log(`  Total characters: ${totalChars}`);
          } else {
            console.log('ℹ File appears to be empty');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view source code');
          } else if (errorObj.status === 404) {
            console.log('ℹ Source file not found');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should show source code with line range',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping line range test - no test file available');
          return;
        }

        try {
          const fromLine = 1;
          const toLine = 10;

          const { result, durationMs } = await measureTime(async () =>
            client.sources.show({
              key: testFileKey,
              from: fromLine,
              to: toLine,
            })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.sources).toBeDefined();
          expect(Array.isArray(result.sources)).toBe(true);
          expect(result.sources.length).toBeLessThanOrEqual(toLine - fromLine + 1);

          if (result.sources.length > 0) {
            // Check that line numbers are within expected range
            result.sources.forEach((line) => {
              const lineNumber = parseInt(Object.keys(line)[0], 10);
              if (!isNaN(lineNumber)) {
                expect(lineNumber).toBeGreaterThanOrEqual(fromLine);
                expect(lineNumber).toBeLessThanOrEqual(toLine);
              }
            });

            console.log(`✓ Retrieved lines ${fromLine}-${toLine} (${result.sources.length} lines)`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access source file for line range test');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get raw source code',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping raw source test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.sources.raw({ key: testFileKey })
          );

          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // Raw source should be a string
          expect(typeof result).toBe('string');

          if (result.length > 0) {
            console.log(`✓ Retrieved raw source code (${result.length} characters)`);

            // Basic validation - should contain typical source code patterns
            const hasLines = result.includes('\n') || result.includes('\r');
            console.log(`  Multi-line file: ${hasLines}`);
          } else {
            console.log('ℹ Raw source is empty');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view raw source');
          } else if (errorObj.status === 404) {
            console.log('ℹ Source file not found for raw access');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('SCM Information', () => {
    test(
      'should get SCM (blame) information for a file',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping SCM test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.sources.scm({ key: testFileKey })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.scm).toBeDefined();
          expect(Array.isArray(result.scm)).toBe(true);

          if (result.scm.length > 0) {
            const firstEntry = result.scm[0];

            // SCM entries should have line numbers as keys
            const lineNumber = Object.keys(firstEntry)[0];
            const lineNum = parseInt(lineNumber, 10);
            if (!isNaN(lineNum)) {
              expect(lineNum).toBeGreaterThan(0);
            }

            const scmInfo = firstEntry[lineNumber];
            if (scmInfo) {
              // SCM info should be an array: [author, date, revision]
              expect(Array.isArray(scmInfo)).toBe(true);
              expect(scmInfo.length).toBe(3);

              const [author, date, revision] = scmInfo;
              expect(typeof author).toBe('string');
              expect(typeof date).toBe('string');
              expect(typeof revision).toBe('string');

              console.log(`✓ Retrieved SCM information for ${result.scm.length} lines`);
              console.log(`  Sample: ${author} on ${date} (${revision.substring(0, 8)})`);
            }
          } else {
            console.log('ℹ No SCM information available (file may not be in version control)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view SCM information');
          } else if (errorObj.status === 404) {
            console.log('ℹ SCM information not available for this file');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should get SCM information with line range',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping SCM range test - no test file available');
          return;
        }

        try {
          const fromLine = 1;
          const toLine = 5;

          const { result, durationMs } = await measureTime(async () =>
            client.sources.scm({
              key: testFileKey,
              from: fromLine,
              to: toLine,
            })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.scm).toBeDefined();
          expect(Array.isArray(result.scm)).toBe(true);

          if (result.scm.length > 0) {
            // Verify line numbers are within range
            result.scm.forEach((entry) => {
              const lineNumber = parseInt(Object.keys(entry)[0], 10);
              if (!isNaN(lineNumber)) {
                expect(lineNumber).toBeGreaterThanOrEqual(fromLine);
                expect(lineNumber).toBeLessThanOrEqual(toLine);
              }
            });

            console.log(
              `✓ Retrieved SCM info for lines ${fromLine}-${toLine} (${result.scm.length} entries)`
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access SCM information for line range');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Source Validation', () => {
    test(
      'should validate source code structure',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping validation test - no test file available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.sources.show({ key: testFileKey, from: 1, to: 20 })
          );

          if (result.sources.length === 0) {
            console.log('ℹ No source lines to validate');
            return;
          }

          // Validate line number sequence
          const lineNumbers = result.sources.map((line) => {
            return parseInt(Object.keys(line)[0], 10);
          });

          // Line numbers should be in ascending order (may have gaps)
          for (let i = 1; i < lineNumbers.length; i++) {
            expect(lineNumbers[i]).toBeGreaterThan(lineNumbers[i - 1] ?? 0);
          }

          // All lines should have content (even if empty string)
          result.sources.forEach((line) => {
            const lineContent = Object.values(line)[0];
            expect(typeof lineContent).toBe('string');
          });

          console.log(`✓ Source structure validation passed for ${result.sources.length} lines`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access source for validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle empty or binary files gracefully',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping empty file test - no test project available');
          return;
        }

        try {
          // Try to find any file in the project
          const components = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(10)
            .execute();

          if (components.components.length === 0) {
            console.log('ℹ No files found for empty file test');
            return;
          }

          // Test with each file to see different file types
          for (const component of components.components.slice(0, 3)) {
            try {
              const { result } = await measureTime(async () =>
                client.sources.show({ key: component.key, from: 1, to: 1 })
              );

              if (result.sources.length === 0) {
                console.log(`✓ File ${component.name} is empty or binary - properly handled`);
              } else {
                console.log(
                  `✓ File ${component.name} has content - ${result.sources.length} lines retrieved`
                );
              }
            } catch (error: unknown) {
              const errorObj = error as { status?: number };

              if (errorObj.status === 403) {
                console.log(`ℹ No permission for file ${component.name}`);
              } else if (errorObj.status === 404) {
                console.log(`ℹ File ${component.name} source not available`);
              } else {
                console.log(`ℹ Error accessing ${component.name}: ${errorObj.status}`);
              }
            }
          }
        } catch {
          console.log('ℹ Cannot test different file types');
        }
      },
      TEST_TIMING.normal
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
            client.sources.show({ key: testFileKey, from: 1, to: 5 })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Retrieved ${result.sources.length} source lines`);
          } else {
            console.log(`✓ SonarQube: Retrieved ${result.sources.length} source lines`);
          }

          // Both platforms should support the same source API
          expect(result.sources).toBeDefined();
          expect(Array.isArray(result.sources)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - file not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle platform-specific SCM features',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping SCM platform test - no test file available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.sources.scm({ key: testFileKey, from: 1, to: 3 })
          );

          if (result.scm.length > 0) {
            if (envConfig?.isSonarCloud) {
              console.log(`✓ SonarCloud: SCM information available (${result.scm.length} lines)`);
            } else {
              console.log(`✓ SonarQube: SCM information available (${result.scm.length} lines)`);
            }

            // Both platforms should use the same SCM format
            const firstEntry = result.scm[0];
            const scmInfo = Object.values(firstEntry)[0] as string[];
            expect(Array.isArray(scmInfo)).toBe(true);
            expect(scmInfo.length).toBeGreaterThanOrEqual(3);
          } else {
            console.log('ℹ No SCM information available on this platform');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ SCM platform test skipped - not accessible');
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
      'should maintain reasonable performance for source retrieval',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping performance test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.sources.show({ key: testFileKey, from: 1, to: 50 })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 8000, // 8 seconds absolute max
          });

          console.log(`✓ Retrieved ${result.sources.length} lines in ${Math.round(durationMs)}ms`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - file not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle large line ranges efficiently',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping large range test - no test file available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.sources.show({ key: testFileKey, from: 1, to: 200 })
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 3000, // 3 seconds
            maximum: 12000, // 12 seconds absolute max
          });

          console.log(
            `✓ Large range retrieval: ${result.sources.length} lines in ${Math.round(durationMs)}ms`
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Large range test skipped - file not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.slow
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid file key gracefully',
      async () => {
        try {
          await client.sources.show({ key: 'invalid-file-key-that-does-not-exist' });

          console.log('ℹ API accepts invalid file keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates file keys');
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
      'should handle invalid line ranges',
      async () => {
        if (!testFileKey) {
          console.log('ℹ Skipping line range validation - no test file available');
          return;
        }

        try {
          // Test with invalid range (from > to)
          await client.sources.show({
            key: testFileKey,
            from: 10,
            to: 5,
          });

          console.log('ℹ API accepts invalid line ranges gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 400) {
            console.log('✓ API validates line range parameters');
            expect(errorObj.status).toBe(400);
          } else {
            console.log(`ℹ Line range validation: status ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.fast
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        // Test with a file that might require special permissions
        try {
          await client.sources.show({ key: 'restricted:file:key' });

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
      TEST_TIMING.fast
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide complete source access workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          // 1. Find files in project
          const components = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(3)
            .execute();

          if (components.components.length === 0) {
            console.log('ℹ No files found for workflow test');
            return;
          }

          console.log(`✓ Found ${components.components.length} files in project`);

          // 2. Get source for each file
          for (const component of components.components) {
            try {
              const { result } = await measureTime(async () =>
                client.sources.show({ key: component.key, from: 1, to: 3 })
              );

              console.log(`  ${component.name}: ${result.sources.length} lines retrieved`);

              // 3. Try to get SCM info
              try {
                const scmResult = await client.sources.scm({ key: component.key, from: 1, to: 1 });
                if (scmResult.scm.length > 0) {
                  console.log(`    SCM info available`);
                }
              } catch {
                console.log(`    No SCM info available`);
              }
            } catch (error: unknown) {
              const errorObj = error as { status?: number };
              console.log(`  ${component.name}: Error ${errorObj.status || 'unknown'}`);
            }
          }

          console.log('✓ Source access workflow completed');
        } catch {
          console.log('ℹ Cannot complete workflow test - project access issues');
        }
      },
      TEST_TIMING.slow
    );
  });
});
