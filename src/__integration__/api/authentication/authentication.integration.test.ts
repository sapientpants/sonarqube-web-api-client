/**
 * Authentication API Integration Tests
 *
 * Tests the Authentication API functionality for both SonarQube and SonarCloud.
 * Covers token validation, user authentication status, and login validation.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, withRetry } from '../../utils/testHelpers';
import {
  getIntegrationTestConfig,
  canRunIntegrationTests,
  type IntegrationTestConfig as _IntegrationTestConfig,
} from '../../config/environment';
import {
  getTestConfiguration,
  type TestConfiguration as _TestConfiguration,
} from '../../config/testConfig';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Authentication API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();
  }, testConfig?.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig?.longTimeout ?? 30000);

  describe('Token Validation', () => {
    test('should validate current authentication token', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.valid).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(result.valid).toBe(true); // Should be true since we're using a valid token
    });

    test('should provide token validation details', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.valid).toBe(true);

      // Additional information that might be provided
      if (result.name) {
        expect(typeof result.name).toBe('string');
      }

      if (result.login) {
        expect(typeof result.login).toBe('string');
      }
    });

    test('should maintain consistent validation results', async () => {
      // Run multiple validations to ensure consistency
      const validations = await Promise.all([
        client.authentication.validate(),
        client.authentication.validate(),
        client.authentication.validate(),
      ]);

      validations.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.valid).toBe(true);
      });

      // All validations should have the same result
      const firstResult = validations[0];
      validations.slice(1).forEach((result) => {
        expect(result.valid).toBe(firstResult.valid);
        if (firstResult.name) {
          expect(result.name).toBe(firstResult.name);
        }
        if (firstResult.login) {
          expect(result.login).toBe(firstResult.login);
        }
      });
    });
  });

  describe('Authentication Context', () => {
    test('should work with current authentication context', async () => {
      // Test that the client can make authenticated requests
      const { result: systemPing } = await measureTime(async () => client.system.ping());

      expect(systemPing).toBe('pong');

      // Test authentication validation in this context
      const { result: authResult } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(authResult);
      expect(authResult.valid).toBe(true);
    });

    test('should maintain authentication across multiple API calls', async () => {
      // Make several different API calls to ensure token works consistently
      const apiCalls: Array<() => Promise<unknown>> = [
        async (): Promise<unknown> => client.authentication.validate(),
        async (): Promise<unknown> => client.system.ping(),
      ];

      // Add organization-aware calls for SonarCloud
      if (envConfig?.isSonarCloud && envConfig.organization) {
        apiCalls.push(
          async (): Promise<unknown> =>
            client.projects.search().organization(envConfig.organization).pageSize(1).execute()
        );
      } else {
        apiCalls.push(async (): Promise<unknown> => client.projects.search().pageSize(1).execute());
      }

      const results = await Promise.all(apiCalls.map(async (call) => call()));

      // All calls should succeed (no authentication errors)
      expect(results.length).toBe(apiCalls.length);

      // Validation should still return true
      const validationResult = results[0] as { valid: boolean };
      expect(validationResult.valid).toBe(true);

      // Ping should return 'pong'
      expect(results[1]).toBe('pong');

      // Projects search should return valid structure
      const projectsResult = results[2] as { components: unknown[] };
      expect(projectsResult.components).toBeDefined();
    });
  });

  describe('Platform-Specific Authentication', () => {
    test('should handle SonarCloud authentication with organization context', async () => {
      if (!envConfig?.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud authentication test - not SonarCloud or no organization');
        return;
      }

      // Validate authentication works with organization-scoped operations
      const { result: authResult, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(authResult);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);
      expect(authResult.valid).toBe(true);

      // Test organization-specific API call
      const projectsBuilder = client.projects
        .search()
        .organization(envConfig.organization)
        .pageSize(5);

      const { result: projectsResult } = await measureTime(() => projectsBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(projectsResult);
      expect(projectsResult.components).toBeDefined();
    });

    test('should handle SonarQube authentication for global access', async () => {
      if (envConfig?.isSonarCloud) {
        console.warn('Skipping SonarQube authentication test - running on SonarCloud');
        return;
      }

      // Validate authentication works for global operations
      const { result: authResult, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(authResult);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);
      expect(authResult.valid).toBe(true);

      // Test global API call (no organization needed)
      const { result: projectsResult } = await measureTime(async () =>
        client.projects.search().pageSize(5).execute()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(projectsResult);
      expect(projectsResult.components).toBeDefined();
    });
  });

  describe('Authentication Error Scenarios', () => {
    test('should handle authentication gracefully when token is present', async () => {
      // Since we're using a valid token, this test verifies the authentication works
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.valid).toBe(true);
    });

    test('should handle rate limiting on authentication endpoints', async () => {
      // Make multiple rapid authentication requests to test rate limiting behavior
      const promises = Array(5)
        .fill(null)
        .map(async () => client.authentication.validate());

      const results = await Promise.all(promises);

      // All should succeed with valid authentication
      results.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Authentication Performance', () => {
    test('should maintain reasonable performance for authentication validation', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
        expected: 500, // 0.5 seconds
        maximum: 3000, // 3 seconds absolute max
      });

      expect(result.valid).toBe(true);
    });

    test('should handle concurrent authentication validations', async () => {
      const concurrentValidations = Array(5)
        .fill(null)
        .map(async () => client.authentication.validate());

      const results = await Promise.all(concurrentValidations);

      results.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.valid).toBe(true);
      });

      // All results should be consistent
      const firstResult = results[0];
      results.slice(1).forEach((result) => {
        expect(result.valid).toBe(firstResult.valid);
        if (firstResult.name) {
          expect(result.name).toBe(firstResult.name);
        }
      });
    });
  });

  describe('Authentication Token Types', () => {
    test('should work with current token type', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.valid).toBe(true);

      // The token should allow basic API access
      const { result: systemStatus } = await measureTime(async () => client.system.ping());

      expect(systemStatus).toBe('pong');
    });

    test('should provide appropriate permissions for token type', async () => {
      // Test various operations to understand token permissions
      const operations: Array<{
        name: string;
        operation: () => Promise<unknown>;
        required: boolean;
      }> = [
        {
          name: 'System Ping',
          operation: async (): Promise<unknown> => client.system.ping(),
          required: true,
        },
        {
          name: 'Authentication Validation',
          operation: async (): Promise<unknown> => client.authentication.validate(),
          required: true,
        },
      ];

      // Add platform-specific operations
      if (envConfig?.isSonarCloud && envConfig.organization) {
        operations.push({
          name: 'Projects Search (SonarCloud)',
          operation: async (): Promise<unknown> =>
            client.projects.search().organization(envConfig.organization).pageSize(1).execute(),
          required: false,
        });
      } else {
        operations.push({
          name: 'Projects Search (SonarQube)',
          operation: async (): Promise<unknown> => client.projects.search().pageSize(1).execute(),
          required: false,
        });
      }

      for (const op of operations) {
        try {
          const result = await op.operation();
          expect(result).toBeDefined();

          if (op.name === 'Authentication Validation') {
            expect((result as { valid: boolean }).valid).toBe(true);
          }
        } catch (error) {
          if (op.required) {
            throw new Error(`Required operation ${op.name} failed: ${error}`);
          } else {
            console.warn(
              `Optional operation ${op.name} failed (may be permission-related):`,
              error
            );
          }
        }
      }
    });
  });

  describe('Authentication Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => client.authentication.validate();

      const result = await withRetry(operation, {
        maxAttempts: testConfig?.maxRetries ?? 3,
        delayMs: testConfig?.retryDelay ?? 1000,
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      expect(result.valid).toBe(true);
    });

    test('should maintain authentication state across retries', async () => {
      // Simulate a scenario where we need to retry authentication validation
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const { result } = await measureTime(async () => client.authentication.validate());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.valid).toBe(true);

        attempts++;

        // Small delay between attempts
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    });
  });

  describe('Authentication Response Structure', () => {
    test('should return properly structured authentication response', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.authentication.validate()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      // Required fields
      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
      expect(result.valid).toBe(true);

      // Optional fields that might be present
      if ('name' in result) {
        expect(typeof result.name).toBe('string');
      }

      if ('login' in result) {
        expect(typeof result.login).toBe('string');
      }

      // Should not contain sensitive information
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('secret');
    });
  });
});
