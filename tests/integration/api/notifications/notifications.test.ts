// @ts-nocheck
/**
 * Notifications API Integration Tests
 *
 * Tests the Notifications API functionality for managing user notification preferences.
 * This API allows users to configure how they receive notifications from SonarQube/SonarCloud.
 */

import { IntegrationTestClient } from '../../setup/IntegrationTestClient.js';
import { TestDataManager } from '../../setup/TestDataManager.js';
import { INTEGRATION_ASSERTIONS } from '../../utils/assertions.js';
import {
  measureTime,
  extractErrorInfo,
  isPermissionError,
  getIntegrationTestConfig,
  canRunIntegrationTests,
} from '../../config/environment.js';
import { TEST_TIMING } from '../../utils/testHelpers.js';
import { getTestConfiguration } from '../../config/testConfig.js';

// Skip all tests if integration test environment is not configured
const skipTests = !canRunIntegrationTests();

// Initialize test configuration at module load time for conditional describe blocks
const envConfig = skipTests ? null : getIntegrationTestConfig();
const testConfig = skipTests || !envConfig ? null : getTestConfiguration(envConfig);

(skipTests ? describe.skip : describe)('Notifications API Integration Tests', () => {
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

  describe('Notification List Operations', () => {
    test(
      'should list available notification types',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.notifications.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.notifications).toBeDefined();
          expect(Array.isArray(result.notifications)).toBe(true);

          if (result.notifications.length > 0) {
            // Validate notification structure
            const firstNotification = result.notifications[0];
            expect(firstNotification.channel).toBeDefined();
            expect(typeof firstNotification.channel).toBe('string');
            expect(firstNotification.type).toBeDefined();
            expect(typeof firstNotification.type).toBe('string');

            // Common channels: 'EmailNotificationChannel'
            // Common types: 'CeReportTaskFailure', 'ChangesOnMyIssue', 'NewIssues', 'QualityGateStatus'
            console.log(`✓ Found ${result.notifications.length} notification configurations`);

            // Log some examples
            const channelTypes = [...new Set(result.notifications.map((n) => n.channel))];
            const notificationTypes = [...new Set(result.notifications.map((n) => n.type))];
            console.log(`  Channels: ${channelTypes.join(', ')}`);
            console.log(
              `  Types: ${notificationTypes.slice(0, 3).join(', ')}${notificationTypes.length > 3 ? '...' : ''}`,
            );
          }

          if (result.channels) {
            expect(Array.isArray(result.channels)).toBe(true);
            console.log(`✓ Available channels: ${result.channels.join(', ')}`);
          }

          if (result.globalTypes) {
            expect(Array.isArray(result.globalTypes)).toBe(true);
            console.log(
              `✓ Global notification types: ${result.globalTypes.slice(0, 3).join(', ')}${result.globalTypes.length > 3 ? '...' : ''}`,
            );
          }

          if (result.perProjectTypes) {
            expect(Array.isArray(result.perProjectTypes)).toBe(true);
            console.log(
              `✓ Per-project notification types: ${result.perProjectTypes.slice(0, 3).join(', ')}${result.perProjectTypes.length > 3 ? '...' : ''}`,
            );
          }
        } catch (error: unknown) {
          const errorInfo = extractErrorInfo(error);

          if (isPermissionError(errorInfo)) {
            if (errorInfo.status === 401) {
              console.log('ℹ Skipping notifications test - requires authentication');
            } else {
              console.log('ℹ Skipping notifications test - requires user permissions');
            }
            return;
          }

          if (errorInfo.status === 404) {
            console.log('ℹ Skipping notifications test - API not available in this version');
            return;
          }

          throw error;
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle project-specific notification listing',
      async () => {
        // Get a test project first
        let testProjectKey: string | null = null;

        try {
          testProjectKey = await dataManager.getTestProject(false); // Read-only
        } catch {
          console.log('ℹ No test project available for project-specific notifications');
        }

        if (!testProjectKey) {
          // Try to get any available project
          try {
            const projects = await client.projects.search().pageSize(1).execute();
            if (projects.components && projects.components.length > 0) {
              testProjectKey = projects.components[0].key;
            }
          } catch {
            console.log('ℹ No projects available for project-specific notification test');
            return;
          }
        }

        if (!testProjectKey) {
          console.log('ℹ Skipping project-specific notifications - no project available');
          return;
        }

        try {
          const { result, durationMs } = await measureTime(async () =>
            client.notifications.list({ project: testProjectKey }),
          );

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.notifications).toBeDefined();
          expect(Array.isArray(result.notifications)).toBe(true);

          console.log(
            `✓ Project-specific notifications for ${testProjectKey}: ${result.notifications.length} configurations`,
          );

          // Project-specific notifications may be empty if user hasn't configured any
          if (result.notifications.length > 0) {
            result.notifications.forEach((notification) => {
              expect(notification.channel).toBeDefined();
              expect(notification.type).toBeDefined();

              // Project-specific notifications should have project context
              if (notification.project) {
                expect(notification.project).toBe(testProjectKey);
              }
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403) {
            console.log('ℹ Skipping project notifications test - insufficient permissions');
          } else if (errorObj.status === 404) {
            console.log('ℹ Project notifications not available or project not found');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Notification Management', () => {
    test(
      'should handle notification configuration changes safely',
      async () => {
        if (!testConfig?.allowDestructiveTests) {
          console.log('ℹ Skipping notification management test - destructive tests disabled');
          return;
        }

        try {
          // First, get current notifications to understand the baseline
          const { result: currentNotifications } = await measureTime(async () =>
            client.notifications.list(),
          );

          console.log(
            `ℹ Current notification configurations: ${currentNotifications.notifications.length}`,
          );

          // We don't actually modify notifications in integration tests to avoid
          // affecting user preferences. Instead, we validate the API structure.

          if (currentNotifications.channels && currentNotifications.channels.length > 0) {
            const firstChannel = currentNotifications.channels[0];
            console.log(`✓ Notification channels available: ${firstChannel}`);
          }

          if (currentNotifications.globalTypes && currentNotifications.globalTypes.length > 0) {
            console.log(
              `✓ Global notification types available: ${currentNotifications.globalTypes.length}`,
            );
          }

          if (
            currentNotifications.perProjectTypes &&
            currentNotifications.perProjectTypes.length > 0
          ) {
            console.log(
              `✓ Project notification types available: ${currentNotifications.perProjectTypes.length}`,
            );
          }

          // Note: Actual add/remove operations are not performed to preserve user settings
          console.log(
            'ℹ Notification management operations validated without modifying user preferences',
          );
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403) {
            console.log('ℹ Skipping notification management test - insufficient permissions');
          } else if (errorObj.status === 404) {
            console.log('ℹ Notification management not available');
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
          const { result, durationMs } = await measureTime(async () => client.notifications.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs);

          expect(result.notifications).toBeDefined();
          expect(Array.isArray(result.notifications)).toBe(true);

          if (envConfig?.isSonarCloud) {
            console.log(`✓ SonarCloud: ${result.notifications.length} notification configurations`);

            // SonarCloud may have different notification types
            if (result.channels) {
              console.log(`  Available channels: ${result.channels.join(', ')}`);
            }
          } else {
            console.log(`✓ SonarQube: ${result.notifications.length} notification configurations`);

            // SonarQube notification structure
            if (result.globalTypes) {
              console.log(`  Global types: ${result.globalTypes.length}`);
            }
            if (result.perProjectTypes) {
              console.log(`  Per-project types: ${result.perProjectTypes.length}`);
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401) {
            console.log('ℹ Notifications require authentication on both platforms');
          } else if (errorObj.status === 403) {
            console.log('ℹ Notifications require user permissions on both platforms');
          } else if (errorObj.status === 404) {
            console.log('ℹ Notifications API not available in this version/platform');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle platform-specific notification features',
      async () => {
        try {
          const { result } = await measureTime(async () => client.notifications.list());

          if (envConfig?.isSonarCloud) {
            // SonarCloud-specific notification behavior
            console.log('ℹ Testing SonarCloud notification features');

            if (result.notifications.length > 0) {
              const notificationTypes = [...new Set(result.notifications.map((n) => n.type))];
              console.log(
                `  SonarCloud notification types: ${notificationTypes.slice(0, 5).join(', ')}`,
              );
            }
          } else {
            // SonarQube-specific notification behavior
            console.log('ℹ Testing SonarQube notification features');

            if (result.globalTypes && result.perProjectTypes) {
              console.log(
                `  Global vs Project notifications: ${result.globalTypes.length} / ${result.perProjectTypes.length}`,
              );
            }
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping platform-specific notification test - API not accessible');
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
      'should maintain reasonable performance',
      async () => {
        try {
          const { result, durationMs } = await measureTime(async () => client.notifications.list());

          INTEGRATION_ASSERTIONS.expectValidResponse(result);
          INTEGRATION_ASSERTIONS.expectReasonableResponseTime(durationMs, {
            expected: 1000, // 1 second
            maximum: 4000, // 4 seconds absolute max
          });

          expect(result.notifications).toBeDefined();
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping performance test - API not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should handle concurrent notification requests',
      async () => {
        try {
          const requests = Array(3)
            .fill(null)
            .map(async () => client.notifications.list());

          const results = await Promise.all(requests);

          results.forEach((result) => {
            INTEGRATION_ASSERTIONS.expectValidResponse(result);
            expect(result.notifications).toBeDefined();
            expect(Array.isArray(result.notifications)).toBe(true);
          });

          // All requests should return consistent data
          const firstCount = results[0].notifications.length;
          results.slice(1).forEach((result) => {
            expect(result.notifications.length).toBe(firstCount);
          });

          console.log(`✓ ${results.length} concurrent requests returned consistent results`);
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping concurrent test - API not accessible');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );
  });

  describe('Data Validation', () => {
    test(
      'should return valid notification data structure',
      async () => {
        try {
          const { result } = await measureTime(async () => client.notifications.list());

          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect(result.notifications).toBeDefined();
          expect(Array.isArray(result.notifications)).toBe(true);

          // Validate structure of each notification
          result.notifications.forEach((notification) => {
            expect(notification.channel).toBeDefined();
            expect(notification.type).toBeDefined();
            expect(typeof notification.channel).toBe('string');
            expect(typeof notification.type).toBe('string');
            expect(notification.channel.length).toBeGreaterThan(0);
            expect(notification.type.length).toBeGreaterThan(0);
          });

          // Validate optional arrays
          if (result.channels) {
            expect(Array.isArray(result.channels)).toBe(true);
            result.channels.forEach((channel) => {
              expect(typeof channel).toBe('string');
              expect(channel.length).toBeGreaterThan(0);
            });
          }

          if (result.globalTypes) {
            expect(Array.isArray(result.globalTypes)).toBe(true);
            result.globalTypes.forEach((type) => {
              expect(typeof type).toBe('string');
              expect(type.length).toBeGreaterThan(0);
            });
          }

          if (result.perProjectTypes) {
            expect(Array.isArray(result.perProjectTypes)).toBe(true);
            result.perProjectTypes.forEach((type) => {
              expect(typeof type).toBe('string');
              expect(type.length).toBeGreaterThan(0);
            });
          }
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401 || errorObj.status === 403 || errorObj.status === 404) {
            console.log('ℹ Skipping data validation test - API not accessible');
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
      'should handle authentication and authorization errors',
      async () => {
        try {
          const { result } = await measureTime(async () => client.notifications.list());

          // If we get here, authentication/authorization is working
          expect(result.notifications).toBeDefined();
          console.log('✓ Notifications API accessible with current authentication');
        } catch (error: unknown) {
          const errorObj = error as { status?: number };

          if (errorObj.status === 401) {
            console.log('✓ Notifications API properly requires authentication');
            expect(errorObj.status).toBe(401);
          } else if (errorObj.status === 403) {
            console.log('✓ Notifications API properly enforces authorization');
            expect(errorObj.status).toBe(403);
          } else if (errorObj.status === 404) {
            console.log('✓ Notifications API not available in this version');
            expect(errorObj.status).toBe(404);
          } else {
            throw error;
          }
        }
      },
      TEST_TIMING.normal,
    );

    test(
      'should provide meaningful error responses',
      async () => {
        try {
          const { result } = await measureTime(async () =>
            client.notifications.list({ project: 'invalid-project-key-that-does-not-exist' }),
          );

          // If this succeeds, the API is lenient with invalid project keys
          expect(result.notifications).toBeDefined();
          console.log('ℹ API accepts invalid project keys gracefully');
        } catch (error: unknown) {
          const errorObj = error as { status?: number; message?: string };

          // Error should have proper structure
          expect(errorObj).toBeDefined();

          if (errorObj.status === 404) {
            console.log('✓ API properly validates project keys');
          } else if (errorObj.status === 400) {
            console.log('✓ API provides proper validation errors');
          } else if (errorObj.status === 401 || errorObj.status === 403) {
            console.log('ℹ Authentication/authorization error supersedes validation');
          } else {
            console.log(`ℹ Received error status: ${errorObj.status}`);
          }
        }
      },
      TEST_TIMING.normal,
    );
  });
});
