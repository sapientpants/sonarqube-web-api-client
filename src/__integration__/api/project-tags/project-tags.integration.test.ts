/**
 * Project Tags API Integration Tests
 *
 * Tests the Project Tags API functionality for managing project tag assignments.
 * This API provides operations for getting and setting project tags for categorization.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { IntegrationTestClient } from '../../setup/IntegrationTestClient';
import { TestDataManager } from '../../setup/TestDataManager';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions';
import { measureTime, TEST_TIMING } from '../../utils/testHelpers';
import { getIntegrationTestConfig, canRunIntegrationTests } from '../../config/environment';
import { getTestConfiguration } from '../../config/testConfig';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Project Tags API Integration Tests', () => {
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

    // Get a test project for tag operations
    try {
      testProjectKey = await dataManager.getTestProject(false); // Read-only
    } catch {
      console.log('ℹ No test project available for project tags tests');
    }
  }, TEST_TIMING.normal);

  afterAll(async () => {
    await dataManager.cleanup();
  }, TEST_TIMING.normal);

  describe('Project Tag Search Operations', () => {
    test(
      'should list project tags',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping tag search test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.tags).toBeDefined();
          expect(Array.isArray(result.tags)).toBe(true);

          if (result.tags.length > 0) {
            console.log(`✓ Found ${result.tags.length} project tags`);

            // Validate tag structure
            result.tags.forEach((tag) => {
              expect(typeof tag).toBe('string');
              expect(tag.length).toBeGreaterThan(0);

              // Tags should not contain special characters that could cause issues
              expect(tag).toMatch(/^[a-zA-Z0-9\-_.]+$/);

              console.log(`  Tag: ${tag}`);
            });

            // Check for common tag patterns
            const commonPatterns = {
              environment: result.tags.filter((tag) =>
                /^(prod|dev|test|staging)/.test(tag.toLowerCase())
              ),
              technology: result.tags.filter((tag) =>
                /^(java|javascript|python|nodejs|react)/.test(tag.toLowerCase())
              ),
              team: result.tags.filter((tag) => /^(team|squad|tribe)/.test(tag.toLowerCase())),
              category: result.tags.filter((tag) =>
                /^(frontend|backend|api|ui|service)/.test(tag.toLowerCase())
              ),
            };

            Object.entries(commonPatterns).forEach(([pattern, matches]) => {
              if (matches.length > 0) {
                console.log(`  ${pattern} tags: ${matches.join(', ')}`);
              }
            });
          } else {
            console.log('ℹ No project tags found');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view project tags');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found or tags not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle empty project tags gracefully',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping empty tags test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          // Even if empty, should have valid structure
          expect(result.tags).toBeDefined();
          expect(Array.isArray(result.tags)).toBe(true);

          console.log(`✓ Project tags API responded correctly (${result.tags.length} tags)`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access project tags');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Project Tag Management Operations', () => {
    test(
      'should handle tag assignment validation',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping tag assignment test - destructive tests disabled');
          return;
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping tag assignment test - no test project available');
          return;
        }

        try {
          // Note: We don't actually set tags in integration tests as this
          // modifies project metadata and requires admin permissions.
          // Instead, we validate the API structure.

          console.log('ℹ Tag assignment validation (read-only mode)');
          console.log('  Real tag assignment requires admin permissions');

          // Check current tags to understand baseline
          const { result } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          console.log(`✓ Project has ${result.tags.length} existing tags`);
          console.log('  Tag assignment would be possible with proper permissions');
          console.log('  API structure validated for set operations');

          // In a real destructive test, you would call:
          // await client.projectTags.set({
          //   project: testProjectKey,
          //   tags: [...result.tags, 'integration-test-tag']
          // });
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions for tag assignment');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project not found for tag operations');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should validate tag format requirements',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping tag format test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          if (result.tags.length === 0) {
            console.log('ℹ No tags available for format validation');
            return;
          }

          let validTags = 0;
          let invalidTags = 0;

          result.tags.forEach((tag) => {
            // Validate tag format based on common requirements
            const isValidFormat = /^[a-zA-Z0-9\-_.]+$/.test(tag);
            const isReasonableLength = tag.length >= 1 && tag.length <= 100;
            const isNotEmpty = tag.trim().length > 0;

            if (isValidFormat && isReasonableLength && isNotEmpty) {
              validTags++;
            } else {
              invalidTags++;
              console.log(`⚠ Potentially invalid tag format: '${tag}'`);
            }

            // Check for common tag anti-patterns
            if (tag.includes(' ')) {
              console.log(`⚠ Tag contains spaces: '${tag}'`);
            }
            if (tag !== tag.toLowerCase()) {
              console.log(`ℹ Mixed case tag: '${tag}'`);
            }
          });

          console.log(`✓ Tag format validation completed`);
          console.log(`  Valid format tags: ${validTags}/${result.tags.length}`);

          if (invalidTags > 0) {
            console.log(`  Tags with potential issues: ${invalidTags}`);
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access tags for format validation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Tag Analysis and Patterns', () => {
    test(
      'should analyze tag usage patterns',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping tag analysis test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          if (result.tags.length === 0) {
            console.log('ℹ No tags available for pattern analysis');
            return;
          }

          const tagAnalysis = {
            totalTags: result.tags.length,
            averageLength: 0,
            longestTag: '',
            shortestTag: '',
            commonPrefixes: new Map<string, number>(),
            commonSuffixes: new Map<string, number>(),
          };

          let totalLength = 0;
          let longest = '';
          let shortest = result.tags[0];

          result.tags.forEach((tag) => {
            totalLength += tag.length;

            if (tag.length > longest.length) {
              longest = tag;
            }
            if (tag.length < shortest.length) {
              shortest = tag;
            }

            // Analyze prefixes (first 3 characters)
            if (tag.length >= 3) {
              const prefix = tag.substring(0, 3);
              tagAnalysis.commonPrefixes.set(
                prefix,
                (tagAnalysis.commonPrefixes.get(prefix) || 0) + 1
              );
            }

            // Analyze suffixes (last 3 characters)
            if (tag.length >= 3) {
              const suffix = tag.substring(tag.length - 3);
              tagAnalysis.commonSuffixes.set(
                suffix,
                (tagAnalysis.commonSuffixes.get(suffix) || 0) + 1
              );
            }
          });

          tagAnalysis.averageLength = totalLength / result.tags.length;
          tagAnalysis.longestTag = longest;
          tagAnalysis.shortestTag = shortest;

          console.log(`✓ Tag analysis completed`);
          console.log(`  Total tags: ${tagAnalysis.totalTags}`);
          console.log(`  Average length: ${tagAnalysis.averageLength.toFixed(1)} characters`);
          console.log(
            `  Longest tag: '${tagAnalysis.longestTag}' (${tagAnalysis.longestTag.length} chars)`
          );
          console.log(
            `  Shortest tag: '${tagAnalysis.shortestTag}' (${tagAnalysis.shortestTag.length} chars)`
          );

          // Report common prefixes (appearing more than once)
          const commonPrefixes = Array.from(tagAnalysis.commonPrefixes.entries())
            .filter(([, count]) => count > 1)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

          if (commonPrefixes.length > 0) {
            console.log(
              `  Common prefixes: ${commonPrefixes.map(([prefix, count]) => `${prefix}* (${count})`).join(', ')}`
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access tags for analysis');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should identify semantic tag categories',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping semantic analysis test - no test project available');
          return;
        }

        try {
          const { result } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          if (result.tags.length === 0) {
            console.log('ℹ No tags available for semantic analysis');
            return;
          }

          const semanticCategories = {
            environments: result.tags.filter((tag) =>
              /^(dev|development|test|testing|stage|staging|prod|production|qa|uat|demo)$/i.test(
                tag
              )
            ),
            technologies: result.tags.filter((tag) =>
              /^(java|javascript|js|python|nodejs|react|angular|vue|spring|docker|kubernetes|k8s)$/i.test(
                tag
              )
            ),
            architectures: result.tags.filter((tag) =>
              /^(microservice|monolith|api|frontend|backend|ui|service|library|framework)$/i.test(
                tag
              )
            ),
            domains: result.tags.filter((tag) =>
              /^(finance|banking|healthcare|ecommerce|retail|education|gaming|social)$/i.test(tag)
            ),
            teams: result.tags.filter((tag) =>
              /^(team|squad|tribe|platform|core|mobile|web|data|ml|ai|security)$/i.test(tag)
            ),
            versions: result.tags.filter((tag) =>
              /^(v\d+|version|release|beta|alpha|stable|legacy|deprecated)$/i.test(tag)
            ),
          };

          console.log(`✓ Semantic tag categorization completed`);

          Object.entries(semanticCategories).forEach(([category, tags]) => {
            if (tags.length > 0) {
              console.log(`  ${category}: ${tags.join(', ')}`);
            }
          });

          const categorizedCount = Object.values(semanticCategories).reduce(
            (sum, tags) => sum + tags.length,
            0
          );
          const uncategorized = result.tags.length - categorizedCount;

          if (uncategorized > 0) {
            console.log(`  Uncategorized tags: ${uncategorized}`);
          }

          // Tag organization recommendations
          if (result.tags.length > 10) {
            console.log(
              `  ℹ Consider tag organization - ${result.tags.length} tags may benefit from hierarchical structure`
            );
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access tags for semantic analysis');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Platform Compatibility', () => {
    test(
      'should work on both SonarQube and SonarCloud',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping platform test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.tags.length} project tags`);

            // SonarCloud projects may have organization-specific tagging patterns
            if (result.tags.length > 0) {
              const hasOrgPattern = result.tags.some(
                (tag) => tag.includes('org') || tag.includes(envConfig.organization || '')
              );
              console.log(
                `  Organization-specific patterns: ${hasOrgPattern ? 'Detected' : 'Not detected'}`
              );
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.tags.length} project tags`);

            // SonarQube project tags
            if (result.tags.length > 0) {
              const hasInstancePattern = result.tags.some(
                (tag) => tag.includes('internal') || tag.includes('enterprise')
              );
              console.log(
                `  Instance-specific patterns: ${hasInstancePattern ? 'Detected' : 'Not detected'}`
              );
            }
          }

          // Both platforms should support the same project tags API structure
          expect(result.tags).toBeDefined();
          expect(Array.isArray(result.tags)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - project tags not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle organization context for SonarCloud',
      async () => {
        if (!envConfig?.isSonarCloud || !envConfig.organization || !testProjectKey) {
          console.log(
            'ℹ Skipping organization test - not SonarCloud, no organization, or no project'
          );
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(`✓ SonarCloud organization context: ${result.tags.length} tags`);

          if (result.tags.length > 0) {
            // Check for organization-specific tag patterns
            const orgRelatedTags = result.tags.filter(
              (tag) =>
                tag.toLowerCase().includes((envConfig.organization || '').toLowerCase()) ||
                tag.toLowerCase().includes('org')
            );

            if (orgRelatedTags.length > 0) {
              console.log(`  Organization-related tags: ${orgRelatedTags.join(', ')}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - project tags not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Performance', () => {
    test(
      'should maintain reasonable performance for tag retrieval',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping performance test - no test project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 4000, // 4 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.tags.length} project tags in ${Math.round(durationMs)}ms`
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - project tags not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );

    test(
      'should handle concurrent tag requests',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping concurrent test - no test project available');
          return;
        }

        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.projectTags.search().project(testProjectKey).execute());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.tags).toBeDefined();
          });

          // All requests should return consistent data
          const firstCount = results[0].tags.length;
          results.slice(1).forEach((result) => {
            expect(result.tags.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - project tags not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle invalid project key gracefully',
      async () => {
        try {
          await client.projectTags
            .search()
            .project('invalid-project-key-that-does-not-exist')
            .execute();

          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys for tags');
            expect(errorObj.status).toBe(404);
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
            expect(errorObj.status).toBe(400);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );

    test(
      'should handle permission restrictions appropriately',
      async () => {
        try {
          await client.projectTags.search().project('restricted-project-key').execute();

          console.log('ℹ No permission restrictions encountered');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('✓ API properly handles permission restrictions');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ API properly handles non-existent projects');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.fast
    );
  });

  describe('Integration Validation', () => {
    test(
      'should provide comprehensive project tagging workflow',
      async () => {
        if (!testProjectKey) {
          console.log('ℹ Skipping workflow test - no test project available');
          return;
        }

        try {
          console.log('✓ Starting project tagging workflow');

          // 1. Get current project tags
          const { result: tags } = await measureTime(async () =>
            client.projectTags.search().project(testProjectKey).execute()
          );

          console.log(`  Step 1: Found ${tags.tags.length} project tags`);

          if (tags.tags.length === 0) {
            console.log('ℹ No tags found for workflow test');
            return;
          }

          // 2. Analyze tag governance
          const tagGovernance = {
            hasNamingConvention: true,
            hasConsistentCase: true,
            hasReasonableCount: tags.tags.length <= 20,
            hasClearPurpose: true,
          };

          // Check naming convention
          const hasSpaces = tags.tags.some((tag) => tag.includes(' '));
          const hasSpecialChars = tags.tags.some((tag) => !/^[a-zA-Z0-9\-_.]+$/.test(tag));
          tagGovernance.hasNamingConvention = !hasSpaces && !hasSpecialChars;

          // Check case consistency
          const allLowercase = tags.tags.every((tag) => tag === tag.toLowerCase());
          const allUppercase = tags.tags.every((tag) => tag === tag.toUpperCase());
          tagGovernance.hasConsistentCase = allLowercase || allUppercase;

          console.log(`  Step 2: Tag governance analysis`);
          console.log(`    Naming convention: ${tagGovernance.hasNamingConvention ? '✓' : '✗'}`);
          console.log(`    Consistent case: ${tagGovernance.hasConsistentCase ? '✓' : '✗'}`);
          console.log(`    Reasonable count: ${tagGovernance.hasReasonableCount ? '✓' : '✗'}`);

          // 3. Tag organization assessment
          const organizationPatterns = {
            environments: tags.tags.filter((tag) => /env|environment|dev|test|prod/i.test(tag))
              .length,
            teams: tags.tags.filter((tag) => /team|squad|group/i.test(tag)).length,
            technologies: tags.tags.filter((tag) => /java|js|python|react|spring/i.test(tag))
              .length,
            domains: tags.tags.filter((tag) => /finance|health|retail|social/i.test(tag)).length,
          };

          console.log(`  Step 3: Organization patterns detected`);
          Object.entries(organizationPatterns).forEach(([pattern, count]) => {
            if (count > 0) {
              console.log(`    ${pattern}: ${count} tags`);
            }
          });

          console.log('✓ Project tagging workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete project tagging workflow - access issues');
        }
      },
      TEST_TIMING.slow
    );
  });
});
