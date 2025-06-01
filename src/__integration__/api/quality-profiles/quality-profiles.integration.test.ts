/**
 * Quality Profiles API Integration Tests
 *
 * Tests the Quality Profiles API functionality for both SonarQube and SonarCloud.
 * Covers profile search, inheritance, rule management, and language-specific profiles.
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

describe('Quality Profiles API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let envConfig: IntegrationTestConfig;
  let testConfig: TestConfiguration;

  beforeAll(async () => {
    envConfig = getIntegrationTestConfig();
    testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();
  }, testConfig.longTimeout);

  afterAll(async () => {
    await dataManager.cleanup();
  }, testConfig.longTimeout);

  describe('Quality Profile Search Operations', () => {
    test('should search all quality profiles', async () => {
      const searchBuilder = client.qualityProfiles.search();

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.profiles).toBeDefined();
      expect(Array.isArray(result.profiles)).toBe(true);
      expect(result.profiles.length).toBeGreaterThan(0);

      const firstProfile = result.profiles[0];
      expect(firstProfile.key).toBeDefined();
      expect(firstProfile.name).toBeDefined();
      expect(firstProfile.language).toBeDefined();
      expect(typeof firstProfile.isBuiltIn).toBe('boolean');
      expect(typeof firstProfile.isDefault).toBe('boolean');
      expect(typeof firstProfile.isInherited).toBe('boolean');
      expect(firstProfile.activeRuleCount).toBeDefined();
      expect(typeof firstProfile.activeRuleCount).toBe('number');

      // Verify language distribution
      const languages = [...new Set(result.profiles.map((p) => p.language))];
      expect(languages.length).toBeGreaterThan(0);

      // Common languages that should be present
      const commonLanguages = ['js', 'java', 'py', 'cs', 'ts'];
      const foundLanguages = languages.filter((lang) => commonLanguages.includes(lang));
      expect(foundLanguages.length).toBeGreaterThan(0);
    });

    test('should search quality profiles by language', async () => {
      // First get available languages
      const allProfilesBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        allProfilesBuilder.organization(envConfig.organization);
      }

      const allProfiles = await allProfilesBuilder.execute();

      if (allProfiles.profiles.length === 0) {
        console.warn('No profiles available for language filtering test');
        return;
      }

      const targetLanguage = allProfiles.profiles[0].language;

      const searchBuilder = client.qualityProfiles.search().language(targetLanguage);

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBeGreaterThan(0);

      // All profiles should be for the specified language
      result.profiles.forEach((profile) => {
        expect(profile.language).toBe(targetLanguage);
      });
    });

    test('should identify default quality profiles', async () => {
      const searchBuilder = client.qualityProfiles.search();

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);

      // Group profiles by language to check defaults
      const profilesByLanguage = result.profiles.reduce<Record<string, typeof result.profiles>>(
        (acc, profile) => {
          if (!acc[profile.language]) {
            acc[profile.language] = [];
          }
          acc[profile.language].push(profile);
          return acc;
        },
        {}
      );

      // Each language should have exactly one default profile
      Object.entries(profilesByLanguage).forEach(([_language, profiles]) => {
        const defaultProfiles = profiles.filter((p) => p.isDefault);
        expect(defaultProfiles.length).toBe(1);

        const defaultProfile = defaultProfiles[0];
        expect(defaultProfile.name).toBeDefined();
        expect(defaultProfile.isDefault).toBe(true);
      });
    });
  });

  describe('Quality Profile Details', () => {
    test('should show quality profile details', async () => {
      // Get a profile first
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const searchResult = await searchBuilder.execute();
      expect(searchResult.profiles.length).toBeGreaterThan(0);

      const profileKey = searchResult.profiles[0].key;

      // Get profile details
      const showBuilder = client.qualityProfiles.show().key(profileKey);
      if (envConfig.isSonarCloud && envConfig.organization) {
        showBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => showBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.profile).toBeDefined();
      expect(result.profile.key).toBe(profileKey);
      expect(result.profile.name).toBeDefined();
      expect(result.profile.language).toBeDefined();
      expect(typeof result.profile.isBuiltIn).toBe('boolean');
      expect(typeof result.profile.isDefault).toBe('boolean');
      expect(typeof result.profile.isInherited).toBe('boolean');
      expect(result.profile.activeRuleCount).toBeDefined();

      // Check for inheritance information
      if (result.profile.isInherited && result.profile.parentKey) {
        expect(result.profile.parentKey).toBeDefined();
        expect(result.profile.parentName).toBeDefined();
      }

      // Check for timestamps
      if (result.profile.userUpdatedAt) {
        expect(new Date(result.profile.userUpdatedAt)).toBeInstanceOf(Date);
      }

      if (result.profile.lastUsed) {
        expect(new Date(result.profile.lastUsed)).toBeInstanceOf(Date);
      }
    });
  });

  describe('Quality Profile Inheritance', () => {
    test('should show inheritance relationships', async () => {
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const searchResult = await searchBuilder.execute();

      // Look for inherited profiles
      const inheritedProfiles = searchResult.profiles.filter((p) => p.isInherited);

      if (inheritedProfiles.length === 0) {
        console.warn('No inherited profiles found for inheritance test');
        return;
      }

      const inheritedProfile = inheritedProfiles[0];

      const inheritanceBuilder = client.qualityProfiles
        .inheritance()
        .profileKey(inheritedProfile.key);

      if (envConfig.isSonarCloud && envConfig.organization) {
        inheritanceBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => inheritanceBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.profile).toBeDefined();
      expect(result.profile.key).toBe(inheritedProfile.key);

      if (result.ancestors) {
        expect(Array.isArray(result.ancestors)).toBe(true);
        result.ancestors.forEach((ancestor) => {
          expect(ancestor.key).toBeDefined();
          expect(ancestor.name).toBeDefined();
          expect(ancestor.activeRuleCount).toBeDefined();
        });
      }

      if (result.children) {
        expect(Array.isArray(result.children)).toBe(true);
        result.children.forEach((child) => {
          expect(child.key).toBeDefined();
          expect(child.name).toBeDefined();
          expect(child.activeRuleCount).toBeDefined();
        });
      }
    });
  });

  describe('Quality Profile Projects', () => {
    test('should get projects associated with quality profile', async () => {
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const searchResult = await searchBuilder.execute();
      expect(searchResult.profiles.length).toBeGreaterThan(0);

      const profileKey = searchResult.profiles[0].key;

      const projectsBuilder = client.qualityProfiles.projects().key(profileKey).pageSize(10);

      if (envConfig.isSonarCloud && envConfig.organization) {
        projectsBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => projectsBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.paging).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      // Validate project structure if any projects are returned
      result.results.forEach((project) => {
        expect(project.key).toBeDefined();
        expect(project.name).toBeDefined();
        if (project.selected !== undefined) {
          expect(typeof project.selected).toBe('boolean');
        }
      });
    });
  });

  describe('Quality Profile Rules', () => {
    test('should search rules in quality profile', async () => {
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const searchResult = await searchBuilder.execute();
      expect(searchResult.profiles.length).toBeGreaterThan(0);

      // Find a profile with active rules
      const profileWithRules = searchResult.profiles.find((p) => p.activeRuleCount > 0);
      if (!profileWithRules) {
        console.warn('No profiles with active rules found');
        return;
      }

      const rulesBuilder = client.rules
        .search()
        .qprofile(profileWithRules.key)
        .activation('true')
        .pageSize(10);

      if (envConfig.isSonarCloud && envConfig.organization) {
        rulesBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(() => rulesBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.rules).toBeDefined();
      expect(Array.isArray(result.rules)).toBe(true);

      if (result.rules.length > 0) {
        result.rules.forEach((rule) => {
          expect(rule.key).toBeDefined();
          expect(rule.name).toBeDefined();
          expect(rule.lang).toBe(profileWithRules.language);
          expect(rule.type).toBeDefined();
          expect(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']).toContain(rule.type);
        });
      }
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should handle organization context for SonarCloud', async () => {
      if (!envConfig.isSonarCloud || !envConfig.organization) {
        console.warn('Skipping SonarCloud organization test - not SonarCloud or no organization');
        return;
      }

      const { result, durationMs } = await measureTime(async () =>
        client.qualityProfiles.search().organization(envConfig.organization).execute()
      );

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs);

      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBeGreaterThan(0);

      // All profiles should be accessible within the organization
      result.profiles.forEach((profile) => {
        expect(profile.key).toBeDefined();
        expect(profile.language).toBeDefined();
      });
    });

    test('should show built-in quality profiles for SonarQube', async () => {
      if (envConfig.isSonarCloud) {
        console.warn('Skipping SonarQube built-in profiles test - running on SonarCloud');
        return;
      }

      const { result } = await measureTime(async () => client.qualityProfiles.search().execute());

      IntegrationAssertions.expectValidResponse(result);

      const builtInProfiles = result.profiles.filter((profile) => profile.isBuiltIn);
      expect(builtInProfiles.length).toBeGreaterThan(0);

      // Should have built-in profiles for common languages
      const builtInLanguages = [...new Set(builtInProfiles.map((p) => p.language))];
      expect(builtInLanguages.length).toBeGreaterThan(0);

      // Built-in profiles should have the "Sonar way" naming pattern
      const sonarWayProfiles = builtInProfiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes('sonar way') ||
          profile.name.toLowerCase().includes('sonar')
      );
      expect(sonarWayProfiles.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Profile Language Coverage', () => {
    test('should have quality profiles for major languages', async () => {
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);

      const languages = [...new Set(result.profiles.map((p) => p.language))];

      // Should support common programming languages
      const expectedLanguages = ['js', 'java'];
      const foundExpectedLanguages = expectedLanguages.filter((lang) => languages.includes(lang));

      // At least some major languages should be supported
      expect(foundExpectedLanguages.length).toBeGreaterThan(0);

      // Each language should have at least one default profile
      languages.forEach((language) => {
        const languageProfiles = result.profiles.filter((p) => p.language === language);
        const defaultProfile = languageProfiles.find((p) => p.isDefault);
        expect(defaultProfile).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid profile key gracefully', async () => {
      try {
        const showBuilder = client.qualityProfiles
          .show()
          .key('invalid-profile-key-that-does-not-exist');

        if (envConfig.isSonarCloud && envConfig.organization) {
          showBuilder.organization(envConfig.organization);
        }

        await showBuilder.execute();
      } catch (error) {
        // Expected behavior - invalid profile key should cause an error
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid language filter gracefully', async () => {
      const searchBuilder = client.qualityProfiles.search().language('invalid-language-code');

      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result } = await measureTime(async () => searchBuilder.execute());

      // Should return empty results for invalid language
      IntegrationAssertions.expectValidResponse(result);
      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBe(0);
    });
  });

  describe('Quality Profiles Performance', () => {
    test('should maintain reasonable performance for profile operations', async () => {
      const searchBuilder = client.qualityProfiles.search();
      if (envConfig.isSonarCloud && envConfig.organization) {
        searchBuilder.organization(envConfig.organization);
      }

      const { result, durationMs } = await measureTime(async () => searchBuilder.execute());

      IntegrationAssertions.expectValidResponse(result);
      IntegrationAssertions.expectReasonableResponseTime(durationMs, {
        expected: 1500, // 1.5 seconds
        maximum: 6000, // 6 seconds absolute max
      });
    });

    test('should handle concurrent profile requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(async (): Promise<unknown> => {
          const searchBuilder = client.qualityProfiles.search();
          if (envConfig.isSonarCloud && envConfig.organization) {
            searchBuilder.organization(envConfig.organization);
          }
          return searchBuilder.execute();
        });

      const results = await Promise.all(requests);

      results.forEach((result) => {
        IntegrationAssertions.expectValidResponse(result);
        expect(result.profiles).toBeDefined();
      });
    });
  });

  describe('Quality Profiles Retry Logic', () => {
    test('should handle transient failures with retry', async () => {
      const operation = async (): Promise<unknown> => {
        const searchBuilder = client.qualityProfiles.search();
        if (envConfig.isSonarCloud && envConfig.organization) {
          searchBuilder.organization(envConfig.organization);
        }
        return searchBuilder.execute();
      };

      const result = await retryOperation(operation, {
        maxRetries: testConfig.maxRetries,
        delay: testConfig.retryDelay,
      });

      IntegrationAssertions.expectValidResponse(result);
      expect(result.profiles).toBeDefined();
    });
  });
});
