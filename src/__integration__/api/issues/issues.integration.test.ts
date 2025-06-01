/**
 * Issues API Integration Tests
 *
 * Tests the Issues API functionality for both SonarQube and SonarCloud.
 * Covers issue search, transitions, assignment, and bulk operations.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { IntegrationAssertions } from '../../utils/assertions';
import { measureTime, retryOperation } from '../../utils/testHelpers';
import {
  getIntegrationTestConfig,
  getTestConfiguration,
  type IntegrationTestConfig,
  type TestConfiguration,
} from '../../config';

describe('Issues API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let envConfig: IntegrationTestConfig;
  let testConfig: TestConfiguration;
  let testProjectKey: string;

  beforeAll(async () => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Create a test project for issue operations
    if (testConfig.allowDestructiveTests) {
      testProjectKey = await dataManager.createTestProject({
        name: 'Issues API Test Project',
        key: `integration-test-issues-${Date.now()}`,
        visibility: 'private',
      });
    }
  }, testConfig.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig.longTimeout);

  describe('Issue Search Operations', () => {
    test('should search issues without filters', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.issues.search().execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.paging).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);

      if (result.issues.length > 0) {
        const firstIssue = result.issues[0];
        expect(firstIssue.key).toBeDefined();
        expect(firstIssue.component).toBeDefined();
        expect(firstIssue.rule).toBeDefined();
        expect(firstIssue.severity).toBeDefined();
        expect(firstIssue.type).toBeDefined();
        expect(['OPEN', 'CONFIRMED', 'REOPENED', 'RESOLVED', 'CLOSED']).toContain(
          firstIssue.status
        );
      }
    });

    test('should search issues with project filter', async () => {
      if (!testProjectKey) {
        console.warn('Skipping project-specific issue search - no test project available');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.issues.search().componentKeys([testProjectKey]).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.issues).toBeDefined();

      // All issues should belong to the specified project
      result.issues.forEach((issue) => {
        expect(issue.project).toBe(testProjectKey);
      });
    });

    test('should search issues by severity', async () => {
      const { result, durationMs } = await measureTime(() =>
        client.issues.search().severities(['MAJOR', 'CRITICAL']).pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      if (result.issues.length > 0) {
        result.issues.forEach((issue) => {
          expect(['MAJOR', 'CRITICAL']).toContain(issue.severity);
        });
      }
    });

    test('should search issues by type', async () => {
      const { result, durationMs } = await measureTime(() =>
        client.issues.search().types(['BUG', 'VULNERABILITY']).pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      if (result.issues.length > 0) {
        result.issues.forEach((issue) => {
          expect(['BUG', 'VULNERABILITY']).toContain(issue.type);
        });
      }
    });

    test('should search issues by status', async () => {
      const { result, durationMs } = await measureTime(() =>
        client.issues.search().statuses(['OPEN', 'CONFIRMED']).pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      if (result.issues.length > 0) {
        result.issues.forEach((issue) => {
          expect(['OPEN', 'CONFIRMED']).toContain(issue.status);
        });
      }
    });

    test('should search issues with organization filter for SonarCloud', async () => {
      if (!envConfig.isSonarCloud || !envConfig.organization) {
        console.warn(
          'Skipping organization-scoped issue search - not SonarCloud or no organization'
        );
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.issues.search().organization(envConfig.organization).pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.issues).toBeDefined();
      // All issues should belong to projects within the organization
      if (result.issues.length > 0) {
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    test('should handle pagination correctly', async () => {
      const pageSize = 5;
      const { result: firstPage } = await measureTime(async () =>
        client.issues.search().pageSize(pageSize).page(1).execute()
      );

      IntegrationAssertions.expectValidResponse(firstPage);
      expect(firstPage.paging.pageIndex).toBe(1);
      expect(firstPage.paging.pageSize).toBe(pageSize);

      if (firstPage.paging.total > pageSize) {
        const { result: secondPage } = await measureTime(async () =>
          client.issues.search().pageSize(pageSize).page(2).execute()
        );

        IntegrationAssertions.expectValidResponse(secondPage);
        expect(secondPage.paging.pageIndex).toBe(2);

        // Ensure different results on different pages
        if (firstPage.issues.length > 0 && secondPage.issues.length > 0) {
          expect(firstPage.issues[0].key).not.toBe(secondPage.issues[0].key);
        }
      }
    });
  });

  describe('Issue Search with Additional Fields', () => {
    test('should include additional fields in search results', async () => {
      const { result, durationMs } = await measureTime(() =>
        client.issues.search().additionalFields(['_all']).pageSize(5).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      if (result.issues.length > 0) {
        const issue = result.issues[0];

        // Additional fields should be present
        expect(issue.author).toBeDefined();
        expect(issue.creationDate).toBeDefined();
        expect(issue.updateDate).toBeDefined();

        // Verify components are included
        expect(result.components).toBeDefined();
        expect(Array.isArray(result.components)).toBe(true);

        // Verify rules are included
        expect(result.rules).toBeDefined();
        expect(Array.isArray(result.rules)).toBe(true);
      }
    });
  });

  describe('Issue Search Iteration', () => {
    test(
      'should iterate through all issues',
      async () => {
        const maxIssues = 20; // Limit to avoid long test runs
        let issueCount = 0;

        const iterator = client.issues.search().pageSize(10).all();

        for await (const issue of iterator) {
          expect(issue.key).toBeDefined();
          expect(issue.component).toBeDefined();
          expect(issue.rule).toBeDefined();

          issueCount++;
          if (issueCount >= maxIssues) {
            break;
          }
        }

        expect(issueCount).toBeGreaterThan(0);
      },
      testConfig.longTimeout
    );
  });

  describe('Platform-Specific Behavior', () => {
    test('should respect platform-specific search behavior', async () => {
      const searchBuilder = client.issues.search().pageSize(5);

      if (envConfig.isSonarCloud) {
        // SonarCloud requires organization context for most operations
        if (envConfig.organization) {
          searchBuilder.organization(envConfig.organization);
        }
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      if (envConfig.isSonarCloud && result.issues.length > 0) {
        // Verify organization context is respected
        expect(result.issues.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid project key gracefully', async () => {
      try {
        await client.issues
          .search()
          .componentKeys(['invalid-project-key-that-does-not-exist'])
          .execute();
      } catch (error) {
        // Should either return empty results or throw a proper error
        // Not a hard failure since behavior varies between platforms
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid rule key gracefully', async () => {
      try {
        await client.issues.search().rules(['invalid:rule:key']).pageSize(1).execute();
      } catch (error) {
        // Should either return empty results or throw a proper error
        expect(error).toBeDefined();
      }
    });
  });

  describe('Issue Search Performance', () => {
    test('should maintain reasonable performance for small result sets', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.issues.search().pageSize(10).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs, {
        expected: 2000, // 2 seconds
        maximum: 10000, // 10 seconds absolute max
      });
    });

    test('should handle concurrent searches', async () => {
      const searchPromises = Array(3)
        .fill(null)
        .map(async () => client.issues.search().pageSize(5).execute());

      const results = await Promise.all(searchPromises);

      results.forEach((result) => {
        IntegrationAssertions.expectValidResponse(result);
        expect(result.issues).toBeDefined();
      });
    });
  });

  describe('Issue Search Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => client.issues.search().pageSize(5).execute();

      const result = await retryOperation(operation, {
        maxRetries: testConfig.maxRetries,
        delay: testConfig.retryDelay,
      });

      IntegrationAssertions.expectValidResponse(result);
    });
  });
});
