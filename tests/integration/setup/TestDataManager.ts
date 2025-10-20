/**
 * Test data management for integration tests
 *
 * Handles creation, tracking, and cleanup of test data to ensure
 * integration tests don't leave artifacts behind.
 */

import type { IntegrationTestClient } from './IntegrationTestClient.js';

export interface TestProject {
  key: string;
  name: string;
  created: boolean;
}

export interface TestData {
  projects: TestProject[];
  // Add other test data types as needed
  qualityGates: string[];
  qualityProfiles: string[];
}

/**
 * Manages test data lifecycle for integration tests
 */
export class TestDataManager {
  private readonly client: IntegrationTestClient;
  private testData: TestData;
  private readonly cleanupEnabled: boolean;

  constructor(client: IntegrationTestClient) {
    this.client = client;
    this.testData = {
      projects: [],
      qualityGates: [],
      qualityProfiles: [],
    };
    this.cleanupEnabled = client.testConfig.allowDestructiveTests;
  }

  /**
   * Creates a test project and tracks it for cleanup
   */
  async createTestProject(keyPrefix = 'integration-test', name?: string): Promise<TestProject> {
    const projectKey = this.client.generateTestProjectKey(keyPrefix);
    const projectName = name || `Integration Test - ${projectKey}`;

    const project: TestProject = {
      key: projectKey,
      name: projectName,
      created: false,
    };

    try {
      await this.client.createTestProject(projectKey, projectName);
      project.created = true;
      this.testData.projects.push(project);

      console.log(`✓ Created test project: ${projectKey}`);
      return project;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to create test project ${projectKey}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Finds an existing project to use for read-only tests
   */
  async findExistingProject(): Promise<string | null> {
    try {
      const searchBuilder = this.client.projects.search();
      const response = await searchBuilder.pageSize(1).execute();

      if (response.components && response.components.length > 0) {
        const firstComponent = response.components[0] as { key: string };
        return firstComponent.key;
      }

      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Failed to find existing project:', errorMessage);
      return null;
    }
  }

  /**
   * Gets or creates a test project for use in tests
   */
  async getTestProject(createIfNeeded = false): Promise<string | null> {
    // First try to find an existing project for read-only operations
    const existingProject = await this.findExistingProject();
    if (existingProject && !createIfNeeded) {
      return existingProject;
    }

    // Create a new test project if allowed and needed
    if (createIfNeeded && this.cleanupEnabled) {
      const project = await this.createTestProject();
      return project.key;
    }

    return existingProject;
  }

  /**
   * Waits for a project to be fully indexed (useful after creation)
   */
  async waitForProjectIndexing(projectKey: string, maxWaitMs = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Try to get project measures - this indicates the project is indexed
        await this.client.measures.component({
          component: projectKey,
          metricKeys: ['ncloc'],
        });
        return;
      } catch {
        // Project not ready yet, wait and retry
        await this.sleep(1000);
      }
    }

    console.warn(`Project ${projectKey} may not be fully indexed after ${maxWaitMs}ms`);
  }

  /**
   * Cleans up all test data created during tests
   */
  async cleanup(): Promise<void> {
    if (!this.cleanupEnabled) {
      console.log('ℹ Test data cleanup skipped (destructive tests disabled)');
      return;
    }

    let cleanupErrors = 0;

    // Cleanup test projects
    for (const project of this.testData.projects) {
      if (project.created) {
        try {
          await this.client.deleteTestProject(project.key);
          console.log(`✓ Cleaned up test project: ${project.key}`);
        } catch (error: unknown) {
          cleanupErrors++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`✗ Failed to cleanup project ${project.key}:`, errorMessage);
        }
      }
    }

    // Report cleanup results
    const totalItems = this.testData.projects.length;
    if (totalItems > 0) {
      if (cleanupErrors === 0) {
        console.log(`✓ Successfully cleaned up all ${String(totalItems)} test items`);
      } else {
        console.warn(
          `⚠ Cleaned up ${String(totalItems - cleanupErrors)}/${String(totalItems)} test items (${String(cleanupErrors)} errors)`,
        );
      }
    }

    // Reset test data tracking
    this.testData = {
      projects: [],
      qualityGates: [],
      qualityProfiles: [],
    };
  }

  /**
   * Gets summary of tracked test data
   */
  getTestDataSummary(): Record<string, number> {
    return {
      projects: this.testData.projects.length,
      qualityGates: this.testData.qualityGates.length,
      qualityProfiles: this.testData.qualityProfiles.length,
    };
  }

  /**
   * Utility function for sleeping/waiting
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
