#!/usr/bin/env tsx

/**
 * Integration Test Runner with Enhanced Output
 * 
 * Provides a more user-friendly interface for running integration tests
 * with better error reporting and success/failure categorization.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

interface TestRunOptions {
  platform?: 'sonarqube' | 'sonarcloud';
  verbose?: boolean;
  bail?: boolean;
  maxWorkers?: number;
}

function printHeader() {
  console.log('');
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│' + ' '.repeat(20) + 'SonarQube Web API Client' + ' '.repeat(20) + '     │');
  console.log('│' + ' '.repeat(25) + 'Integration Tests' + ' '.repeat(25) + '     │');
  console.log('└' + '─'.repeat(78) + '┘');
  console.log('');
}

function validateEnvironment(): { url: string; token: string; organization?: string } {
  const url = process.env.SONARQUBE_URL;
  const token = process.env.SONARQUBE_TOKEN;
  const organization = process.env.SONARQUBE_ORGANIZATION;

  if (!url) {
    throw new Error('SONARQUBE_URL environment variable is required');
  }

  if (!token) {
    throw new Error('SONARQUBE_TOKEN environment variable is required');
  }

  return { url, token, organization };
}

function detectPlatform(url: string): 'sonarqube' | 'sonarcloud' {
  if (url.includes('sonarcloud.io')) {
    return 'sonarcloud';
  }
  return 'sonarqube';
}

function printConfiguration(config: { url: string; token: string; organization?: string }) {
  const platform = detectPlatform(config.url);
  const maskedToken = config.token.substring(0, 8) + '...';
  
  console.log('🔧 Configuration:');
  console.log(`   Platform:     ${platform}`);
  console.log(`   URL:          ${config.url}`);
  console.log(`   Token:        ${maskedToken}`);
  
  if (config.organization) {
    console.log(`   Organization: ${config.organization}`);
  }
  
  console.log('');
}

function runTests(options: TestRunOptions = {}): void {
  const platform = options.platform || detectPlatform(process.env.SONARQUBE_URL || '');
  
  console.log(`🚀 Running ${platform} integration tests...`);
  console.log('');

  // Build the Jest command
  const jestArgs = [
    '--config=jest.integration.config.js',
    `src/__integration__/suites/${platform}.suite.ts`,
  ];

  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.bail) {
    jestArgs.push('--bail');
  }

  if (options.maxWorkers) {
    jestArgs.push(`--maxWorkers=${options.maxWorkers}`);
  }

  // Add color output
  jestArgs.push('--colors');

  const command = `npx jest ${jestArgs.join(' ')}`;
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    // Jest already outputs the error details
    console.log('\n❌ Integration tests failed. See output above for details.');
    process.exit(1);
  }
}

function printUsage() {
  console.log('Usage: npm run test:integration[:platform] [-- [options]]');
  console.log('');
  console.log('Options:');
  console.log('  --verbose     Enable verbose output');
  console.log('  --bail        Stop on first test failure');
  console.log('  --workers=N   Set number of worker processes');
  console.log('');
  console.log('Environment Variables:');
  console.log('  SONARQUBE_URL                    SonarQube/SonarCloud instance URL (required)');
  console.log('  SONARQUBE_TOKEN                  Authentication token (required)');
  console.log('  SONARQUBE_ORGANIZATION           Organization key (required for SonarCloud)');
  console.log('  INTEGRATION_TEST_DESTRUCTIVE     Allow destructive tests (default: false)');
  console.log('  INTEGRATION_TEST_RUN_ADMIN       Run admin-only tests (default: false)');
  console.log('  INTEGRATION_TEST_RUN_ENTERPRISE  Run enterprise feature tests (default: false)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:integration:sonarqube');
  console.log('  npm run test:integration:sonarcloud');
  console.log('  npm run test:integration -- --verbose --bail');
  console.log('');
}

function main() {
  const args = process.argv.slice(2);
  
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  printHeader();

  try {
    // Validate environment
    const config = validateEnvironment();
    printConfiguration(config);

    // Parse options
    const options: TestRunOptions = {};
    
    if (args.includes('--verbose')) {
      options.verbose = true;
    }
    
    if (args.includes('--bail')) {
      options.bail = true;
    }

    const workersArg = args.find(arg => arg.startsWith('--workers='));
    if (workersArg) {
      options.maxWorkers = parseInt(workersArg.split('=')[1], 10);
    }

    // Determine platform from command line or environment
    const platformArg = args.find(arg => ['sonarqube', 'sonarcloud'].includes(arg));
    if (platformArg) {
      options.platform = platformArg as 'sonarqube' | 'sonarcloud';
    }

    // Check for Jest config file
    if (!existsSync('jest.integration.config.js')) {
      throw new Error('jest.integration.config.js not found in current directory');
    }

    runTests(options);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    console.log('');
    console.log('💡 For help, run: npm run test:integration -- --help');
    process.exit(1);
  }
}

// Run if called directly (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, runTests, validateEnvironment, detectPlatform };