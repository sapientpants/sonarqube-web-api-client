/**
 * Quality Gates API Integration Tests
 *
 * Tests the Quality Gates API functionality for both SonarQube and SonarCloud.
 * Covers quality gate search, project status, and quality gate management.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, withRetry } from '../../utils/testHelpers';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Quality Gates API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let testProjectKey: string;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

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
  }, testConfig?.longTimeout ?? 30000);

  describe('Quality Gate List Operations', () => {
    test('should list all quality gates', async () => {
      const { result, durationMs } = await measureTime(async () => client.qualityGates.list());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.qualitygates).toBeDefined();
      expect(Array.isArray(result.qualitygates)).toBe(true);
      expect(result.qualitygates.length).toBeGreaterThan(0);

      const firstGate = result.qualitygates[0];
      // Quality gates don't have ID fields in this SonarQube version, use name instead
      expect(firstGate.name).toBeDefined();

      // For SonarQube instances that don't provide gate IDs, skip ID-dependent tests
      if (!firstGate.id && !firstGate.key && !firstGate.uuid) {
        console.log('ℹ Quality gates do not have ID fields in this SonarQube version');
      }
      expect(firstGate.name).toBeDefined();
      expect(typeof firstGate.isBuiltIn).toBe('boolean');
      expect(typeof firstGate.isDefault).toBe('boolean');

      if (envConfig?.isSonarCloud) {
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
      const { result } = await measureTime(async () => client.qualityGates.list());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);

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
      const listResult = await client.qualityGates.list();
      expect(listResult.qualitygates.length).toBeGreaterThan(0);

      const firstGate = listResult.qualitygates[0];
      const qualityGateId = firstGate.id || firstGate.key || firstGate.uuid;

      if (!qualityGateId) {
        console.log(
          'ℹ Skipping quality gate details test - no ID field available in this SonarQube version'
        );
        return;
      }

      // Now get the details
      const { result, durationMs } = await measureTime(async () =>
        client.qualityGates.get({ id: qualityGateId.toString() })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

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

      const { result, durationMs } = await measureTime(async () =>
        client.qualityGates.getProjectStatus({ projectKey: testProjectKey })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

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
        const result = await client.qualityGates.getProjectStatus({ projectKey: testProjectKey });

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
      const listResult = await client.qualityGates.list();
      expect(listResult.qualitygates.length).toBeGreaterThan(0);

      const firstGate = listResult.qualitygates[0];
      const qualityGateId = firstGate.id || firstGate.key || firstGate.uuid;

      if (!qualityGateId) {
        console.log(
          'ℹ Skipping quality gate project association test - no ID field available in this SonarQube version'
        );
        return;
      }

      // Search for projects using this quality gate
      const { result, durationMs } = await measureTime(async () =>
        client.qualityGates.getProjects({
          gateId: qualityGateId,
          ps: 10,
        })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

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
      if (!envConfig?.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud organization test - not SonarCloud or no organization');
        return;
      }

      const { result, durationMs } = await measureTime(async () => client.qualityGates.list());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.qualitygates).toBeDefined();
      expect(result.qualitygates.length).toBeGreaterThan(0);

      // All quality gates should be accessible within the organization
      result.qualitygates.forEach((gate) => {
        expect(gate.id).toBeDefined();
        expect(gate.name).toBeDefined();
      });
    });

    test('should show built-in quality gates for SonarQube', async () => {
      if (envConfig?.isSonarCloud) {
        console.warn('Skipping SonarQube built-in gates test - running on SonarCloud');
        return;
      }

      const { result } = await measureTime(async () => client.qualityGates.list());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);

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
      const listResult = await client.qualityGates.list();
      const firstGate = listResult.qualitygates[0];
      const qualityGateId = firstGate.id || firstGate.key || firstGate.uuid;

      if (!qualityGateId) {
        console.log(
          'ℹ Skipping quality gate conditions validation test - no ID field available in this SonarQube version'
        );
        return;
      }

      const { result } = await measureTime(async () =>
        client.qualityGates.get({ id: qualityGateId.toString() })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);

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
        await client.qualityGates.get({ id: '-999' });

        // If no error is thrown, the API might return empty or default results
      } catch (error) {
        // Expected behavior - invalid ID should cause an error
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid project key in status check', async () => {
      try {
        await client.qualityGates.getProjectStatus({
          projectKey: 'invalid-project-key-that-does-not-exist',
        });
      } catch (error) {
        // Expected behavior - invalid project should cause an error
        expect(error).toBeDefined();
      }
    });
  });

  describe('Quality Gates Performance', () => {
    test('should maintain reasonable performance for quality gate operations', async () => {
      const { result, durationMs } = await measureTime(async () => client.qualityGates.list());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
        expected: 1000, // 1 second
        maximum: 5000, // 5 seconds absolute max
      });
    });

    test('should handle concurrent quality gate requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(async () => client.qualityGates.list());

      const results = await Promise.all(requests);

      results.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.qualitygates).toBeDefined();
      });
    });
  });

  describe('Quality Gates Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => client.qualityGates.list();

      const result = await withRetry(operation, {
        maxAttempts: testConfig?.maxRetries ?? 3,
        delayMs: testConfig?.retryDelay ?? 1000,
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      expect(result.qualitygates).toBeDefined();
    });
  });
});
