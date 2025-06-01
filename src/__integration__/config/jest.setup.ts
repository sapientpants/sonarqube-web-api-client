/**
 * Jest Setup for Integration Tests
 *
 * This file runs before each integration test file to configure the test environment.
 */

import { canRunIntegrationTests, getIntegrationTestConfig } from './environment';

// Skip all tests if integration test environment is not configured
if (!canRunIntegrationTests()) {
  console.log('⚠️  Integration tests skipped - environment not configured');
  console.log('   Set SONARQUBE_URL and SONARQUBE_TOKEN to run integration tests');
  process.exit(0);
}

// Configure longer timeouts for integration tests
jest.setTimeout(30000);

// Log integration test configuration at startup
const config = getIntegrationTestConfig();
console.log('🔗 Integration Test Environment:');
console.log(`   Platform: ${config.platform}`);
console.log(`   URL: ${config.url}`);
console.log(`   Organization: ${config.organization || 'N/A'}`);

// Global error handler for unhandled rejections in integration tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in integration test:', reason);
  console.error('Promise:', promise);
});

// Custom jest matchers for integration tests
expect.extend({
  toBeValidSonarQubeResponse(received): jest.CustomMatcherResult {
    const pass = received && typeof received === 'object';
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid SonarQube response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid SonarQube response object`,
        pass: false,
      };
    }
  },

  toHaveValidPagination(received): jest.CustomMatcherResult {
    const hasPaging = received?.paging;
    const hasValidStructure =
      hasPaging &&
      typeof hasPaging.pageIndex === 'number' &&
      typeof hasPaging.pageSize === 'number' &&
      typeof hasPaging.total === 'number';

    if (hasValidStructure) {
      return {
        message: () => `expected ${received} not to have valid pagination`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid pagination structure`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSonarQubeResponse: () => R;
      toHaveValidPagination: () => R;
    }
  }
}
