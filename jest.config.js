/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Unit Tests',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  // Exclude integration tests from unit test runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__integration__/',
    '/dist/',
    'integration.test.ts$',
    'integration.spec.ts$'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setupTests.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/test-utils/**/*.ts',
    '!src/__integration__/**/*.ts', // Exclude integration tests from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};