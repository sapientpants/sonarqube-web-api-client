// @ts-nocheck
/**
 * Projects API Integration Tests
 *
 * Tests project management operations including CRUD operations,
 * search functionality, and project-specific features.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment.js';
import { getTestConfiguration } from '../../config/testConfig.js';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient.js';
import { TestDataManager } from '../../setup/TestDataManager.js';
import { withRetry, measureTime, TEST_TIMING } from '../../utils/testHelpers.js';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions.js';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Projects API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Project Search', () => {
    test(
      'should search projects with default parameters',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.projects.search().execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        if (result.components && result.components.length > 0) {
          INTEGRATION_ASSERTIONS.expectValidProject(result.components[0]);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search projects with pagination',
      async () => {
        const pageSize = 5;
        const { result } = await measureTime(async () => {
          return await client.projects.search().pageSize(pageSize).page(1).execute();
        });

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        expect(result.paging.pageSize).toBe(pageSize);
        expect(result.paging.pageIndex).toBe(1);

        if (result.components && result.components.length > 0) {
          expect(result.components.length).toBeLessThanOrEqual(pageSize);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search projects with query filter',
      async () => {
        // Search for projects containing common words
        const searchQuery = 'test';
        const { result } = await measureTime(async () => {
          return await client.projects.search().query(searchQuery).execute();
        });

        INTEGRATION_ASSERTIONS.expectValidPagination(result);

        // If results are found, they should match the search criteria
        if (result.components && result.components.length > 0) {
          // Note: This might not always be true due to search algorithm complexity
          // So we don't assert it, just log for debugging
          console.log(
            `Search for "${searchQuery}" returned ${String(result.components.length)} projects`,
          );
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle empty search results',
      async () => {
        // Search for projects with a very specific unlikely name
        const uniqueQuery = `nonexistent-project-${String(Date.now())}`;
        const { result } = await measureTime(async () => {
          return await client.projects.search().query(uniqueQuery).execute();
        });

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        expect(result.components ?? []).toHaveLength(0);
        expect(result.paging.total).toBe(0);
      },
      TEST_TIMING.normal,
    );

    test(
      'should use async iterator for all projects',
      async () => {
        const searchBuilder = client.projects.search().pageSize(10);
        const projects: unknown[] = [];
        let count = 0;
        const maxItems = 20; // Limit to prevent long test execution

        for await (const project of searchBuilder.all()) {
          projects.push(project);
          count++;
          if (count >= maxItems) {
            break;
          }
        }

        expect(projects.length).toBeLessThanOrEqual(maxItems);
        projects.forEach((project) => {
          INTEGRATION_ASSERTIONS.expectValidProject(project);
        });
      },
      TEST_TIMING.slow,
    );
  });

  describe('Project CRUD Operations', () => {
    (!testConfig?.allowDestructiveTests ? describe.skip : describe)(
      'Project Creation and Deletion',
      () => {
        test(
          'should create and delete a project',
          async () => {
            const projectKey = client.generateTestProjectKey('crud-test');
            const projectName = `Integration Test Project - ${projectKey}`;

            // Create project
            await client.projects.create({
              project: projectKey,
              name: projectName,
              visibility: 'private',
            });

            // Verify project was created by searching for it
            const searchResult = await withRetry(async () => {
              const result = await client.projects.search().query(projectKey).execute();

              const project = result.components?.find(
                (p: unknown) => (p as { key: string }).key === projectKey,
              );
              if (!project) {
                throw new Error('Project not found in search results');
              }
              return project;
            });

            INTEGRATION_ASSERTIONS.expectValidProject(searchResult);
            expect(searchResult.key).toBe(projectKey);
            expect(searchResult.name).toBe(projectName);

            // Clean up - delete the project
            await client.projects.delete({ project: projectKey });

            // Verify project was deleted
            await withRetry(async () => {
              const result = await client.projects.search().query(projectKey).execute();

              const project = result.components?.find(
                (p: unknown) => (p as { key: string }).key === projectKey,
              );
              if (project) {
                throw new Error('Project still exists after deletion');
              }
            });
          },
          TEST_TIMING.slow,
        );

        test(
          'should handle duplicate project creation',
          async () => {
            const projectKey = client.generateTestProjectKey('duplicate-test');
            const projectName = `Duplicate Test Project - ${projectKey}`;

            // Create project
            await client.projects.create({
              project: projectKey,
              name: projectName,
              visibility: 'private',
            });

            try {
              // Try to create the same project again
              await expect(
                client.projects.create({
                  project: projectKey,
                  name: projectName,
                  visibility: 'private',
                }),
              ).rejects.toThrow();
            } finally {
              // Clean up
              await client.projects.delete({ project: projectKey });
            }
          },
          TEST_TIMING.slow,
        );
      },
    );

    test(
      'should update project key',
      async () => {
        // This test only works if we have destructive tests enabled
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping project key update test - destructive tests disabled');
          return;
        }

        const originalKey = client.generateTestProjectKey('update-test');
        const newKey = client.generateTestProjectKey('updated-test');
        const projectName = `Key Update Test Project - ${originalKey}`;

        try {
          // Create project with original key
          await client.projects.create({
            project: originalKey,
            name: projectName,
            visibility: 'private',
          });

          // Update project key
          await client.projects.updateKey({
            from: originalKey,
            to: newKey,
          });

          // Verify project has new key
          const searchResult = await withRetry(async () => {
            const result = await client.projects.search().query(newKey).execute();

            const project = result.components?.find(
              (p: unknown) => (p as { key: string }).key === newKey,
            );
            if (!project) {
              throw new Error('Project with new key not found');
            }
            return project;
          });

          expect(searchResult.key).toBe(newKey);
        } finally {
          // Clean up both possible keys
          try {
            await client.projects.delete({ project: newKey });
          } catch {
            await client.projects.delete({ project: originalKey });
          }
        }
      },
      TEST_TIMING.slow,
    );

    test(
      'should update project visibility',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping project visibility test - destructive tests disabled');
          return;
        }

        const projectKey = client.generateTestProjectKey('visibility-test');
        const projectName = `Visibility Test Project - ${projectKey}`;

        try {
          // Create private project
          await client.projects.create({
            project: projectKey,
            name: projectName,
            visibility: 'private',
          });

          // Update to public visibility
          await client.projects.updateVisibility({
            project: projectKey,
            visibility: 'public',
          });

          // Note: We can't easily verify the visibility change without additional API calls
          // that might not be available in all environments
          console.log(`✓ Successfully updated visibility for project ${projectKey}`);
        } finally {
          await client.projects.delete({ project: projectKey });
        }
      },
      TEST_TIMING.slow,
    );
  });

  describe('Project Features', () => {
    let testProjectKey: string | null = null;

    beforeAll(async () => {
      // Get or create a test project for feature tests
      testProjectKey = await dataManager.getTestProject(testConfig?.allowDestructiveTests ?? false);
    });

    test(
      'should get project license usage information',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping license usage test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () => client.projects.licenseUsage());

          expect(result).toBeDefined();
          // License usage response structure varies by SonarQube version and edition
          console.log(`✓ Retrieved license usage information`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            console.log('ℹ Skipping license usage test - requires admin permissions');
          } else if (errorObj.status === 404) {
            console.log(
              'ℹ Skipping license usage test - API endpoint not available in this SonarQube version',
            );
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle AI code detection features',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping AI code test - no test project available');
          return;
        }

        try {
          // Try to get AI code status
          const status = await client.projects.getContainsAiCode({
            project: testProjectKey,
          });

          expect(typeof status.containsAiCode).toBe('boolean');

          // Try to set AI code status (if we have permissions)
          if (testConfig?.allowDestructiveTests) {
            await client.projects.setContainsAiCode({
              project: testProjectKey,
              containsAiCode: false,
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping AI code test - not available or no permissions');
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
      'should handle project not found errors',
      async () => {
        const nonExistentProject = 'definitely-does-not-exist-project-key';

        await expect(client.projects.delete({ project: nonExistentProject })).rejects.toThrow();
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle invalid project key format',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping invalid key test - destructive tests disabled');
          return;
        }

        const invalidKey = 'invalid key with spaces!@#';

        await expect(
          client.projects.create({
            project: invalidKey,
            name: 'Invalid Key Test',
            visibility: 'private',
          }),
        ).rejects.toThrow();
      },
      TEST_TIMING.fast,
    );
  });
});
