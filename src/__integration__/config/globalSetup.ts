/**
 * Global Setup for Integration Tests
 *
 * This file runs once before all integration tests begin.
 * It performs environment validation and global initialization.
 */

import { canRunIntegrationTests, getIntegrationTestConfig } from './environment';
import { getTestConfiguration } from './testConfig';
import { IntegrationTestClient } from '../setup/IntegrationTestClient';

export default async function globalSetup(): Promise<void> {
  console.log(`\n┌${'─'.repeat(78)}┐`);
  console.log(`│${' '.repeat(20)}SonarQube Web API Client${' '.repeat(35)}│`);
  console.log(`│${' '.repeat(25)}Integration Tests${' '.repeat(36)}│`);
  console.log(`└${'─'.repeat(78)}┘`);
  console.log('\n🚀 Starting Integration Test Global Setup...\n');

  // Validate integration test environment
  if (!canRunIntegrationTests()) {
    console.error('❌ Integration test environment not configured\n');
    console.error('📋 Required environment variables:');
    console.error('   • SONARQUBE_URL: The SonarQube/SonarCloud instance URL');
    console.error('   • SONARQUBE_TOKEN: Authentication token for the instance\n');
    console.error('📋 Optional environment variables:');
    console.error('   • SONARQUBE_ORGANIZATION: Organization key (required for SonarCloud)');
    console.error('   • INTEGRATION_TEST_TIMEOUT: Test timeout in milliseconds (default: 30000)');
    console.error(
      '   • INTEGRATION_TEST_DESTRUCTIVE: Allow tests that create/delete data (default: false)\n'
    );
    console.error('💡 Example setup:');
    console.error('   export SONARQUBE_URL="https://sonarcloud.io"');
    console.error('   export SONARQUBE_TOKEN="your_token_here"');
    console.error('   export SONARQUBE_ORGANIZATION="your_org_key"');
    process.exit(1);
  }

  const envConfig = getIntegrationTestConfig();
  const testConfig = getTestConfiguration(envConfig);

  console.log('📋 Integration Test Configuration:');
  console.log(`   🏢 Platform:           ${envConfig.platform.toUpperCase()}`);
  console.log(`   🌐 URL:                ${envConfig.url}`);
  console.log(`   🏛️  Organization:       ${envConfig.organization || 'N/A'}`);
  console.log(
    `   💥 Destructive Tests:  ${testConfig.allowDestructiveTests ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(
    `   👨‍💼 Admin Tests:        ${testConfig.runAdminTests ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(
    `   🏢 Enterprise Tests:   ${testConfig.runEnterpriseTests ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(`   ⏱️  Test Timeout:       ${testConfig.defaultTimeout}ms`);

  // Validate connection to SonarQube/SonarCloud instance
  try {
    console.log('🔍 Validating connection to SonarQube instance...');
    const client = new IntegrationTestClient(envConfig, testConfig);
    await client.validateConnection();
    console.log('✅ Successfully connected to SonarQube instance');

    // Try to get instance information for better test result interpretation
    try {
      const instanceInfo = await client.getInstanceInfo();
      console.log('🔍 Detecting instance capabilities...');

      if (instanceInfo.version) {
        console.log(`   📋 Version: ${instanceInfo.version}`);
        // Store version globally for the reporter
        (global as Record<string, unknown>)['__SONARQUBE_VERSION__'] = instanceInfo.version;
      }

      // Try to detect edition (this might not always be available)
      try {
        const systemInfo = await client.system.info();
        if (systemInfo['edition']) {
          const edition = systemInfo['edition'];
          console.log(`   🏢 Edition: ${edition as string}`);
          (global as Record<string, unknown>)['__SONARQUBE_EDITION__'] = edition;
        }
      } catch {
        // Edition info not available, that's OK
      }

      console.log('✅ Instance analysis complete');
    } catch (_error) {
      console.log('⚠️  Could not fully analyze instance (tests will still run)');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to connect to SonarQube instance:', errorMessage);
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
    jest.setTimeout(testConfig.defaultTimeout);
  }

  console.log('✅ Global Setup Complete - Ready to run integration tests');
}
