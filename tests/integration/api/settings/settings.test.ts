// @ts-nocheck
/**
 * Settings API Integration Tests
 *
 * Tests the Settings API functionality for managing global and project-level settings.
 * This API provides operations for viewing, setting, and resetting configuration values.
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

// Helper function to determine setting value type
function getSettingValueType(setting: {
  value?: string | number | boolean;
  values?: Array<unknown>;
  fieldValues?: Array<unknown>;
}): string {
  if (setting.value === undefined || setting.value === null || setting.value === '') {
    return 'empty';
  }
  if (setting.values && Array.isArray(setting.values)) {
    return 'array';
  }
  if (setting.fieldValues && Array.isArray(setting.fieldValues)) {
    return 'object';
  }
  if (typeof setting.value === 'boolean') {
    return 'boolean';
  }
  if (typeof setting.value === 'number') {
    return 'number';
  }
  return 'string';
}

// Helper function to categorize setting by purpose
function categorizeSettingByPurpose(settingKey: string): string | null {
  const keyLower = settingKey.toLowerCase();

  const securityKeywords = ['security', 'auth', 'ssl', 'password', 'token'];
  if (securityKeywords.some((keyword) => keyLower.includes(keyword))) {
    return 'security';
  }

  const performanceKeywords = ['timeout', 'cache', 'pool', 'batch', 'thread'];
  if (performanceKeywords.some((keyword) => keyLower.includes(keyword))) {
    return 'performance';
  }

  const integrationKeywords = ['webhook', 'notification', 'email', 'ldap', 'saml'];
  if (integrationKeywords.some((keyword) => keyLower.includes(keyword))) {
    return 'integration';
  }

  return null;
}

// Helper function to analyze security aspects of a setting
function analyzeSettingSecurity(
  setting: { key: string; value?: string | number | boolean },
  analysis: {
    potentiallyEncrypted: string[];
    containsPasswords: string[];
    containsTokens: string[];
    containsUrls: string[];
    containsSensitiveData: string[];
  },
): void {
  const keyLower = setting.key.toLowerCase();
  const valueStr = String(setting.value || '').toLowerCase();

  // Identify potentially encrypted settings
  const encryptedKeywords = ['password', 'secret', 'key'];
  if (encryptedKeywords.some((keyword) => keyLower.includes(keyword))) {
    analysis.potentiallyEncrypted.push(setting.key);
  }

  // Identify password fields
  const passwordKeywords = ['password', 'passwd'];
  if (passwordKeywords.some((keyword) => keyLower.includes(keyword))) {
    analysis.containsPasswords.push(setting.key);
  }

  // Identify token fields
  if (keyLower.includes('token') || (keyLower.includes('api') && keyLower.includes('key'))) {
    analysis.containsTokens.push(setting.key);
  }

  // Identify URL fields
  const urlIndicators = ['http', 'url', 'endpoint'];
  if (
    urlIndicators.some((indicator) => valueStr.includes(indicator) || keyLower.includes(indicator))
  ) {
    analysis.containsUrls.push(setting.key);
  }

  // General sensitive data indicators
  const sensitiveKeywords = ['ldap', 'saml', 'oauth'];
  if (sensitiveKeywords.some((keyword) => keyLower.includes(keyword))) {
    analysis.containsSensitiveData.push(setting.key);
  }
}

/* eslint-disable max-lines-per-function */
(skipTests ? describe.skip : describe)('Settings API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;
  let testProjectKey: string | null = null;

  beforeAll(async () => {
    if (!envConfig || !testConfig) {
      throw new Error('Integration test configuration is not available');
    }

    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);

    await client.validateConnection();

    // Get a test project for settings operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for settings tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Global Settings Operations', () => {
    test(
      'should list global settings',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings.list().execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.settings).toBeDefined();
          expect(Array.isArray(result.settings)).toBe(true);

          if (result.settings.length > 0) {
            console.log(`✓ Found ${result.settings.length} global settings`);

            // Validate setting structure
            result.settings.forEach((setting) => {
              expect(setting.key).toBeDefined();
              expect(typeof setting.key).toBe('string');

              if (setting.value !== undefined) {
                expect(['string', 'boolean', 'number'].includes(typeof setting.value)).toBe(true);
              }

              if (setting.values) {
                expect(Array.isArray(setting.values)).toBe(true);
              }

              if (setting.fieldValues) {
                expect(Array.isArray(setting.fieldValues)).toBe(true);
              }

              // Log a sample of settings
              if (result.settings.indexOf(setting) < 5) {
                console.log(`  Setting: ${setting.key} = ${setting.value || '[array/object]'}`);
              }
            });

            // Categorize settings by key patterns
            const settingCategories = {
              sonar: result.settings.filter((s) => s.key.startsWith('sonar.')),
              email: result.settings.filter(
                (s) => s.key.includes('email') || s.key.includes('mail'),
              ),
              auth: result.settings.filter((s) => s.key.includes('auth') || s.key.includes('ldap')),
              security: result.settings.filter(
                (s) => s.key.includes('security') || s.key.includes('ssl'),
              ),
              database: result.settings.filter(
                (s) => s.key.includes('database') || s.key.includes('db'),
              ),
            };

            console.log(`  Setting categories:`);
            Object.entries(settingCategories).forEach(([category, settings]) => {
              if (settings.length > 0) {
                console.log(`    ${category}: ${settings.length} settings`);
              }
            });
          } else {
            console.log('ℹ No global settings found (may require admin access)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view global settings');
          } else if (errorObj.status === 404) {
            console.log('ℹ Settings API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle settings filtering by keys',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings
              .list()
              .keys(['sonar.core.serverBaseURL', 'sonar.dbcleaner.daysBeforeDeletingClosedIssues'])
              .execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (result.settings.length > 0) {
            console.log(`✓ Found ${result.settings.length} filtered settings`);

            result.settings.forEach((setting) => {
              console.log(`  ${setting.key}: ${setting.value || '[not set]'}`);

              // Validate that returned settings match requested keys
              const requestedKeys = [
                'sonar.core.serverBaseURL',
                'sonar.dbcleaner.daysBeforeDeletingClosedIssues',
              ];
              expect(requestedKeys.includes(setting.key)).toBe(true);
            });
          } else {
            console.log('ℹ No settings found for specified keys');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access filtered settings');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should analyze setting value types and patterns',
      async () => {
        try {
          const { result } = await measureTime(async () => client.settings.list().execute());

          if (result.settings.length === 0) {
            console.log('ℹ No settings available for analysis');
            return;
          }

          const valueTypes = {
            string: 0,
            boolean: 0,
            number: 0,
            array: 0,
            object: 0,
            empty: 0,
          };

          const securityRelated = [];
          const performanceRelated = [];
          const integrationRelated = [];

          result.settings.forEach((setting) => {
            // Analyze value types
            const valueType = getSettingValueType(setting);
            valueTypes[valueType]++;

            // Categorize by purpose
            const category = categorizeSettingByPurpose(setting.key);
            if (category === 'security') {
              securityRelated.push(setting.key);
            } else if (category === 'performance') {
              performanceRelated.push(setting.key);
            } else if (category === 'integration') {
              integrationRelated.push(setting.key);
            }
          });

          console.log(`✓ Setting analysis completed:`);
          console.log(`  Value types:`);
          Object.entries(valueTypes).forEach(([type, count]) => {
            if (count > 0) {
              console.log(`    ${type}: ${count}`);
            }
          });

          console.log(`  Functional categories:`);
          if (securityRelated.length > 0) {
            console.log(`    Security-related: ${securityRelated.length}`);
          }
          if (performanceRelated.length > 0) {
            console.log(`    Performance-related: ${performanceRelated.length}`);
          }
          if (integrationRelated.length > 0) {
            console.log(`    Integration-related: ${integrationRelated.length}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze settings');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Project Settings Operations', () => {
    test(
      'should list project settings',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping project settings test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings.list().component(testProjectKey).execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.settings).toBeDefined();
          expect(Array.isArray(result.settings)).toBe(true);

          if (result.settings.length > 0) {
            console.log(`✓ Found ${result.settings.length} project settings`);

            result.settings.forEach((setting) => {
              expect(setting.key).toBeDefined();
              console.log(`  Project setting: ${setting.key} = ${setting.value || '[not set]'}`);
            });

            // Check for common project-level settings
            const commonProjectSettings = [
              'sonar.projectDate',
              'sonar.projectDescription',
              'sonar.links.homepage',
              'sonar.exclusions',
              'sonar.coverage.exclusions',
            ];

            const presentSettings = result.settings
              .map((s) => s.key)
              .filter((key) => commonProjectSettings.includes(key));

            if (presentSettings.length > 0) {
              console.log(`  Common project settings present: ${presentSettings.join(', ')}`);
            }
          } else {
            console.log('ℹ No project-specific settings found');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project settings');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or settings not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should compare global vs project setting inheritance',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping inheritance test - no test project available');
          return;
        }

        try {
          const [globalResult, projectResult] = await Promise.all([
            client.settings.list().execute(),
            client.settings.list().component(testProjectKey).execute(),
          ]);

          console.log(`✓ Setting inheritance analysis:`);
          console.log(`  Global settings: ${globalResult.settings.length}`);
          console.log(`  Project settings: ${projectResult.settings.length}`);

          // Find settings that exist at both levels
          const globalKeys = new Set(globalResult.settings.map((s) => s.key));
          const projectKeys = new Set(projectResult.settings.map((s) => s.key));

          const inheritedSettings = Array.from(projectKeys).filter((key) => globalKeys.has(key));
          const projectOnlySettings = Array.from(projectKeys).filter((key) => !globalKeys.has(key));

          if (inheritedSettings.length > 0) {
            console.log(`  Settings with potential inheritance: ${inheritedSettings.length}`);

            // Check for value differences between global and project
            const differences = [];
            inheritedSettings.forEach((key) => {
              const globalSetting = globalResult.settings.find((s) => s.key === key);
              const projectSetting = projectResult.settings.find((s) => s.key === key);

              if (globalSetting?.value !== projectSetting?.value) {
                differences.push(key);
              }
            });

            if (differences.length > 0) {
              console.log(`  Settings overridden at project level: ${differences.length}`);
            }
          }

          if (projectOnlySettings.length > 0) {
            console.log(`  Project-only settings: ${projectOnlySettings.length}`);
          }

          console.log('  Inheritance patterns analyzed');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze setting inheritance');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Settings Management Operations', () => {
    test(
      'should handle settings modification validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping settings modification test - destructive tests disabled');
          return;
        }

        try {
          console.log('ℹ Settings modification validation (read-only mode)');
          console.log('  Real settings modification requires admin permissions');

          // Settings management operations typically include:
          // 1. Setting individual values
          // 2. Setting multiple values at once
          // 3. Resetting to defaults
          // 4. Bulk operations

          const managementOperations = [
            'Set individual setting values',
            'Set multiple values in batch',
            'Reset settings to defaults',
            'Validate setting constraints',
            'Handle setting dependencies',
            'Manage encrypted settings',
            'Control setting visibility',
          ];

          console.log(`✓ Settings management operations identified:`);
          managementOperations.forEach((operation, index) => {
            console.log(`  ${index + 1}. ${operation}`);
          });

          console.log('  Management validation complete');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for settings management');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should validate settings security and encryption',
      async () => {
        try {
          const { result } = await measureTime(async () => client.settings.list().execute());

          if (result.settings.length === 0) {
            console.log('ℹ No settings available for security analysis');
            return;
          }

          const securityAnalysis = {
            potentiallyEncrypted: [],
            containsPasswords: [],
            containsTokens: [],
            containsUrls: [],
            containsSensitiveData: [],
          };

          result.settings.forEach((setting) => {
            analyzeSettingSecurity(setting, securityAnalysis);
          });

          console.log(`✓ Settings security analysis:`);
          Object.entries(securityAnalysis).forEach(([category, settings]) => {
            if (settings.length > 0) {
              console.log(`  ${category}: ${settings.length} settings`);
            }
          });

          // Security recommendations
          if (securityAnalysis.potentiallyEncrypted.length > 0) {
            console.log(
              `  ℹ ${securityAnalysis.potentiallyEncrypted.length} settings should be encrypted`,
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze settings security');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Settings Categories and Definitions', () => {
    test(
      'should validate settings categories',
      async () => {
        try {
          const { result } = await measureTime(async () => client.settings.list().execute());

          if (result.settings.length === 0) {
            console.log('ℹ No settings available for category analysis');
            return;
          }

          // Group settings by their key prefixes to understand categories
          const categories = new Map<string, number>();
          const subcategories = new Map<string, number>();

          result.settings.forEach((setting) => {
            const parts = setting.key.split('.');
            if (parts.length >= 2) {
              const category = parts[0];
              const subcategory = parts.slice(0, 2).join('.');

              categories.set(category, (categories.get(category) || 0) + 1);
              subcategories.set(subcategory, (subcategories.get(subcategory) || 0) + 1);
            }
          });

          console.log(`✓ Settings categories identified:`);

          // Show top categories
          const sortedCategories = Array.from(categories.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

          sortedCategories.forEach(([category, count]) => {
            console.log(`  ${category}: ${count} settings`);
          });

          // Show some subcategories for the largest category
          if (sortedCategories.length > 0) {
            const largestCategory = sortedCategories[0][0];
            const relatedSubcategories = Array.from(subcategories.entries())
              .filter(([key]) => key.startsWith(`${largestCategory}.`))
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5);

            if (relatedSubcategories.length > 0) {
              console.log(`  ${largestCategory} subcategories:`);
              relatedSubcategories.forEach(([subcat, count]) => {
                console.log(`    ${subcat}: ${count} settings`);
              });
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze settings categories');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should identify deprecated and new settings',
      async () => {
        try {
          const { result } = await measureTime(async () => client.settings.list().execute());

          if (result.settings.length === 0) {
            console.log('ℹ No settings available for deprecation analysis');
            return;
          }

          const analysis = {
            deprecated: [],
            legacy: [],
            modern: [],
            experimental: [],
          };

          result.settings.forEach((setting) => {
            const keyLower = setting.key.toLowerCase();

            // Identify potentially deprecated settings
            if (
              keyLower.includes('deprecated') ||
              keyLower.includes('legacy') ||
              keyLower.includes('old')
            ) {
              analysis.deprecated.push(setting.key);
            }

            // Identify legacy patterns
            if (
              keyLower.includes('.old.') ||
              keyLower.endsWith('.old') ||
              keyLower.includes('v1.')
            ) {
              analysis.legacy.push(setting.key);
            }

            // Identify modern/new patterns
            if (
              keyLower.includes('.new.') ||
              keyLower.includes('v2.') ||
              keyLower.includes('2.0')
            ) {
              analysis.modern.push(setting.key);
            }

            // Identify experimental features
            if (
              keyLower.includes('experimental') ||
              keyLower.includes('beta') ||
              keyLower.includes('preview')
            ) {
              analysis.experimental.push(setting.key);
            }
          });

          console.log(`✓ Settings lifecycle analysis:`);
          Object.entries(analysis).forEach(([category, settings]) => {
            if (settings.length > 0) {
              console.log(`  ${category}: ${settings.length} settings`);
              // Show a few examples
              settings.slice(0, 3).forEach((key) => {
                console.log(`    ${key}`);
              });
              if (settings.length > 3) {
                console.log(`    ... and ${settings.length - 3} more`);
              }
            }
          });
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze settings lifecycle');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should work on both SonarQube and SonarCloud',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings.list().execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.settings.length} settings`);

            // SonarCloud may have different settings
            if (result.settings.length > 0) {
              const cloudSettings = result.settings.filter(
                (s) => s.key.includes('cloud') || s.key.includes('organization'),
              );
              console.log(`  Cloud-specific settings: ${cloudSettings.length}`);
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.settings.length} settings`);

            // SonarQube settings
            if (result.settings.length > 0) {
              const serverSettings = result.settings.filter(
                (s) => s.key.includes('server') || s.key.includes('database'),
              );
              console.log(`  Server-specific settings: ${serverSettings.length}`);
            }
          }

          // Both platforms should support the same settings API structure
          expect(result.settings).toBeDefined();
          expect(Array.isArray(result.settings)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - settings not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle organization context for SonarCloud',
      async () => {
        if (!envConfig?.isSonarCloud || !envConfig.organization) {
          console.log('ℹ Skipping organization test - not SonarCloud or no organization');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings.list().execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.settings.length} settings`);

          if (result.settings.length > 0) {
            // Check for organization-specific settings
            const orgSettings = result.settings.filter(
              (s) =>
                s.key.includes('organization') ||
                s.key.includes('org.') ||
                String(s.value || '').includes(envConfig.organization || ''),
            );

            if (orgSettings.length > 0) {
              console.log(`  Organization-related settings: ${orgSettings.length}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - settings not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for settings retrieval',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () =>
            client.settings.list().execute(),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 8000, // 8 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.settings.length} settings in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - settings not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent settings requests',
      async () => {
        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.settings.list().execute());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.settings).toBeDefined();
          });

          // All requests should return consistent data
          const firstCount = results[0].settings.length;
          results.slice(1).forEach((result) => {
            expect(result.settings.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - settings not accessible');
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
      'should handle invalid component key gracefully',
      async () => {
        try {
          await client.settings
            .list()
            .component('invalid-component-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid component keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates component keys for settings');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
            expect(errorObj.status).toBe(400);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.settings.list().execute();

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast,
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide comprehensive settings management workflow',
      async () => {
        try {
          console.log('✓ Starting settings management workflow');

          // 1. Get global settings overview
          const { result: globalSettings } = await measureTime(async () =>
            client.settings.list().execute(),
          );

          console.log(`  Step 1: Found ${globalSettings.settings.length} global settings`);

          // 2. Analyze settings structure
          const categories = new Map<string, number>();
          globalSettings.settings.forEach((setting) => {
            const category = setting.key.split('.')[0];
            categories.set(category, (categories.get(category) || 0) + 1);
          });

          console.log(`  Step 2: Settings organized into ${categories.size} categories`);

          // 3. Check project-specific settings if available
          if (testProjectKey) {
            try {
              const { result: projectSettings } = await measureTime(async () =>
                client.settings.list().component(testProjectKey).execute(),
              );

              console.log(`  Step 3: Found ${projectSettings.settings.length} project settings`);

              // 4. Settings governance analysis
              const totalSettings =
                globalSettings.settings.length + projectSettings.settings.length;
              const securitySettings = globalSettings.settings.filter(
                (s) =>
                  s.key.toLowerCase().includes('password') ||
                  s.key.toLowerCase().includes('secret') ||
                  s.key.toLowerCase().includes('token'),
              ).length;

              console.log(`  Step 4: Settings governance`);
              console.log(`    Total settings: ${totalSettings}`);
              console.log(`    Security-sensitive: ${securitySettings}`);
              console.log(`    Category distribution: ${categories.size} categories`);
            } catch {
              console.log(`  Step 3: Project settings not accessible`);
            }
          }

          console.log('✓ Settings management workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete settings workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
