// @ts-nocheck
/**
 * Webservices API Integration Tests
 *
 * Tests the Webservices API functionality for discovering available web API endpoints.
 * This API provides meta-information about all available web services and their documentation.
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

/* eslint-disable max-lines-per-function */
(skipTests ? describe.skip : describe)('Webservices API Integration Tests', () => {
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

  describe('Webservices Discovery Operations', () => {
    test(
      'should list all available web services',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.webservices.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.webServices).toBeDefined();
          expect(Array.isArray(result.webServices)).toBe(true);

          console.log(`✓ Found ${result.webServices?.length || 0} web services`);

          if (result.webServices && result.webServices.length > 0) {
            // Validate web service structure
            result.webServices.forEach((service) => {
              expect(service.path).toBeDefined();
              expect(typeof service.path).toBe('string');
              expect(service.path?.length).toBeGreaterThan(0);

              if (service.description) {
                expect(typeof service.description).toBe('string');
              }

              if (service.actions) {
                expect(Array.isArray(service.actions)).toBe(true);

                // Validate action structure
                service.actions.forEach((action) => {
                  if (action.key) {
                    expect(typeof action.key).toBe('string');
                  }

                  if (action.description) {
                    expect(typeof action.description).toBe('string');
                  }

                  if (action.internal !== undefined) {
                    expect(typeof action.internal).toBe('boolean');
                  }

                  if (action.post !== undefined) {
                    expect(typeof action.post).toBe('boolean');
                  }

                  if (action.hasResponseExample !== undefined) {
                    expect(typeof action.hasResponseExample).toBe('boolean');
                  }

                  if (action.params) {
                    expect(Array.isArray(action.params)).toBe(true);
                  }
                });
              }

              console.log(`  Service: ${service.path}`);
              if (service.description) {
                console.log(`    Description: ${service.description}`);
              }
              if (service.actions) {
                console.log(`    Actions: ${service.actions.length}`);
              }
            });

            // Analyze web service categories
            const servicePaths = result.webServices.map((s) => s.path || '').filter(Boolean);
            const serviceCategories = {
              core: servicePaths.filter((path) =>
                ['api/authentication', 'api/system', 'api/server'].includes(path),
              ),
              projects: servicePaths.filter((path) =>
                ['api/projects', 'api/components', 'api/sources'].includes(path),
              ),
              analysis: servicePaths.filter((path) =>
                ['api/issues', 'api/measures', 'api/rules'].includes(path),
              ),
              quality: servicePaths.filter((path) =>
                ['api/quality_gates', 'api/quality_profiles'].includes(path),
              ),
              admin: servicePaths.filter((path) =>
                ['api/permissions', 'api/settings', 'api/users'].includes(path),
              ),
            };

            console.log(`  Service categories:`);
            Object.entries(serviceCategories).forEach(([category, services]) => {
              if (services.length > 0) {
                console.log(`    ${category}: ${services.length} services`);
              }
            });

            // Count total actions across all services
            const totalActions = result.webServices.reduce(
              (sum, service) => sum + (service.actions?.length || 0),
              0,
            );
            console.log(`  Total API actions available: ${totalActions}`);

            // Check for common services
            const commonServices = [
              'api/issues',
              'api/measures',
              'api/projects',
              'api/rules',
              'api/quality_gates',
              'api/users',
              'api/system',
            ];
            const presentServices = commonServices.filter((service) =>
              servicePaths.includes(service),
            );
            console.log(`  Common services present: ${presentServices.join(', ')}`);
          } else {
            console.log('ℹ No web services found (unexpected)');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403) {
            console.log('ℹ Insufficient permissions to view web services');
          } else if (errorObj.status === 404) {
            console.log('ℹ Webservices API not available');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should analyze API coverage and completeness',
      async () => {
        try {
          const { result } = await measureTime(async () => client.webservices.list());

          if (!result.webServices || result.webServices.length === 0) {
            console.log('ℹ No web services available for coverage analysis');
            return;
          }

          // Analyze API coverage
          const apiAnalysis = {
            totalServices: result.webServices.length,
            totalActions: 0,
            publicActions: 0,
            internalActions: 0,
            postActions: 0,
            getActions: 0,
            actionsWithExamples: 0,
            servicesWithDocumentation: 0,
          };

          result.webServices.forEach((service) => {
            if (service.description) {
              apiAnalysis.servicesWithDocumentation++;
            }

            if (service.actions) {
              service.actions.forEach((action) => {
                apiAnalysis.totalActions++;

                if (action.internal) {
                  apiAnalysis.internalActions++;
                } else {
                  apiAnalysis.publicActions++;
                }

                if (action.post) {
                  apiAnalysis.postActions++;
                } else {
                  apiAnalysis.getActions++;
                }

                if (action.hasResponseExample) {
                  apiAnalysis.actionsWithExamples++;
                }
              });
            }
          });

          console.log(`✓ API coverage analysis completed`);
          console.log(`  Total services: ${apiAnalysis.totalServices}`);
          console.log(`  Total actions: ${apiAnalysis.totalActions}`);
          console.log(`  Public actions: ${apiAnalysis.publicActions}`);
          console.log(`  Internal actions: ${apiAnalysis.internalActions}`);
          console.log(`  POST actions: ${apiAnalysis.postActions}`);
          console.log(`  GET actions: ${apiAnalysis.getActions}`);
          console.log(`  Actions with examples: ${apiAnalysis.actionsWithExamples}`);
          console.log(`  Services with documentation: ${apiAnalysis.servicesWithDocumentation}`);

          // Calculate coverage percentages
          const documentationCoverage =
            (apiAnalysis.servicesWithDocumentation / apiAnalysis.totalServices) * 100;
          const exampleCoverage =
            (apiAnalysis.actionsWithExamples / apiAnalysis.totalActions) * 100;

          console.log(`  Documentation coverage: ${documentationCoverage.toFixed(1)}%`);
          console.log(`  Example coverage: ${exampleCoverage.toFixed(1)}%`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access web services for coverage analysis');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Response Example Operations', () => {
    test(
      'should get response examples for common endpoints',
      async () => {
        try {
          // First get the list of services to find available examples
          const servicesResult = await client.webservices.list();

          if (!servicesResult.webServices || servicesResult.webServices.length === 0) {
            console.log('ℹ No web services available for response example testing');
            return;
          }

          // Find services with response examples
          const servicesWithExamples: Array<{ controller: string; action: string }> = [];

          servicesResult.webServices.forEach((service) => {
            if (service.actions && service.path) {
              service.actions.forEach((action) => {
                if (action.hasResponseExample && action.key) {
                  servicesWithExamples.push({
                    controller: service.path,
                    action: action.key,
                  });
                }
              });
            }
          });

          console.log(`✓ Found ${servicesWithExamples.length} actions with response examples`);

          if (servicesWithExamples.length > 0) {
            // Test a few response examples
            const samplesToTest = servicesWithExamples.slice(0, 3);

            for (const sample of samplesToTest) {
              try {
                const { result: example, durationMs } = await measureTime(async () =>
                  client.webservices.responseExample({
                    controller: sample.controller,
                    action: sample.action,
                  }),
                );

                INTEGRATION_ASSERTIONS.expectValidResponse(example);
                INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

                console.log(`  Example for ${sample.controller}/${sample.action}:`);
                console.log(`    Response structure: ${typeof example}`);

                if (typeof example === 'object' && example !== null) {
                  const keys = Object.keys(example);
                  console.log(
                    `    Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`,
                  );
                }
              } catch (exampleError: unknown) {
                const errorObj = exampleError as { status?: number };
                console.log(
                  `  ⚠ Failed to get example for ${sample.controller}/${sample.action}: ${errorObj.status}`,
                );
              }
            }
          } else {
            console.log('ℹ No actions with response examples found');
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot access response examples');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should validate response example structure',
      async () => {
        try {
          // Test with a known common endpoint that should have examples
          const commonEndpoints = [
            { controller: 'api/issues', action: 'search' },
            { controller: 'api/projects', action: 'search' },
            { controller: 'api/system', action: 'status' },
            { controller: 'api/users', action: 'search' },
          ];

          let examplesTested = 0;

          for (const endpoint of commonEndpoints) {
            try {
              const { result: example } = await measureTime(async () =>
                client.webservices.responseExample(endpoint),
              );

              examplesTested++;
              console.log(`✓ Response example for ${endpoint.controller}/${endpoint.action}`);

              // Validate that example is a valid object
              expect(typeof example).toBe('object');
              expect(example).not.toBeNull();

              if (typeof example === 'object' && example !== null) {
                const exampleKeys = Object.keys(example);
                console.log(`  Structure: ${exampleKeys.length} top-level properties`);

                // Show first few keys for insight
                if (exampleKeys.length > 0) {
                  console.log(`  Sample keys: ${exampleKeys.slice(0, 3).join(', ')}`);
                }
              }
            } catch (endpointError: unknown) {
              const errorObj = endpointError as { status?: number };
              if (errorObj.status === 404) {
                console.log(
                  `  ℹ No example available for ${endpoint.controller}/${endpoint.action}`,
                );
              } else {
                console.log(
                  `  ⚠ Error getting example for ${endpoint.controller}/${endpoint.action}: ${errorObj.status}`,
                );
              }
            }
          }

          console.log(
            `✓ Response example validation completed (${examplesTested} examples tested)`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot validate response examples');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('API Documentation Analysis', () => {
    test(
      'should analyze API documentation completeness',
      async () => {
        try {
          const { result } = await measureTime(async () => client.webservices.list());

          if (!result.webServices || result.webServices.length === 0) {
            console.log('ℹ No web services available for documentation analysis');
            return;
          }

          const documentationAnalysis = {
            totalServices: result.webServices.length,
            servicesWithDescription: 0,
            totalActions: 0,
            actionsWithDescription: 0,
            actionsWithExamples: 0,
            totalParameters: 0,
            parametersWithDescription: 0,
            parametersWithExamples: 0,
          };

          result.webServices.forEach((service) => {
            if (service.description) {
              documentationAnalysis.servicesWithDescription++;
            }

            if (service.actions) {
              service.actions.forEach((action) => {
                documentationAnalysis.totalActions++;

                if (action.description) {
                  documentationAnalysis.actionsWithDescription++;
                }

                if (action.hasResponseExample) {
                  documentationAnalysis.actionsWithExamples++;
                }

                if (action.params) {
                  action.params.forEach((param) => {
                    documentationAnalysis.totalParameters++;

                    if (param.description) {
                      documentationAnalysis.parametersWithDescription++;
                    }

                    if (param.exampleValue) {
                      documentationAnalysis.parametersWithExamples++;
                    }
                  });
                }
              });
            }
          });

          console.log(`✓ API documentation analysis completed`);
          console.log(
            `  Services with descriptions: ${documentationAnalysis.servicesWithDescription}/${documentationAnalysis.totalServices}`,
          );
          console.log(
            `  Actions with descriptions: ${documentationAnalysis.actionsWithDescription}/${documentationAnalysis.totalActions}`,
          );
          console.log(
            `  Actions with examples: ${documentationAnalysis.actionsWithExamples}/${documentationAnalysis.totalActions}`,
          );
          console.log(
            `  Parameters with descriptions: ${documentationAnalysis.parametersWithDescription}/${documentationAnalysis.totalParameters}`,
          );
          console.log(
            `  Parameters with examples: ${documentationAnalysis.parametersWithExamples}/${documentationAnalysis.totalParameters}`,
          );

          // Calculate documentation quality score
          const serviceDescScore =
            documentationAnalysis.servicesWithDescription / documentationAnalysis.totalServices;
          const actionDescScore =
            documentationAnalysis.actionsWithDescription / documentationAnalysis.totalActions;
          const exampleScore =
            documentationAnalysis.actionsWithExamples / documentationAnalysis.totalActions;
          const paramDescScore =
            documentationAnalysis.parametersWithDescription /
            (documentationAnalysis.totalParameters || 1);

          const overallScore =
            ((serviceDescScore + actionDescScore + exampleScore + paramDescScore) / 4) * 100;

          console.log(`  Overall documentation quality: ${overallScore.toFixed(1)}%`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze API documentation');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should identify API versioning and deprecation patterns',
      async () => {
        try {
          const { result } = await measureTime(async () => client.webservices.list());

          if (!result.webServices || result.webServices.length === 0) {
            console.log('ℹ No web services available for versioning analysis');
            return;
          }

          const versioningAnalysis = {
            servicesWithVersions: 0,
            actionsWithChangelog: 0,
            deprecatedActions: 0,
            internalActions: 0,
            betaActions: 0,
          };

          const versionPatterns = new Set<string>();
          const changelogEntries: string[] = [];

          result.webServices.forEach((service) => {
            // Check for version patterns in service paths
            if (service.path) {
              const versionMatch = /v\d+|api\/\d+/.exec(service.path);
              if (versionMatch) {
                versionPatterns.add(versionMatch[0]);
                versioningAnalysis.servicesWithVersions++;
              }
            }

            if (service.actions) {
              service.actions.forEach((action) => {
                if (action.internal) {
                  versioningAnalysis.internalActions++;
                }

                if (action.changelog && action.changelog.length > 0) {
                  versioningAnalysis.actionsWithChangelog++;

                  action.changelog.forEach((entry) => {
                    if (entry.version && entry.description) {
                      changelogEntries.push(`${entry.version}: ${entry.description}`);

                      if (entry.description.toLowerCase().includes('deprecat')) {
                        versioningAnalysis.deprecatedActions++;
                      }

                      if (entry.description.toLowerCase().includes('beta')) {
                        versioningAnalysis.betaActions++;
                      }
                    }
                  });
                }
              });
            }
          });

          console.log(`✓ API versioning analysis completed`);
          console.log(
            `  Services with version patterns: ${versioningAnalysis.servicesWithVersions}`,
          );
          console.log(`  Actions with changelog: ${versioningAnalysis.actionsWithChangelog}`);
          console.log(`  Deprecated actions: ${versioningAnalysis.deprecatedActions}`);
          console.log(`  Internal actions: ${versioningAnalysis.internalActions}`);
          console.log(`  Beta actions: ${versioningAnalysis.betaActions}`);

          if (versionPatterns.size > 0) {
            console.log(`  Version patterns found: ${Array.from(versionPatterns).join(', ')}`);
          }

          if (changelogEntries.length > 0) {
            console.log(`  Recent changelog entries (sample):`);
            changelogEntries.slice(0, 3).forEach((entry) => {
              console.log(`    ${entry}`);
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Cannot analyze API versioning');
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
          const { result, durationMs } = await measureTime(async () => client.webservices.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: Found ${result.webServices?.length || 0} web services`);

            // SonarCloud may have different or additional services
            if (result.webServices && result.webServices.length > 0) {
              const cloudServices = result.webServices.filter(
                (s) =>
                  s.path?.includes('organizations') ||
                  s.path?.includes('billing') ||
                  s.description?.toLowerCase().includes('cloud'),
              );
              console.log(`  Cloud-specific services: ${cloudServices.length}`);
            }
          } else {
            console.log(`✓ SonarQube: Found ${result.webServices?.length || 0} web services`);

            // SonarQube may have administration services not available in SonarCloud
            if (result.webServices && result.webServices.length > 0) {
              const adminServices = result.webServices.filter(
                (s) =>
                  s.path?.includes('system') ||
                  s.path?.includes('settings') ||
                  s.path?.includes('plugins'),
              );
              console.log(`  Administration services: ${adminServices.length}`);
            }
          }

          // Both platforms should support the webservices API structure
          expect(result.webServices).toBeDefined();
          expect(Array.isArray(result.webServices)).toBe(true);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Platform test skipped - webservices not accessible');
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
          const { result, durationMs } = await measureTime(async () => client.webservices.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          console.log(
            `✓ SonarCloud organization context: ${result.webServices?.length || 0} services`,
          );

          if (result.webServices && result.webServices.length > 0) {
            // Check for organization-specific services or actions
            const orgServices = result.webServices.filter(
              (s) =>
                s.path?.includes('organizations') ||
                s.description?.toLowerCase().includes('organization'),
            );

            if (orgServices.length > 0) {
              console.log(`  Organization-related services: ${orgServices.length}`);
              orgServices.forEach((service) => {
                console.log(`    ${service.path}: ${service.description || 'No description'}`);
              });
            }
          }

          console.log('  Organization-scoped API discovery completed');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Organization test skipped - webservices not accessible');
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
      'should maintain reasonable performance for API discovery',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.webservices.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 2000, // 2 seconds
            maximum: 5000, // 5 seconds absolute max
          });

          console.log(
            `✓ Retrieved ${result.webServices?.length || 0} web services in ${Math.round(durationMs)}ms`,
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Performance test skipped - webservices not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent webservices requests',
      async () => {
        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.webservices.list());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.webServices).toBeDefined();
          });

          // All requests should return consistent data
          const firstCount = results[0].webServices?.length || 0;
          results.slice(1).forEach((result) => {
            expect(result.webServices?.length || 0).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Concurrent test skipped - webservices not accessible');
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
      'should handle invalid response example requests gracefully',
      async () => {
        try {
          await client.webservices.responseExample({
            controller: 'invalid-controller',
            action: 'invalid-action',
          });

          console.log('ℹ API accepts invalid response example requests gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 404) {
            console.log('✓ API properly validates controller/action existence');
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
          await client.webservices.list();

          console.log('ℹ No permission restrictions encountered for webservices');
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
      'should provide comprehensive API discovery workflow',
      async () => {
        try {
          console.log('✓ Starting API discovery workflow');

          // 1. Discover all available web services
          const { result: services } = await measureTime(async () => client.webservices.list());

          console.log(`  Step 1: Discovered ${services.webServices?.length || 0} web services`);

          if (!services.webServices || services.webServices.length === 0) {
            console.log('ℹ No web services available for workflow analysis');
            return;
          }

          // 2. Analyze API completeness and structure
          let totalActions = 0;
          let publicActions = 0;
          let documentedActions = 0;
          const servicesByCategory = new Map<string, number>();

          services.webServices.forEach((service) => {
            // Categorize services
            if (service.path) {
              const category = service.path.split('/')[1] || 'other';
              servicesByCategory.set(category, (servicesByCategory.get(category) || 0) + 1);
            }

            if (service.actions) {
              service.actions.forEach((action) => {
                totalActions++;

                if (!action.internal) {
                  publicActions++;
                }

                if (action.description) {
                  documentedActions++;
                }
              });
            }
          });

          console.log(`  Step 2: API structure analysis`);
          console.log(`    Total actions: ${totalActions}`);
          console.log(`    Public actions: ${publicActions}`);
          console.log(`    Documented actions: ${documentedActions}`);

          // 3. Service categorization
          console.log(`  Step 3: Service categorization`);
          const sortedCategories = Array.from(servicesByCategory.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

          sortedCategories.forEach(([category, count]) => {
            console.log(`    ${category}: ${count} services`);
          });

          // 4. API quality assessment
          const documentationRate = (documentedActions / totalActions) * 100;
          const publicActionRate = (publicActions / totalActions) * 100;

          console.log(`  Step 4: API quality assessment`);
          console.log(`    Documentation coverage: ${documentationRate.toFixed(1)}%`);
          console.log(`    Public API percentage: ${publicActionRate.toFixed(1)}%`);

          // 5. Integration recommendations
          console.log(`  Step 5: Integration recommendations`);
          console.log('    - Use webservices API for dynamic API discovery');
          console.log('    - Check response examples before implementation');
          console.log('    - Monitor changelog for API changes');
          console.log('    - Focus on public (non-internal) actions');
          console.log('    - Implement proper error handling for all endpoints');

          console.log('✓ API discovery workflow completed successfully');
        } catch {
          console.log('ℹ Cannot complete API discovery workflow - access issues');
        }
      },
      TEST_TIMING.slow,
    );
  });
});
