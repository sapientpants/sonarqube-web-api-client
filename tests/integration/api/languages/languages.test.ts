// @ts-nocheck
/**
 * Languages API Integration Tests
 *
 * Tests the Languages API functionality for retrieving supported programming languages.
 * This is a simple read-only API that works on both SonarQube and SonarCloud.
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

(skipTests ? describe.skip : describe)('Languages API Integration Tests', () => {
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

  describe('Language List Operations', () => {
    test(
      'should list all programming languages',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.languages.list());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.languages).toBeDefined();
        expect(Array.isArray(result.languages)).toBe(true);
        expect(result.languages.length).toBeGreaterThan(0);

        // Validate language structure
        const firstLanguage = result.languages[0];
        expect(firstLanguage.key).toBeDefined();
        expect(typeof firstLanguage.key).toBe('string');
        expect(firstLanguage.name).toBeDefined();
        expect(typeof firstLanguage.name).toBe('string');

        // Common languages should be present
        const languageKeys = result.languages.map((lang) => lang.key);
        expect(languageKeys).toContain('java');
        expect(languageKeys).toContain('js');
      },
      TEST_TIMING.normal,
    );

    test(
      'should list languages with pagination parameters',
      async () => {
        const pageSize = 5;
        const { result, durationMs } = await measureTime(async () =>
          client.languages.list({ ps: pageSize }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.languages).toBeDefined();
        expect(Array.isArray(result.languages)).toBe(true);

        // Should respect page size parameter or return all if total is less
        if (result.languages.length > 0) {
          expect(result.languages.length).toBeLessThanOrEqual(pageSize);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should filter languages with query parameter',
      async () => {
        const searchQuery = 'java';
        const { result, durationMs } = await measureTime(async () =>
          client.languages.list({ q: searchQuery }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.languages).toBeDefined();
        expect(Array.isArray(result.languages)).toBe(true);

        // If results are found, they should match the search criteria
        if (result.languages.length > 0) {
          const hasMatchingLanguage = result.languages.some(
            (lang) =>
              lang.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
              lang.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          expect(hasMatchingLanguage).toBe(true);
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle query with no matches',
      async () => {
        const uniqueQuery = `nonexistent-language-${String(Date.now())}`;
        const { result, durationMs } = await measureTime(async () =>
          client.languages.list({ q: uniqueQuery }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.languages).toBeDefined();
        expect(Array.isArray(result.languages)).toBe(true);
        expect(result.languages).toHaveLength(0);
      },
      TEST_TIMING.normal,
    );

    test(
      'should request all languages at once',
      async () => {
        const { result, durationMs } = await measureTime(async () =>
          client.languages.list({ ps: 0 }),
        );

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        expect(result.languages).toBeDefined();
        expect(Array.isArray(result.languages)).toBe(true);
        expect(result.languages.length).toBeGreaterThan(0);

        // Should include common programming languages
        const languageKeys = result.languages.map((lang) => lang.key);
        const commonLanguages = ['java', 'js', 'ts', 'py', 'cs', 'cpp'];
        const foundCommonLanguages = commonLanguages.filter((lang) => languageKeys.includes(lang));
        expect(foundCommonLanguages.length).toBeGreaterThan(0);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Language Iteration', () => {
    test(
      'should iterate through all languages using async iterator',
      async () => {
        const languages: unknown[] = [];
        let count = 0;
        const maxItems = 50; // Reasonable limit for test

        for await (const language of client.languages.listAll()) {
          languages.push(language);
          count++;
          if (count >= maxItems) {
            break;
          }
        }

        expect(languages.length).toBeGreaterThan(0);
        expect(languages.length).toBeLessThanOrEqual(maxItems);

        // Validate each language structure
        languages.forEach((language) => {
          expect(language).toHaveProperty('key');
          expect(language).toHaveProperty('name');
          expect(typeof (language as { key: string }).key).toBe('string');
          expect(typeof (language as { name: string }).name).toBe('string');
        });
      },
      TEST_TIMING.normal,
    );

    test(
      'should iterate with query filter',
      async () => {
        const searchQuery = 'java';
        const languages: unknown[] = [];

        for await (const language of client.languages.listAll({ q: searchQuery })) {
          languages.push(language);
        }

        // If any languages are found, they should match the search criteria
        if (languages.length > 0) {
          const allMatch = languages.every((lang) => {
            const typedLang = lang as { key: string; name: string };
            return (
              typedLang.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
              typedLang.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          });
          expect(allMatch).toBe(true);
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Language Data Validation', () => {
    test(
      'should return consistent language data structure',
      async () => {
        const { result } = await measureTime(async () => client.languages.list());

        expect(result.languages.length).toBeGreaterThan(0);

        // Check that all languages have required fields
        result.languages.forEach((language) => {
          expect(language.key).toBeDefined();
          expect(language.name).toBeDefined();
          expect(typeof language.key).toBe('string');
          expect(typeof language.name).toBe('string');
          expect(language.key.length).toBeGreaterThan(0);
          expect(language.name.length).toBeGreaterThan(0);
        });
      },
      TEST_TIMING.normal,
    );

    test(
      'should have unique language keys',
      async () => {
        const { result } = await measureTime(async () => client.languages.list());

        const languageKeys = result.languages.map((lang) => lang.key);
        const uniqueKeys = new Set(languageKeys);

        expect(uniqueKeys.size).toBe(languageKeys.length);
      },
      TEST_TIMING.normal,
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should work on both SonarQube and SonarCloud',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.languages.list());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        // Languages API should work consistently across platforms
        expect(result.languages).toBeDefined();
        expect(result.languages.length).toBeGreaterThan(0);

        // Both platforms should support common languages
        const languageKeys = result.languages.map((lang) => lang.key);
        expect(languageKeys).toContain('java');
        expect(languageKeys).toContain('js');

        if (envConfig?.isSonarCloud) {
          console.log(`✓ SonarCloud: Found ${result.languages.length} supported languages`);
        } else {
          console.log(`✓ SonarQube: Found ${result.languages.length} supported languages`);
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance',
      async () => {
        const { result, durationMs } = await measureTime(async () => client.languages.list());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
          expected: 1000, // 1 second
          maximum: 5000, // 5 seconds absolute max
        });

        expect(result.languages.length).toBeGreaterThan(0);
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent requests',
      async () => {
        const requests = Array(3)
          .fill(null)
          .map(async () => client.languages.list());

        const results = await Promise.all(requests);

        results.forEach((result) => {
          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          expect(result.languages).toBeDefined();
          expect(result.languages.length).toBeGreaterThan(0);
        });

        // All requests should return the same data
        const firstResult = results[0];
        results.slice(1).forEach((result) => {
          expect(result.languages.length).toBe(firstResult.languages.length);
        });
      },
      TEST_TIMING.normal,
    );
  });
});
