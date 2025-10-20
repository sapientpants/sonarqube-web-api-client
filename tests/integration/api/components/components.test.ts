// @ts-nocheck
/**
 * Components API Integration Tests
 *
 * Tests the Components API functionality for project component search and hierarchy navigation.
 * This API provides access to project structure, file trees, and component metadata.
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

(skipTests ? describe.skip : describe)('Components API Integration Tests', () => {
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

    // Get a test project for component operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for component tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Component Search Operations', () => {
    test(
      'should search components with default parameters',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.paging).toBeDefined();
        expect(result.components).toBeDefined();
        expect(Array.isArray(result.components)).toBe(true);

        if (result.components.length > 0) {
          const firstComponent = result.components[0];
          expect(firstComponent.key).toBeDefined();
          expect(firstComponent.name).toBeDefined();
          expect(firstComponent.qualifier).toBeDefined();
          expect(typeof firstComponent.key).toBe('string');
          expect(typeof firstComponent.name).toBe('string');
          expect(typeof firstComponent.qualifier).toBe('string');

          // Common qualifiers: TRK (project), DIR (directory), FIL (file), UTS (unit test file)
          const validQualifiers = ['TRK', 'DIR', 'FIL', 'UTS', 'VW', 'SVW', 'APP'];
          expect(validQualifiers).toContain(firstComponent.qualifier);
        }

        console.log(
          `✓ Found ${result.components.length} components (total: ${result.paging.total})`,
        );
      },
      TEST_TIMING.normal,
    );

    test(
      'should search components with pagination',
      async () => {
        const pageSize = 10;
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().pageSize(pageSize).page(1).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.paging.pageSize).toBe(pageSize);
        expect(result.paging.pageIndex).toBe(1);
        expect(result.components.length).toBeLessThanOrEqual(pageSize);

        if (result.paging.total > pageSize) {
          const { result: secondPage } = await measureTime(async () =>
            client.components.search().pageSize(pageSize).page(2).execute(),
          );

          expect(secondPage.paging.pageIndex).toBe(2);
          expect(secondPage.paging.total).toBe(result.paging.total);

          // Pages should have different results
          if (secondPage.components.length > 0) {
            const firstPageKeys = result.components.map((c) => c.key);
            const secondPageKeys = secondPage.components.map((c) => c.key);
            const hasOverlap = firstPageKeys.some((key) => secondPageKeys.includes(key));
            expect(hasOverlap).toBe(false);
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should filter components by qualifier',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().qualifiers(['TRK']).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        // All returned components should be projects (TRK)
        result.components.forEach((component) => {
          expect(component.qualifier).toBe('TRK');
        });

        if (result.components.length > 0) {
          console.log(`✓ Found ${result.components.length} projects (TRK qualifier)`);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search components by query text',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping query search test - no test project available');
          return;
        }

        const { result, durationMs } = await measureTime(async () =>
          client.components.search().query(testProjectKey).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        // Should find the test project or related components
        if (result.components.length > 0) {
          const foundTestProject = result.components.some(
            (component) =>
              component.key === testProjectKey ||
              component.key.includes(testProjectKey) ||
              component.name.includes(testProjectKey),
          );

          if (foundTestProject) {
            console.log(`✓ Found test project in search results`);
          } else {
            console.log(
              `ℹ Search returned ${result.components.length} components, but test project not directly found`,
            );
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle language filter',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().languages(['java']).pageSize(20).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        console.log(`✓ Found ${result.components.length} Java components`);

        // If there are Java components, they should have proper structure
        result.components.forEach((component) => {
          expect(component.key).toBeDefined();
          expect(component.qualifier).toBeDefined();

          // Files should have language information if available
          if (component.language) {
            expect(component.language).toBe('java');
          }
        });
      },
      TEST_TIMING.normal,
    );
  });

  describe('Component Tree Operations', () => {
    test(
      'should get component tree for a project',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping component tree test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.components.tree(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.paging).toBeDefined();
          expect(result.components).toBeDefined();
          expect(Array.isArray(result.components)).toBe(true);

          if (result.components.length > 0) {
            console.log(`✓ Project tree has ${result.components.length} components`);

            // Validate component structure
            result.components.forEach((component) => {
              expect(component.key).toBeDefined();
              expect(component.name).toBeDefined();
              expect(component.qualifier).toBeDefined();
              expect(component.path).toBeDefined(); // Tree components should have paths
            });

            // Check for different types of components
            const qualifiers = [...new Set(result.components.map((c) => c.qualifier))];
            console.log(`  Component types found: ${qualifiers.join(', ')}`);
          } else {
            console.log('ℹ Project tree is empty (no files analyzed yet)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('ℹ Project not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should get component tree with qualifiers filter',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping qualified tree test - no test project available');
          return;
        }

        try {
          // Get directories only
          const { result, durationMs } = await measureTime(async () =>
            client.components.tree(testProjectKey).qualifiers(['DIR']).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // All components should be directories
          result.components.forEach((component) => {
            expect(component.qualifier).toBe('DIR');
            expect(component.path).toBeDefined();
          });

          console.log(`✓ Found ${result.components.length} directories in project`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('ℹ Project not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should navigate component tree with pagination',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping tree pagination test - no test project available');
          return;
        }

        try {
          const pageSize = 5;
          const { result, durationMs } = await measureTime(async () =>
            client.components.tree(testProjectKey).pageSize(pageSize).page(1).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.paging.pageSize).toBe(pageSize);
          expect(result.components.length).toBeLessThanOrEqual(pageSize);

          if (result.paging.total > pageSize) {
            console.log(`✓ Tree pagination working - ${result.paging.total} total components`);
          } else {
            console.log(`ℹ Small tree - ${result.paging.total} total components`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('ℹ Project not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Component Details', () => {
    test(
      'should show component details',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping component show test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.components.show(testProjectKey),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.component).toBeDefined();
          expect(result.component.key).toBe(testProjectKey);
          expect(result.component.name).toBeDefined();
          expect(result.component.qualifier).toBe('TRK'); // Should be a project

          // Additional fields may be present
          if (result.component.description) {
            expect(typeof result.component.description).toBe('string');
          }

          if (result.component.visibility) {
            expect(['public', 'private']).toContain(result.component.visibility);
          }

          console.log(
            `✓ Component details: ${result.component.name} (${result.component.qualifier})`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('ℹ Component not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should show component with ancestors',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping ancestors test - no test project available');
          return;
        }

        try {
          // First get a file from the project tree
          const treeResult = await client.components
            .tree(testProjectKey)
            .qualifiers(['FIL'])
            .pageSize(1)
            .execute();

          if (treeResult.components.length === 0) {
            console.log('ℹ No files found to test ancestors');
            return;
          }

          const fileComponent = treeResult.components[0];

          const { result, durationMs } = await measureTime(async () =>
            client.components.show(fileComponent.key),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.component).toBeDefined();
          expect(result.component.key).toBe(fileComponent.key);

          if (result.ancestors) {
            expect(Array.isArray(result.ancestors)).toBe(true);
            console.log(`✓ File has ${result.ancestors.length} ancestors`);

            // Ancestors should form a hierarchy
            result.ancestors.forEach((ancestor) => {
              expect(ancestor.key).toBeDefined();
              expect(ancestor.name).toBeDefined();
              expect(ancestor.qualifier).toBeDefined();
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('ℹ Component not found or no browse permission');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Component Search Iteration', () => {
    test(
      'should iterate through components using async iterator',
      async () => {
        const maxComponents = 20; // Limit to avoid long test runs
        let componentCount = 0;
        const components: unknown[] = [];

        const iterator = client.components.search().pageSize(10).all();

        for await (const component of iterator) {
          components.push(component);
          componentCount++;

          if (componentCount >= maxComponents) {
            break;
          }
        }

        expect(Array.isArray(components)).toBe(true);
        expect(components.length).toBeLessThanOrEqual(maxComponents);

        if (components.length > 0) {
          console.log(`✓ Async iterator returned ${components.length} components`);

          // Validate component structure
          components.forEach((component) => {
            expect(component).toHaveProperty('key');
            expect(component).toHaveProperty('name');
            expect(component).toHaveProperty('qualifier');
          });
        } else {
          console.log('ℹ No components found - testing empty response handling');
        }

        console.log(`✓ Iterated through ${components.length} components`);
      },
      TEST_TIMING.normal,
    );

    test(
      'should iterate with filters applied',
      async () => {
        const maxComponents = 10;
        let componentCount = 0;
        const projects: unknown[] = [];

        const iterator = client.components.search().qualifiers(['TRK']).pageSize(5).all();

        for await (const component of iterator) {
          projects.push(component);
          componentCount++;

          if (componentCount >= maxComponents) {
            break;
          }
        }

        // All should be projects
        projects.forEach((component) => {
          expect((component as { qualifier: string }).qualifier).toBe('TRK');
        });

        console.log(`✓ Iterated through ${projects.length} projects`);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should work on both SonarQube and SonarCloud',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().pageSize(5).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.components).toBeDefined();
        expect(Array.isArray(result.components)).toBe(true);

        if (envConfig?.isSonarCloud) {
          console.log(`✓ SonarCloud: Found ${result.components.length} components`);

          // SonarCloud may require organization context for some searches
          if (envConfig.organization && result.components.length === 0) {
            console.log('ℹ Empty results - organization context may be required');
          }
        } else {
          console.log(`✓ SonarQube: Found ${result.components.length} components`);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle organization context for SonarCloud',
      async () => {
        if (!envConfig?.isSonarCloud || !envConfig.organization) {
          console.log('ℹ Skipping organization test - not SonarCloud or no organization');
          return;
        }

        // SonarCloud component searches may benefit from organization context
        // though the API itself doesn't take organization as a direct parameter
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().pageSize(10).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        console.log(`✓ SonarCloud organization context: ${result.components.length} components`);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for component search',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.components.search().pageSize(20).execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 2000, // 2 seconds
          maximum: 8000, // 8 seconds absolute max
        });

        expect(result.components).toBeDefined();
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent component requests',
      async () => {
        const requests = Array(3)
          .fill(null)
          .map(async () => client.components.search().pageSize(5).execute());

        const results = await Promise.all(requests);

        results.forEach((result) => {
          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          expect(result.components).toBeDefined();
        });

        console.log(`✓ ${results.length} concurrent requests completed successfully`);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid component key gracefully',
      async () => {
        try {
          await client.components.show('invalid-component-key-that-does-not-exist');

          // If this succeeds, the API is lenient
          console.log('ℹ API accepts invalid component keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates component keys');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle permission errors for restricted components',
      async () => {
        // Try to access a component that might not exist or require permissions
        try {
          await client.components.tree('restricted-project-key').execute();

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent components');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );
  });
});
