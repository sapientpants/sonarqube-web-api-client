/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Integration Tests',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__integration__/**/*.ts',
    '**/__integration__/**/*.test.ts',
    '**/__integration__/**/*.spec.ts',
    '**/integration.test.ts',
    '**/integration.spec.ts'
  ],
  // Exclude unit test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/dist/',
    'test.ts$',
    'spec.ts$'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  // Integration tests don't need coverage since they test external APIs
  collectCoverage: false,
  
  // Longer timeouts for network operations
  testTimeout: 30000,
  
  // Setup files for integration test environment
  setupFilesAfterEnv: [
    '<rootDir>/src/__integration__/config/jest.setup.ts'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__integration__/config/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__integration__/config/globalTeardown.ts',
  
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  
  // Bail on first test failure to prevent long-running failed test suites
  bail: false,
  
  // Run tests in sequence to avoid API rate limiting
  maxWorkers: 1,
  
  // Environment variables for test configuration
  testEnvironment: 'node',
  
  // Reporter configuration for integration tests
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'integration-test-results.xml',
      suiteName: 'Integration Tests'
    }]
  ]
};