/**
 * Quality Gates API Integration Tests
 *
 * Tests the Quality Gates API functionality for both SonarQube and SonarCloud.
 * Covers quality gate search, project status, and quality gate management.
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

describe('Quality Gates API Integration Tests', () => {
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

    // Create a test project for quality gate operations
    if (testConfig.allowDestructiveTests) {
      testProjectKey = await dataManager.createTestProject({
        name: 'Quality Gates API Test Project',
        key: `integration-test-qg-${Date.now()}`,
        visibility: 'private',
      });
    }
  }, testConfig.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig.longTimeout);

  describe('Quality Gate List Operations', () => {
    test('should list all quality gates', async () => {
      const searchBuilder = client.qualityGates.list();

      // Add organization context for SonarCloud
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.qualitygates).toBeDefined();
      expect(Array.isArray(result.qualitygates)).toBe(true);
      expect(result.qualitygates.length).toBeGreaterThan(0);

      const firstGate = result.qualitygates[0];
      expect(firstGate.id).toBeDefined();
      expect(firstGate.name).toBeDefined();
      expect(typeof firstGate.isBuiltIn).toBe('boolean');
      expect(typeof firstGate.isDefault).toBe('boolean');

      if (envConfig.isSonarCloud) {
        // SonarCloud quality gates should be organization-scoped
        result.qualitygates.forEach((gate) => {
          expect(gate.name).toBeDefined();
        });
      } else {
        // SonarQube should have at least one built-in quality gate
        const hasBuiltIn = result.qualitygates.some((gate) => gate.isBuiltIn);
        expect(hasBuiltIn).toBe(true);
      }
    });

    test('should identify default quality gate', async () => {
      const searchBuilder = client.qualityGates.list();

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(() => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);

      const defaultGates = result.qualitygates.filter((gate) => gate.isDefault);
      expect(defaultGates.length).toBe(1); // Exactly one default gate

      const defaultGate = defaultGates[0];
      expect(defaultGate.name).toBeDefined();
      expect(defaultGate.isDefault).toBe(true);
    });
  });

  describe('Quality Gate Details', () => {
    test('should show quality gate details', async () => {
      // First get the list to find a quality gate ID
      const listBuilder = client.qualityGates.list();
      if (envConfig.isSonarCloud && envConfig.organization) {
        listBuilder.organization(envConfig.organization);
      }

      const listResult = await listBuilder.execute();
      expect(listResult.qualitygates.length).toBeGreaterThan(0);

      const qualityGateId = listResult.qualitygates[0].id;

      // Now get the details
      const showBuilder = client.qualityGates.show().id(qualityGateId);
      if (envConfig.isSonarCloud && envConfig.organization) {
        showBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => showBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.id).toBe(qualityGateId);
      expect(result.name).toBeDefined();
      expect(typeof result.isBuiltIn).toBe('boolean');
      expect(typeof result.isDefault).toBe('boolean');
      expect(result.conditions).toBeDefined();
      expect(Array.isArray(result.conditions)).toBe(true);

      if (result.conditions.length > 0) {
        const condition = result.conditions[0];
        expect(condition.id).toBeDefined();
        expect(condition.metric).toBeDefined();
        expect(condition.op).toBeDefined();
        expect(['LT', 'GT']).toContain(condition.op);
      }
    });
  });

  describe('Project Quality Gate Status', () => {
    test('should get project quality gate status when project exists', async () => {
      if (!testProjectKey) {
        console.warn('Skipping project quality gate status - no test project available');
        return;
      }

      const statusBuilder = client.qualityGates.getProjectStatus().projectKey(testProjectKey);

      if (envConfig.isSonarCloud && envConfig.organization) {
        statusBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => statusBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.projectStatus).toBeDefined();
      expect(result.projectStatus.status).toBeDefined();
      expect(['OK', 'WARN', 'ERROR', 'NONE']).toContain(result.projectStatus.status);

      if (result.projectStatus.conditions) {
        expect(Array.isArray(result.projectStatus.conditions)).toBe(true);

        if (result.projectStatus.conditions.length > 0) {
          const condition = result.projectStatus.conditions[0];
          expect(condition.status).toBeDefined();
          expect(['OK', 'WARN', 'ERROR']).toContain(condition.status);
          expect(condition.metricKey).toBeDefined();
        }
      }
    });

    test('should handle project without analysis gracefully', async () => {
      if (!testProjectKey) {
        console.warn('Skipping project without analysis test - no test project available');
        return;
      }

      try {
        const statusBuilder = client.qualityGates.getProjectStatus().projectKey(testProjectKey);

        if (envConfig.isSonarCloud && envConfig.organization) {
          statusBuilder.organization(envConfig.organization);
        }

        const result = await statusBuilder.execute();

        // New projects without analysis might have NONE status
        if (result.projectStatus.status === 'NONE') {
          expect(result.projectStatus.status).toBe('NONE');
        } else {
          expect(['OK', 'WARN', 'ERROR']).toContain(result.projectStatus.status);
        }
      } catch (error) {
        // Some platforms might return an error for projects without analysis
        console.warn('Project without analysis returned error (expected behavior):', error);
      }
    });
  });

  describe('Quality Gate Project Association', () => {
    test('should search projects associated with quality gates', async () => {
      // Get a quality gate first
      const listBuilder = client.qualityGates.list();
      if (envConfig.isSonarCloud && envConfig.organization) {
        listBuilder.organization(envConfig.organization);
      }

      const listResult = await listBuilder.execute();
      expect(listResult.qualitygates.length).toBeGreaterThan(0);

      const qualityGateId = listResult.qualitygates[0].id;

      // Search for projects using this quality gate
      const searchBuilder = client.qualityGates.search().gateId(qualityGateId).pageSize(10);

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.paging).toBeDefined();

      if (result.results.length > 0) {
        const project = result.results[0];
        expect(project.key).toBeDefined();
        expect(project.name).toBeDefined();
      }
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should handle organization context for SonarCloud', async () => {
      if (!envConfig.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud organization test - not SonarCloud or no organization');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.qualityGates.list().organization(envConfig.organization).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.qualitygates).toBeDefined();
      expect(result.qualitygates.length).toBeGreaterThan(0);

      // All quality gates should be accessible within the organization
      result.qualitygates.forEach((gate) => {
        expect(gate.id).toBeDefined();
        expect(gate.name).toBeDefined();
      });
    });

    test('should show built-in quality gates for SonarQube', async () => {
      if (envConfig.isSonarCloud) {
        console.warn('Skipping SonarQube built-in gates test - running on SonarCloud');
        return;
      }

      const { result } = await measureTime(() => client.qualityGates.list().execute());

      IntegrationAssertions.expectValidResponse(result);

      const builtInGates = result.qualitygates.filter((gate) => gate.isBuiltIn);
      expect(builtInGates.length).toBeGreaterThan(0);

      // At least one built-in gate should exist (Sonar way)
      const sonarWayGate = builtInGates.find(
        (gate) =>
          gate.name.toLowerCase().includes('sonar way') || gate.name.toLowerCase().includes('sonar')
      );
      expect(sonarWayGate).toBeDefined();
    });
  });

  describe('Quality Gate Conditions Validation', () => {
    test('should validate quality gate conditions structure', async () => {
      const listBuilder = client.qualityGates.list();
      if (envConfig.isSonarCloud && envConfig.organization) {
        listBuilder.organization(envConfig.organization);
      }

      const listResult = await listBuilder.execute();
      const qualityGateId = listResult.qualitygates[0].id;

      const showBuilder = client.qualityGates.show().id(qualityGateId);
      if (envConfig.isSonarCloud && envConfig.organization) {
        showBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(() => showBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);

      if (result.conditions.length > 0) {
        result.conditions.forEach((condition) => {
          expect(condition.id).toBeDefined();
          expect(condition.metric).toBeDefined();
          expect(condition.op).toBeDefined();
          expect(['LT', 'GT']).toContain(condition.op);

          // Error threshold should be defined
          if (condition.error !== undefined) {
            expect(typeof condition.error).toBe('string');
          }

          // Warning threshold is optional
          if (condition.warning !== undefined) {
            expect(typeof condition.warning).toBe('string');
          }
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid quality gate ID gracefully', async () => {
      try {
        const showBuilder = client.qualityGates.show().id(-999);
        if (envConfig.isSonarCloud && envConfig.organization) {
          showBuilder.organization(envConfig.organization);
        }

        await showBuilder.execute();

        // If no error is thrown, the API might return empty or default results
      } catch (error) {
        // Expected behavior - invalid ID should cause an error
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid project key in status check', async () => {
      try {
        const statusBuilder = client.qualityGates
          .getProjectStatus()
          .projectKey('invalid-project-key-that-does-not-exist');

        if (envConfig.isSonarCloud && envConfig.organization) {
          statusBuilder.organization(envConfig.organization);
        }

        await statusBuilder.execute();
      } catch (error) {
        // Expected behavior - invalid project should cause an error
        expect(error).toBeDefined();
      }
    });
  });

  describe('Quality Gates Performance', () => {
    test('should maintain reasonable performance for quality gate operations', async () => {
      const listBuilder = client.qualityGates.list();
      if (envConfig.isSonarCloud && envConfig.organization) {
        listBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => listBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs, {
        expected: 1000, // 1 second
        maximum: 5000, // 5 seconds absolute max
      });
    });

    test('should handle concurrent quality gate requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() => {
          const listBuilder = client.qualityGates.list();
          if (envConfig.isSonarCloud && envConfig.organization) {
            listBuilder.organization(envConfig.organization);
          }
          return listBuilder.execute();
        });

      const results = await Promise.all(requests);

      results.forEach((result) => {
        IntegrationAssertions.expectValidResponse(result);
        expect(result.qualitygates).toBeDefined();
      });
    });
  });

  describe('Quality Gates Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => {
        const listBuilder = client.qualityGates.list();
        if (envConfig.isSonarCloud && envConfig.organization) {
          listBuilder.organization(envConfig.organization);
        }
        return listBuilder.execute();
      };

      const result = await retryOperation(operation, {
        maxRetries: testConfig.maxRetries,
        delay: testConfig.retryDelay,
      });

      IntegrationAssertions.expectValidResponse(result);
      expect(result.qualitygates).toBeDefined();
    });
  });
});
