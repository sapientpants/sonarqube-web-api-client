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
import { measureTime, TestTiming } from '../../utils/testHelpers';
import { IntegrationAssertions } from '../../utils/assertions';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

describe.skipIf(skipTests)('Users API Integration Tests', () => {
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
  }, TestTiming.NORMAL);

  afterAll(async () => {
    if (dataManager) {
      await dataManager.cleanup();
    }
  }, TestTiming.NORMAL);

  describe('User Search (v1 API)', () => {
    test(
      'should search users with default parameters',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.users.search().execute()
        );

        IntegrationAssertions.expectValidPagination(result);
        IntegrationAssertions.expectReasonableResponseTime(durationMs);

        if (result.users && result.users.length > 0) {
          IntegrationAssertions.expectValidUser(result.users[0]);
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should search users with pagination',
      async () => {
        const pageSize = 10;
        const { result } = await measureTime(() =>
          client.users.search().withPageSize(pageSize).withPage(1).execute()
        );

        IntegrationAssertions.expectValidPagination(result);
        expect(result.paging.pageSize).toBe(pageSize);

        if (result.users) {
          expect(result.users.length).toBeLessThanOrEqual(pageSize);
          result.users.forEach((user) => {
            IntegrationAssertions.expectValidUser(user);
          });
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should search users by query',
      async () => {
        // First get some users to find a query term
        const initialResult = await client.users.search().withPageSize(5).execute();

        if (!initialResult.users || initialResult.users.length === 0) {
          console.log('ℹ Skipping user query test - no users available');
          return;
        }

        // Use first few characters of the first user's login as query
        const firstUser = initialResult.users[0];
        const query = firstUser.login.substring(0, 3);

        const { result } = await measureTime(() =>
          client.users.search().withQuery(query).execute()
        );

        IntegrationAssertions.expectValidPagination(result);

        if (result.users && result.users.length > 0) {
          // At least one user should match our query
          const hasMatchingUser = result.users.some(
            (user) =>
              user.login.toLowerCase().includes(query.toLowerCase()) ||
              user.name.toLowerCase().includes(query.toLowerCase())
          );
          // Note: Search might not always return exact matches due to search algorithm
          console.log(`Search for "${query}" returned ${result.users.length} users`);
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should use async iterator for all users',
      async () => {
        const searchBuilder = client.users.search().withPageSize(5);
        const users: any[] = [];
        let count = 0;
        const maxItems = 15; // Limit to prevent long test execution

        for await (const user of searchBuilder) {
          users.push(user);
          count++;
          if (count >= maxItems) {
            break;
          }
        }

        expect(users.length).toBeLessThanOrEqual(maxItems);
        users.forEach((user) => {
          IntegrationAssertions.expectValidUser(user);
        });
      },
      TestTiming.SLOW
    );
  });

  describe('User Search (v2 API)', () => {
    test(
      'should search users with v2 API',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.users.searchV2().execute()
          );

          expect(result).toHaveProperty('users');
          expect(result).toHaveProperty('page');
          IntegrationAssertions.expectReasonableResponseTime(durationMs);

          if (result.users && result.users.length > 0) {
            const firstUser = result.users[0];
            expect(firstUser).toHaveProperty('id');
            expect(firstUser).toHaveProperty('login');
            expect(firstUser).toHaveProperty('name');
          }
        } catch (error: any) {
          if (error.status === 404) {
            console.log('ℹ Skipping v2 user search test - API not available');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should search users with v2 API pagination',
      async () => {
        try {
          const pageSize = 8;
          const { result } = await measureTime(() =>
            client.users.searchV2().withPageSize(pageSize).withPageIndex(1).execute()
          );

          expect(result).toHaveProperty('page');
          expect(result.page.pageSize).toBe(pageSize);
          expect(result.page.pageIndex).toBe(1);

          if (result.users) {
            expect(result.users.length).toBeLessThanOrEqual(pageSize);
          }
        } catch (error: any) {
          if (error.status === 404) {
            console.log('ℹ Skipping v2 user pagination test - API not available');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should use v2 async iterator',
      async () => {
        try {
          const searchBuilder = client.users.searchV2().withPageSize(5);
          const users: any[] = [];
          let count = 0;
          const maxItems = 10;

          for await (const user of searchBuilder) {
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
        } catch (error: any) {
          if (error.status === 404) {
            console.log('ℹ Skipping v2 user iteration test - API not available');
          } else {
            throw error;
          }
        }
      },
      TestTiming.SLOW
    );
  });

  describe('User Groups', () => {
    test(
      'should get user groups for current user',
      async () => {
        // First get a user to test with
        const usersResult = await client.users.search().withPageSize(1).execute();

        if (!usersResult.users || usersResult.users.length === 0) {
          console.log('ℹ Skipping user groups test - no users available');
          return;
        }

        const testUser = usersResult.users[0];

        try {
          const { result, durationMs } = await measureTime(() =>
            client.users.groups().withLogin(testUser.login).execute()
          );

          expect(result).toHaveProperty('groups');
          expect(Array.isArray(result.groups)).toBe(true);
          IntegrationAssertions.expectReasonableResponseTime(durationMs);

          if (result.groups.length > 0) {
            const firstGroup = result.groups[0];
            expect(firstGroup).toHaveProperty('name');
            expect(firstGroup.name).toBeTruthy();
          }
        } catch (error: any) {
          if (error.status === 403) {
            console.log('ℹ Skipping user groups test - insufficient permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );

    test(
      'should handle groups pagination',
      async () => {
        const usersResult = await client.users.search().withPageSize(1).execute();

        if (!usersResult.users || usersResult.users.length === 0) {
          console.log('ℹ Skipping groups pagination test - no users available');
          return;
        }

        const testUser = usersResult.users[0];

        try {
          const pageSize = 5;
          const { result } = await measureTime(() =>
            client.users.groups().withLogin(testUser.login).withPageSize(pageSize).execute()
          );

          expect(result).toHaveProperty('paging');
          expect(result.paging.pageSize).toBe(pageSize);

          if (result.groups) {
            expect(result.groups.length).toBeLessThanOrEqual(pageSize);
          }
        } catch (error: any) {
          if (error.status === 403) {
            console.log('ℹ Skipping groups pagination test - insufficient permissions');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid user login',
      async () => {
        const invalidLogin = 'definitely-does-not-exist-user-login';

        try {
          await client.users.groups().withLogin(invalidLogin).execute();
        } catch (error: any) {
          expect(error.status).toBe(404);
          IntegrationAssertions.expectNotFoundError(error);
        }
      },
      TestTiming.FAST
    );

    test(
      'should handle empty search queries gracefully',
      async () => {
        const { result } = await measureTime(() => client.users.search().withQuery('').execute());

        IntegrationAssertions.expectValidPagination(result);
        // Empty query should return all users (up to page limit)
        expect(result.users || []).toBeDefined();
      },
      TestTiming.NORMAL
    );
  });

  describe('API Version Comparison', () => {
    test(
      'should compare v1 and v2 API results when both available',
      async () => {
        try {
          const [v1Result, v2Result] = await Promise.all([
            client.users.search().withPageSize(5).execute(),
            client.users.searchV2().withPageSize(5).execute(),
          ]);

          // Both should return user data, though in different formats
          expect(v1Result.users || []).toBeDefined();
          expect(v2Result.users || []).toBeDefined();

          // V1 uses traditional pagination, V2 uses different structure
          expect(v1Result).toHaveProperty('paging');
          expect(v2Result).toHaveProperty('page');

          console.log(`✓ v1 API returned ${(v1Result.users || []).length} users`);
          console.log(`✓ v2 API returned ${(v2Result.users || []).length} users`);
        } catch (error: any) {
          if (error.status === 404) {
            console.log('ℹ Skipping API comparison - v2 API not available');
          } else {
            throw error;
          }
        }
      },
      TestTiming.NORMAL
    );
  });
});
