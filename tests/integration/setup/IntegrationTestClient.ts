/**
 * Integration test client setup
 *
 * Provides configured SonarQube client instances for integration testing
 * with real API calls and proper error handling.
 */

import { SonarQubeClient } from '../../../src/index.js';
import type { IntegrationTestConfig } from '../config/environment.js';
import type { TestConfiguration } from '../config/testConfig.js';

/**
 * Enhanced client for integration testing
 */
export class IntegrationTestClient extends SonarQubeClient {
  public readonly config: IntegrationTestConfig;
  public readonly testConfig: TestConfiguration;

  constructor(config: IntegrationTestConfig, testConfig: TestConfiguration) {
    super(
      config.url,
      config.token,
      config.organization ? { organization: config.organization } : undefined,
    );

    this.config = config;
    this.testConfig = testConfig;
  }

  /**
   * Validates that the client can connect to the SonarQube instance
   */
  async validateConnection(): Promise<void> {
    try {
      // Try a simple system ping to validate connectivity
      await this.system.ping();
    } catch (error) {
      throw new Error(
        `Failed to connect to ${this.config.platform} at ${this.config.url}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Gets information about the connected instance
   */
  async getInstanceInfo(): Promise<{
    platform: string;
    version?: string;
    organization?: string;
  }> {
    try {
      const version = await this.server.version();
      return {
        platform: this.config.platform,
        version,
        ...(this.config.organization && { organization: this.config.organization }),
      };
    } catch {
      // Fallback if version endpoint is not available
      return {
        platform: this.config.platform,
        ...(this.config.organization && { organization: this.config.organization }),
      };
    }
  }

  /**
   * Checks if the current user has admin permissions
   */
  async hasAdminPermissions(): Promise<boolean> {
    try {
      // Try to access system health (requires admin permissions)
      await this.system.health();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the instance supports a specific feature
   */
  supportsFeature(feature: string): boolean {
    switch (feature) {
      case 'organizations':
        return this.config.isSonarCloud;
      case 'editions':
        return !this.config.isSonarCloud;
      case 'quality-gates':
      case 'quality-profiles':
      case 'projects':
      case 'users':
      case 'issues':
        return true;
      default:
        return false;
    }
  }

  /**
   * Creates a test project for integration tests
   */
  async createTestProject(projectKey: string, projectName?: string): Promise<void> {
    if (!this.testConfig.allowDestructiveTests) {
      throw new Error('Test project creation requires destructive tests to be enabled');
    }

    await this.projects.create({
      project: projectKey,
      name: projectName || `Integration Test Project ${projectKey}`,
      visibility: 'private',
    });
  }

  /**
   * Deletes a test project (cleanup)
   */
  async deleteTestProject(projectKey: string): Promise<void> {
    if (!this.testConfig.allowDestructiveTests) {
      // Skip deletion if destructive tests are not enabled
      return;
    }

    try {
      await this.projects.delete({ project: projectKey });
    } catch (error: unknown) {
      // Ignore errors during cleanup
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to delete test project ${projectKey}:`, errorMessage);
    }
  }

  /**
   * Generates a unique test project key
   */
  generateTestProjectKey(prefix = 'integration-test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }
}
