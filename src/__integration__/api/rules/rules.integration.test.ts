/**
 * Rules API Integration Tests
 *
 * Tests the Rules API functionality for both SonarQube and SonarCloud.
 * Covers rule search, rule details, repositories, and rule activation status.
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

(skipTests ? describe.skip : describe)('Rules API Integration Tests', () => {
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

  describe('Rule Search Operations', () => {
    test('should search all rules', async () => {
      const searchBuilder = client.rules.search().pageSize(20);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.rules).toBeDefined();
      expect(Array.isArray(result.rules)).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);

      expect(result.paging).toBeDefined();
      expect(result.paging.pageIndex).toBeDefined();
      expect(result.paging.pageSize).toBeDefined();
      expect(result.paging.total).toBeGreaterThan(0);

      const firstRule = result.rules[0];
      expect(firstRule.key).toBeDefined();
      expect(firstRule.name).toBeDefined();
      expect(firstRule.lang).toBeDefined();
      expect(firstRule.type).toBeDefined();
      expect(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']).toContain(firstRule.type);
      expect(firstRule.severity).toBeDefined();
      expect(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER']).toContain(firstRule.severity);

      // Verify repository information
      if (result.repositories) {
        expect(Array.isArray(result.repositories)).toBe(true);
        result.repositories.forEach((repo) => {
          expect(repo.key).toBeDefined();
          expect(repo.name).toBeDefined();
          expect(repo.language).toBeDefined();
        });
      }
    });

    test('should search rules by language', async () => {
      // First get available languages
      const allRulesBuilder = client.rules.search().pageSize(50);
      if (envConfig?.isSonarCloud && envConfig.organization) {
        allRulesBuilder.organization(envConfig.organization);
      }

      const allRules = await allRulesBuilder.execute();

      if (allRules.rules.length === 0) {
        console.warn('No rules available for language filtering test');
        return;
      }

      const targetLanguage = allRules.rules[0].lang;

      const searchBuilder = client.rules.search().withLanguages([targetLanguage]).pageSize(10);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBeGreaterThan(0);

      // All rules should be for the specified language
      result.rules.forEach((rule) => {
        expect(rule.lang).toBe(targetLanguage);
      });
    });

    test('should search rules by type', async () => {
      const ruleTypes = ['BUG', 'VULNERABILITY', 'CODE_SMELL'] as const;

      for (const ruleType of ruleTypes) {
        const searchBuilder = client.rules.search().withTypes([ruleType]).pageSize(5);

        if (envConfig?.isSonarCloud && envConfig.organization) {
          searchBuilder.organization(envConfig.organization);
        }

        const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        if (result.rules.length > 0) {
          result.rules.forEach((rule) => {
            expect(rule.type).toBe(ruleType);
          });
        }
      }
    });

    test('should search rules by severity', async () => {
      const severities = ['CRITICAL', 'MAJOR', 'MINOR'] as const;

      for (const severity of severities) {
        const searchBuilder = client.rules.search().withSeverities([severity]).pageSize(5);

        if (envConfig?.isSonarCloud && envConfig.organization) {
          searchBuilder.organization(envConfig.organization);
        }

        const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

        if (result.rules.length > 0) {
          result.rules.forEach((rule) => {
            expect(rule.severity).toBe(severity);
          });
        }
      }
    });

    test('should search rules by repository', async () => {
      // First get available repositories
      const allRulesBuilder = client.rules.search().pageSize(50);
      if (envConfig?.isSonarCloud && envConfig.organization) {
        allRulesBuilder.organization(envConfig.organization);
      }

      const allRules = await allRulesBuilder.execute();

      if (!allRules.repositories || allRules.repositories.length === 0) {
        console.warn('No repositories available for repository filtering test');
        return;
      }

      const targetRepository = allRules.repositories[0].key;

      const searchBuilder = client.rules.search().repositories([targetRepository]).pageSize(10);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      if (result.rules.length > 0) {
        // All rules should belong to the specified repository
        result.rules.forEach((rule) => {
          expect(rule.key).toContain(targetRepository);
        });
      }
    });

    test(
      'should search rules with text query',
      async () => {
        const searchTerms = ['security', 'performance', 'null', 'unused'];

        for (const term of searchTerms) {
          const searchBuilder = client.rules.search().withQuery(term).pageSize(10);

          if (envConfig?.isSonarCloud && envConfig.organization) {
            searchBuilder.organization(envConfig.organization);
          }

          const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.rules.length > 0) {
            // Rules should contain the search term in name or description
            const hasMatchingRules = result.rules.some(
              (rule) =>
                rule.name.toLowerCase().includes(term.toLowerCase()) ||
                rule.htmlDesc?.toLowerCase().includes(term.toLowerCase())
            );

            if (result.rules.length > 0) {
              expect(hasMatchingRules).toBe(true);
            }
          }

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      },
      testConfig?.longTimeout ?? 60000
    );
  });

  describe('Rule Details', () => {
    test('should show rule details', async () => {
      // Get a rule first
      const searchBuilder = client.rules.search().pageSize(1);
      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const searchResult = await searchBuilder.execute();
      expect(searchResult.rules.length).toBeGreaterThan(0);

      const ruleKey = searchResult.rules[0].key;

      // Get rule details
      const { result, durationMs } = await measureTime(async () => {
        const params: Record<string, unknown> = { key: ruleKey };
        if (envConfig?.isSonarCloud && envConfig.organization) {
          params.organization = envConfig.organization;
        }
        return client.rules.show(params);
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.rule).toBeDefined();
      expect(result.rule.key).toBe(ruleKey);
      expect(result.rule.name).toBeDefined();
      expect(result.rule.lang).toBeDefined();
      expect(result.rule.type).toBeDefined();
      expect(result.rule.severity).toBeDefined();

      // Check for rule description
      if (result.rule.htmlDesc) {
        expect(typeof result.rule.htmlDesc).toBe('string');
        expect(result.rule.htmlDesc.length).toBeGreaterThan(0);
      }

      if (result.rule.mdDesc) {
        expect(typeof result.rule.mdDesc).toBe('string');
        expect(result.rule.mdDesc.length).toBeGreaterThan(0);
      }

      // Check for rule parameters
      if (result.rule.params) {
        expect(Array.isArray(result.rule.params)).toBe(true);
        result.rule.params.forEach((param) => {
          expect(param.key).toBeDefined();
          expect(param.htmlDesc || param.desc).toBeDefined();
          expect(param.type).toBeDefined();
        });
      }

      // Check for rule tags
      if (result.rule.tags) {
        expect(Array.isArray(result.rule.tags)).toBe(true);
      }

      if (result.rule.sysTags) {
        expect(Array.isArray(result.rule.sysTags)).toBe(true);
      }
    });
  });

  describe('Rule Repositories', () => {
    test('should list rule repositories', async () => {
      const { result, durationMs } = await measureTime(async () => {
        const params: Record<string, unknown> = {};
        if (envConfig?.isSonarCloud && envConfig.organization) {
          // Note: listRepositories may not support organization parameter
        }
        return client.rules.listRepositories(params);
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.repositories).toBeDefined();
      expect(Array.isArray(result.repositories)).toBe(true);
      expect(result.repositories.length).toBeGreaterThan(0);

      result.repositories.forEach((repo) => {
        expect(repo.key).toBeDefined();
        expect(repo.name).toBeDefined();
        expect(repo.language).toBeDefined();
      });

      // Should have repositories for common languages
      const languages = [...new Set(result.repositories.map((r) => r.language))];
      expect(languages.length).toBeGreaterThan(0);

      // Look for common language repositories
      const commonLanguages = ['js', 'java', 'py', 'cs', 'ts'];
      const foundLanguages = languages.filter((lang) => commonLanguages.includes(lang));
      expect(foundLanguages.length).toBeGreaterThan(0);
    });

    test('should filter repositories by language', async () => {
      const { result, durationMs } = await measureTime(async () => {
        const params: Record<string, unknown> = { language: 'js' };
        if (envConfig?.isSonarCloud && envConfig.organization) {
          // Note: listRepositories may not support organization parameter
        }
        return client.rules.listRepositories(params);
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      if (result.repositories.length > 0) {
        // All repositories should be for JavaScript
        result.repositories.forEach((repo) => {
          expect(repo.language).toBe('js');
        });
      }
    });
  });

  describe('Rule Tags', () => {
    test('should list rule tags', async () => {
      const { result, durationMs } = await measureTime(async () => client.rules.listTags({}));

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);

      if (result.tags.length > 0) {
        result.tags.forEach((tag) => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });

        // Check if any common rule tags are present (not all instances may have them)
        const commonTags = ['security', 'performance', 'bug', 'convention'];
        const foundTags = result.tags.filter((tag) =>
          commonTags.some((commonTag) => tag.toLowerCase().includes(commonTag))
        );

        if (foundTags.length === 0) {
          console.log(
            'ℹ No common rule tags found - this is acceptable for minimal SonarQube setups'
          );
        } else {
          console.log(`✓ Found ${foundTags.length} common rule tags: ${foundTags.join(', ')}`);
        }
      }
    });

    test('should search tags with query', async () => {
      const { result, durationMs } = await measureTime(async () =>
        client.rules.listTags({ q: 'sec' })
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      if (result.tags.length > 0) {
        // Tags should contain 'sec' substring
        const matchingTags = result.tags.filter((tag) => tag.toLowerCase().includes('sec'));
        expect(matchingTags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Rule Activation Status', () => {
    test('should search activated rules in quality profile', async () => {
      // First get a quality profile
      const profilesBuilder = client.qualityProfiles.search();
      if (envConfig?.isSonarCloud && envConfig.organization) {
        profilesBuilder.organization(envConfig.organization);
      }

      const profilesResult = await profilesBuilder.execute();

      if (profilesResult.profiles.length === 0) {
        console.warn('No quality profiles available for rule activation test');
        return;
      }

      const profileKey = profilesResult.profiles[0].key;

      const searchBuilder = client.rules
        .search()
        .inQualityProfile(profileKey)
        .withActivation(true)
        .pageSize(10);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      if (result.rules.length > 0) {
        // Should include activation information
        if (result.actives) {
          expect(typeof result.actives).toBe('object');

          // Check activation details for rules
          result.rules.forEach((rule) => {
            if (result.actives?.[rule.key]) {
              const activations = result.actives[rule.key];
              expect(Array.isArray(activations)).toBe(true);

              activations.forEach((activation) => {
                expect(activation.qProfile).toBeDefined();
                expect(activation.inherit).toBeDefined();
                expect(activation.severity).toBeDefined();
              });
            }
          });
        }
      }
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should handle organization context for SonarCloud', async () => {
      if (!envConfig?.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud organization test - not SonarCloud or no organization');
        return;
      }

      const { result, durationMs } = await measureTime(() =>
        client.rules.search().organization(envConfig.organization).pageSize(10).execute()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBeGreaterThan(0);
    });

    test('should access global rules for SonarQube', async () => {
      if (envConfig?.isSonarCloud) {
        console.warn('Skipping SonarQube global rules test - running on SonarCloud');
        return;
      }

      const { result, durationMs } = await measureTime(async () =>
        client.rules.search().pageSize(10).execute()
      );

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBeGreaterThan(0);
    });
  });

  describe('Rule Pagination', () => {
    test('should handle pagination correctly', async () => {
      const pageSize = 5;

      const firstPageBuilder = client.rules.search().pageSize(pageSize).page(1);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        firstPageBuilder.organization(envConfig.organization);
      }

      const { result: firstPage } = await measureTime(async () => firstPageBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(firstPage);
      expect(firstPage.paging.pageIndex).toBe(1);
      expect(firstPage.paging.pageSize).toBe(pageSize);

      if (firstPage.paging.total > pageSize) {
        const secondPageBuilder = client.rules.search().pageSize(pageSize).page(2);

        if (envConfig?.isSonarCloud && envConfig.organization) {
          secondPageBuilder.organization(envConfig.organization);
        }

        const { result: secondPage } = await measureTime(async () => secondPageBuilder.execute());

        INTEGRATION_ASSERTIONS.expectValidResponse(secondPage);
        expect(secondPage.paging.pageIndex).toBe(2);

        // Ensure different results on different pages
        if (firstPage.rules.length > 0 && secondPage.rules.length > 0) {
          expect(firstPage.rules[0].key).not.toBe(secondPage.rules[0].key);
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid rule key gracefully', async () => {
      try {
        const params: Record<string, unknown> = { key: 'invalid:rule:key:that:does:not:exist' };
        if (envConfig?.isSonarCloud && envConfig.organization) {
          params.organization = envConfig.organization;
        }

        await client.rules.show(params);
      } catch (error) {
        // Expected behavior - invalid rule key should cause an error
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid language filter by returning empty results', async () => {
      const searchBuilder = client.rules
        .search()
        .withLanguages(['invalid-language-code'])
        .pageSize(1);

      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(async () => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      expect(result.rules).toBeDefined();
      expect(result.rules.length).toBe(0); // Should return empty results for invalid language
      expect(result.paging.total).toBe(0);
    });
  });

  describe('Rules Performance', () => {
    test('should maintain reasonable performance for rule operations', async () => {
      const searchBuilder = client.rules.search().pageSize(20);
      if (envConfig?.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
        expected: 2000, // 2 seconds
        maximum: 8000, // 8 seconds absolute max
      });
    });

    test('should handle concurrent rule requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(async () => {
          const searchBuilder = client.rules.search().pageSize(5);
          if (envConfig?.isSonarCloud && envConfig.organization) {
            searchBuilder.organization(envConfig.organization);
          }
          return searchBuilder.execute();
        });

      const results = await Promise.all(requests);

      results.forEach((result) => {
        INTEGRATION_ASSERTIONS.expectValidResponse(result);
        expect(result.rules).toBeDefined();
      });
    });
  });

  describe('Rules Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => {
        const searchBuilder = client.rules.search().pageSize(5);
        if (envConfig?.isSonarCloud && envConfig.organization) {
          searchBuilder.organization(envConfig.organization);
        }
        return searchBuilder.execute();
      };

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await withRetry(operation, {
        maxAttempts: testConfig?.maxRetries ?? 3,
        delayMs: testConfig?.retryDelay ?? 1000,
      });

      INTEGRATION_ASSERTIONS.expectValidResponse(result);
      expect(result.rules).toBeDefined();
    });
  });
});
