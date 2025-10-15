// @ts-nocheck
/**
 * Users API Integration Tests
 *
 * Tests user search and management operations.
 * These tests are primarily read-only to avoid affecting user data.
 */

import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { measureTime, TEST_TIMING } from '../../utils/testHelpers';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

(skipTests ? describe.skip : describe)('Users API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let envConfig: ReturnType<typeof getIntegrationTestConfig>;
  let testConfig: ReturnType<typeof getTestConfiguration>;

  beforeAll(async () => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('User Search (v1 API)', () => {
    test(
      'should search users with default parameters',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.users.search().execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        if (result.users && result.users.length > 0) {
          INTEGRATION_ASSERTIONS.expectValidUser(result.users[0]);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search users with pagination',
      async () => {
        const pageSize = 10;
        const { result } = await measureTime(async () => {
          const searchBuilder = client.users.search();
          return searchBuilder.pageSize(pageSize).page(1).execute();
        });

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        expect(result.paging.pageSize).toBe(pageSize);

        if (result.users && result.users.length > 0) {
          expect(result.users.length).toBeLessThanOrEqual(pageSize);
          result.users.forEach((user) => {
            INTEGRATION_ASSERTIONS.expectValidUser(user);
          });
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search users by query',
      async () => {
        // First get some users to find a query term
        const initialResult = await client.users.search().pageSize(5).execute();

        if (initialResult.users?.length === 0) {
          console.log('ℹ Skipping user query test - no users available');
          return;
        }

        // Use first few characters of the first user's login as query
        const firstUser = initialResult.users[0];
        const query = firstUser.login.substring(0, 3);

        const { result } = await measureTime(async () => {
          const searchBuilder = client.users.search();
          return searchBuilder.query(query).execute();
        });

        INTEGRATION_ASSERTIONS.expectValidPagination(result);

        if (result.users && result.users.length > 0) {
          // Note: Search might not always return exact matches due to search algorithm
          console.log(`Search for "${query}" returned ${String(result.users.length)} users`);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should use async iterator for all users',
      async () => {
        const searchBuilder = client.users.search().pageSize(5);
        const users: unknown[] = [];
        let count = 0;
        const maxItems = 15; // Limit to prevent long test execution

        for await (const user of searchBuilder.all()) {
          users.push(user);
          count++;
          if (count >= maxItems) {
            break;
          }
        }

        expect(users.length).toBeLessThanOrEqual(maxItems);
        users.forEach((user) => {
          INTEGRATION_ASSERTIONS.expectValidUser(user);
        });
      },
      TEST_TIMING.slow,
    );
  });

  describe('User Search (v2 API)', () => {
    test(
      'should search users with v2 API',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => {
            const searchBuilder = client.users.searchV2();
            return searchBuilder.execute();
          });

          expect(result).toHaveProperty('users');
          expect(result).toHaveProperty('page');
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.users && result.users.length > 0) {
            const firstUser = result.users[0];
            expect(firstUser).toHaveProperty('id');
            expect(firstUser).toHaveProperty('login');
            expect(firstUser).toHaveProperty('name');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log('ℹ Skipping v2 user search test - API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should search users with v2 API pagination',
      async () => {
        try {
          const pageSize = 8;
          const { result } = await measureTime(async () => {
            const searchBuilder = client.users.searchV2();
            return searchBuilder.pageSize(pageSize).page(1).execute();
          });

          expect(result).toHaveProperty('page');
          expect(result.page.pageSize).toBe(pageSize);
          expect(result.page.pageIndex).toBe(1);

          if (result.users && result.users.length > 0) {
            expect(result.users.length).toBeLessThanOrEqual(pageSize);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log('ℹ Skipping v2 user pagination test - API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should use v2 async iterator',
      async () => {
        try {
          const searchBuilder = client.users.searchV2().pageSize(5);
          const users: unknown[] = [];
          let count = 0;
          const maxItems = 10;

          for await (const user of searchBuilder.all()) {
            users.push(user);
            count++;
            if (count >= maxItems) {
              break;
            }
          }

          expect(users.length).toBeLessThanOrEqual(maxItems);
          users.forEach((user) => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('login');
            expect(user).toHaveProperty('name');
          });
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log('ℹ Skipping v2 user iteration test - API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.slow,
    );
  });

  describe('User Groups', () => {
    test(
      'should get user groups for current user',
      async () => {
        // First get a user to test with
        const usersResult = await client.users.search().pageSize(1).execute();

        if (usersResult.users?.length === 0) {
          console.log('ℹ Skipping user groups test - no users available');
          return;
        }

        const testUser = usersResult.users[0];

        try {
          const groupsBuilder = client.users.groups().login(testUser.login);

          // Add organization if available (required for SonarCloud, optional for SonarQube)
          if (envConfig.isSonarCloud && envConfig.organization) {
            groupsBuilder.organization(envConfig.organization);
          } else if (!envConfig.isSonarCloud) {
            // For SonarQube, we might need to skip this test if organization is required
            console.log(
              'ℹ Skipping user groups test - organization parameter required but not available for SonarQube',
            );
            return;
          }

          const { result, durationMs } = await measureTime(async () => groupsBuilder.execute());

          expect(result).toHaveProperty('groups');
          expect(Array.isArray(result.groups)).toBe(true);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.groups.length > 0) {
            const firstGroup = result.groups[0];
            expect(firstGroup).toHaveProperty('name');
            expect(firstGroup.name).toBeTruthy();
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            console.log('ℹ Skipping user groups test - insufficient permissions');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle groups pagination',
      async () => {
        const usersResult = await client.users.search().pageSize(1).execute();

        if (usersResult.users?.length === 0) {
          console.log('ℹ Skipping groups pagination test - no users available');
          return;
        }

        const testUser = usersResult.users[0];

        try {
          const pageSize = 5;
          const groupsBuilder = client.users.groups().login(testUser.login).pageSize(pageSize);

          // Add organization if available (required for SonarCloud, optional for SonarQube)
          if (envConfig.isSonarCloud && envConfig.organization) {
            groupsBuilder.organization(envConfig.organization);
          } else if (!envConfig.isSonarCloud) {
            // For SonarQube, we might need to skip this test if organization is required
            console.log(
              'ℹ Skipping groups pagination test - organization parameter required but not available for SonarQube',
            );
            return;
          }

          const { result } = await measureTime(async () => groupsBuilder.execute());

          expect(result).toHaveProperty('paging');
          expect(result.paging.pageSize).toBe(pageSize);

          if (result.groups && result.groups.length > 0) {
            expect(result.groups.length).toBeLessThanOrEqual(pageSize);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 403) {
            console.log('ℹ Skipping groups pagination test - insufficient permissions');
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
      'should handle invalid user login',
      async () => {
        const invalidLogin = 'definitely-does-not-exist-user-login';

        try {
          const groupsBuilder = client.users.groups().login(invalidLogin);

          // This test requires organization parameter, skip for SonarQube
          if (!envConfig.isSonarCloud) {
            console.log('ℹ Skipping invalid user login test - organization parameter required');
            return;
          }

          if (envConfig.organization) {
            groupsBuilder.organization(envConfig.organization);
          }

          await groupsBuilder.execute();
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          expect(errorObj.status).toBe(404);
          INTEGRATION_ASSERTIONS.expectNotFoundError(errorObj);
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle short search queries gracefully',
      async () => {
        // Use a 2-character query (minimum required length)
        const { result } = await measureTime(async () =>
          client.users.search().query('ad').execute(),
        );

        INTEGRATION_ASSERTIONS.expectValidPagination(result);
        // Short query should return matching users or empty results
        expect(result.users ?? []).toBeDefined();
      },
      TEST_TIMING.normal,
    );
  });

  describe('API Version Comparison', () => {
    test(
      'should compare v1 and v2 API results when both available',
      async () => {
        try {
          const [v1Result, v2Result] = await Promise.all([
            client.users.search().pageSize(5).execute(),
            client.users.searchV2().pageSize(5).execute(),
          ]);

          // Both should return user data, though in different formats
          expect(v1Result.users ?? []).toBeDefined();
          expect(v2Result.users ?? []).toBeDefined();

          // V1 uses traditional pagination, V2 uses different structure
          expect(v1Result).toHaveProperty('paging');
          expect(v2Result).toHaveProperty('page');

          console.log(`✓ v1 API returned ${String((v1Result.users ?? []).length)} users`);
          console.log(`✓ v2 API returned ${String((v2Result.users ?? []).length)} users`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };
          if (errorObj.status === 404) {
            console.log('ℹ Skipping API comparison - v2 API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });
});
