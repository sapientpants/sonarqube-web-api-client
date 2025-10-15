/**
 * Global Teardown for Integration Tests
 *
 * This file runs once after all integration tests complete.
 * It performs cleanup and reports test completion status.
 */

import { canRunIntegrationTests, getIntegrationTestConfig } from './environment';
import { getTestConfiguration } from './testConfig';
import { IntegrationTestClient } from '../setup/IntegrationTestClient';
import { TestDataManager } from '../setup/TestDataManager';

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Starting Integration Test Global Teardown...');

  if (!canRunIntegrationTests()) {
    console.log('⏭️  Skipping teardown - integration tests were not configured');
    return;
  }

  const envConfig = getIntegrationTestConfig();
  const testConfig = getTestConfiguration(envConfig);

  try {
    // Perform global cleanup of any test data that might have been left behind
    console.log('🔍 Performing global cleanup of test data...');

    const client = new IntegrationTestClient(envConfig, testConfig);
    const dataManager = new TestDataManager(client);

    // Clean up any test projects that might have been created during tests
    await dataManager.cleanup();

    console.log('✅ Global cleanup completed successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Warning: Global cleanup encountered an error:', errorMessage);
    console.warn('   Some test data may need to be cleaned up manually');
    // Don't fail the teardown process - tests have already completed
  }

  // Log summary information
  console.log('📊 Integration Test Session Summary:');
  console.log(`   Platform: ${envConfig.platform}`);
  console.log(`   Instance: ${envConfig.url}`);
  console.log(`   Destructive Tests: ${String(testConfig.allowDestructiveTests)}`);

  if (testConfig.allowDestructiveTests) {
    console.log('   Note: Destructive tests were enabled - verify test data cleanup');
  }

  console.log('✅ Integration Test Global Teardown Complete');
}
