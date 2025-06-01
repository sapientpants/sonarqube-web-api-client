/**
 * Global Setup for Integration Tests
 *
 * This file runs once before all integration tests begin.
 * It performs environment validation and global initialization.
 */

import { canRunIntegrationTests, getIntegrationTestConfig } from './environment';
import { getTestConfiguration } from './testConfig';
import { IntegrationTestClient } from '../setup/IntegrationTestClient';

export default async function globalSetup() {
  console.log('🚀 Starting Integration Test Global Setup...');

  // Validate integration test environment
  if (!canRunIntegrationTests()) {
    console.error('❌ Integration test environment not configured');
    console.error('   Required environment variables:');
    console.error('   - SONARQUBE_URL: The SonarQube/SonarCloud instance URL');
    console.error('   - SONARQUBE_TOKEN: Authentication token for the instance');
    console.error('   Optional environment variables:');
    console.error('   - SONARQUBE_ORGANIZATION: Organization key (required for SonarCloud)');
    console.error('   - INTEGRATION_TEST_TIMEOUT: Test timeout in milliseconds (default: 30000)');
    console.error(
      '   - INTEGRATION_TEST_ALLOW_DESTRUCTIVE: Allow tests that create/delete data (default: false)'
    );
    process.exit(1);
  }

  const envConfig = getIntegrationTestConfig();
  const testConfig = getTestConfiguration(envConfig);

  console.log('📋 Integration Test Configuration:');
  console.log(`   Platform: ${envConfig.platform}`);
  console.log(`   URL: ${envConfig.url}`);
  console.log(`   Organization: ${envConfig.organization || 'N/A'}`);
  console.log(`   Allow Destructive Tests: ${testConfig.allowDestructiveTests}`);
  console.log(`   Run Admin Tests: ${testConfig.runAdminTests}`);
  console.log(`   Run Enterprise Tests: ${testConfig.runEnterpriseTests}`);
  console.log(`   Test Timeout: ${testConfig.testTimeout}ms`);

  // Validate connection to SonarQube/SonarCloud instance
  try {
    console.log('🔍 Validating connection to SonarQube instance...');
    const client = new IntegrationTestClient(envConfig, testConfig);
    await client.validateConnection();
    console.log('✅ Successfully connected to SonarQube instance');
  } catch (error: any) {
    console.error('❌ Failed to connect to SonarQube instance:', error.message);
    console.error('   Please verify:');
    console.error('   - SONARQUBE_URL is correct and accessible');
    console.error('   - SONARQUBE_TOKEN is valid and has appropriate permissions');
    if (envConfig.isSonarCloud) {
      console.error('   - SONARQUBE_ORGANIZATION is correct (required for SonarCloud)');
    }
    process.exit(1);
  }

  // Set global timeout based on test configuration
  if (typeof jest !== 'undefined' && jest.setTimeout) {
    jest.setTimeout(testConfig.testTimeout);
  }

  console.log('✅ Global Setup Complete - Ready to run integration tests');
}
