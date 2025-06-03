# Integration Tests

This directory contains comprehensive integration tests for the SonarQube Web API client. These tests validate the client's functionality against real SonarQube and SonarCloud instances.

## Overview

The integration test framework provides:

- **Modular API Tests**: Individual test files for each API category
- **Platform-Specific Suites**: Separate test suites for SonarQube vs SonarCloud
- **Environment-Driven Configuration**: Tests adapt based on environment variables
- **Robust Error Handling**: Graceful handling of permissions, timeouts, and API differences
- **Test Data Management**: Automatic cleanup of test artifacts
- **Performance Monitoring**: Response time tracking and validation

## Quick Start

### 1. Environment Setup

Set the required environment variables:

```bash
# Required
export SONARQUBE_URL="https://your-sonarqube-instance.com"
export SONARQUBE_TOKEN="your-authentication-token"

# Required for SonarCloud
export SONARQUBE_ORGANIZATION="your-organization-key"

# Optional configuration
export INTEGRATION_TEST_TIMEOUT="30000"                    # Test timeout in ms
export INTEGRATION_TEST_DESTRUCTIVE="false"               # Allow data creation/deletion
export INTEGRATION_TEST_ENTERPRISE="false"                 # Run enterprise feature tests
```

### 2. Run Tests

```bash
# Run SonarQube-specific tests
pnpm test:integration:sonarqube

# Run SonarCloud-specific tests  
pnpm test:integration:sonarcloud
```

## Environment Configuration

### SonarQube Setup

For SonarQube instances:

```bash
export SONARQUBE_URL="https://sonarqube.example.com"
export SONARQUBE_TOKEN="squ_your_token_here"
# SONARQUBE_ORGANIZATION is not required for SonarQube
```

### SonarCloud Setup

For SonarCloud:

```bash
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_TOKEN="your_sonarcloud_token"
export SONARQUBE_ORGANIZATION="your-org-key"  # Required for SonarCloud
```

### Token Permissions

Your authentication token should have permissions for:

- **Basic Access**: Read projects, issues, measures, and user information  
- **Admin Access**: Required for system health, user management, and settings tests (assumes admin permissions)
- **Project Creation** (optional): Required for destructive tests that create/delete projects

### Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SONARQUBE_URL` | *required* | Base URL of your SonarQube/SonarCloud instance |
| `SONARQUBE_TOKEN` | *required* | Authentication token |
| `SONARQUBE_ORGANIZATION` | `undefined` | Organization key (required for SonarCloud) |
| `INTEGRATION_TEST_TIMEOUT` | `30000` | Test timeout in milliseconds |
| `INTEGRATION_TEST_DESTRUCTIVE` | `false` | Allow tests that create/delete data |
| `INTEGRATION_TEST_ENTERPRISE` | `false` | Run enterprise feature tests |

## Test Structure

### Directory Organization

```
src/__integration__/
├── api/                     # Individual API test files
│   ├── system/             # System API tests
│   ├── projects/           # Projects API tests
│   ├── users/              # Users API tests
│   └── [other-apis]/       # Additional API categories
├── config/                 # Test configuration and environment
│   ├── environment.ts      # Environment detection and validation
│   ├── testConfig.ts       # Test category and feature configuration
│   ├── jest.setup.ts       # Jest test setup
│   ├── globalSetup.ts      # Global test initialization
│   └── globalTeardown.ts   # Global test cleanup
├── setup/                  # Test infrastructure
│   ├── IntegrationTestClient.ts  # Extended SonarQube client for testing
│   └── TestDataManager.ts        # Test data lifecycle management
├── suites/                 # Platform-specific test suites
│   ├── sonarqube.suite.ts  # SonarQube test suite
│   └── sonarcloud.suite.ts # SonarCloud test suite
├── utils/                  # Test utilities
│   ├── assertions.ts       # Custom test assertions
│   └── testHelpers.ts      # Retry logic, timing, and helpers
└── README.md              # This file
```

### Test Categories

The framework organizes tests into logical categories:

#### Core APIs (Available on both platforms)
- **System**: Health checks, version info, ping
- **Projects**: Project CRUD, search, and management
- **Users**: User search, groups, and profiles
- **Issues**: Issue search, transitions, and management
- **Quality Gates**: Quality gate definitions and project status
- **Measures**: Code metrics and historical data

#### Platform-Specific APIs

**SonarQube Only:**
- **Editions**: License management and grace period
- **System Administration**: Plugin management, system configuration
- **Project Dump**: Backup and restore operations

**SonarCloud Only:**
- **Organizations**: Organization management and membership
- **Billing**: Usage tracking and subscription management
- **ALM Integrations**: GitHub, GitLab, Bitbucket, Azure DevOps

## Running Tests

### Test Execution Modes

1. **Read-Only Mode** (Default): Tests only perform read operations
   ```bash
   pnpm test:integration:sonarqube    # For SonarQube
   pnpm test:integration:sonarcloud   # For SonarCloud
   ```

2. **Destructive Mode**: Allows creation/deletion of test data
   ```bash
   INTEGRATION_TEST_DESTRUCTIVE=true pnpm test:integration:sonarqube
   INTEGRATION_TEST_DESTRUCTIVE=true pnpm test:integration:sonarcloud
   ```

3. **Enterprise Mode**: Tests enterprise features
   ```bash
   INTEGRATION_TEST_ENTERPRISE=true pnpm test:integration:sonarqube
   INTEGRATION_TEST_ENTERPRISE=true pnpm test:integration:sonarcloud
   ```

### Platform-Specific Testing

The test framework requires you to choose the appropriate platform-specific command:

```bash
# Run SonarQube-specific tests
SONARQUBE_URL="https://sonarqube.example.com" pnpm test:integration:sonarqube

# Run SonarCloud-specific tests  
SONARQUBE_URL="https://sonarcloud.io" SONARQUBE_ORGANIZATION="my-org" pnpm test:integration:sonarcloud
```

### Selective Test Execution

Run specific test categories:

```bash
# Run only system tests
pnpm test:integration:sonarqube --testPathPattern=system
pnpm test:integration:sonarcloud --testPathPattern=system

# Run only project tests
pnpm test:integration:sonarqube --testPathPattern=projects
pnpm test:integration:sonarcloud --testPathPattern=projects

# Run only user tests
pnpm test:integration:sonarqube --testPathPattern=users
pnpm test:integration:sonarcloud --testPathPattern=users
```

## Test Data Management

### Test Project Lifecycle

The framework manages test data automatically:

1. **Creation**: Test projects are created with predictable naming (`integration-test-*`)
2. **Usage**: Tests use dedicated test projects to avoid affecting real data
3. **Cleanup**: Test data is automatically cleaned up after test completion

### Data Isolation

- Tests use unique project keys to avoid conflicts
- Test data is prefixed with `integration-test-` for easy identification
- Cleanup runs both per-test and globally to ensure no data leakage

### Manual Cleanup

If tests are interrupted, you can manually clean up test data:

```bash
# Search for test projects in your SonarQube instance
# and delete any projects starting with "integration-test-"
```

## Error Handling and Debugging

### Common Issues

1. **Connection Errors**: Verify `SONARQUBE_URL` and network connectivity
2. **Authentication Errors**: Check `SONARQUBE_TOKEN` validity and permissions
3. **Permission Errors**: Some tests require admin access - they'll skip gracefully
4. **Organization Errors**: Ensure `SONARQUBE_ORGANIZATION` is set for SonarCloud

### Debug Mode

Enable verbose logging:

```bash
DEBUG=true pnpm test:integration:sonarqube
DEBUG=true pnpm test:integration:sonarcloud
```

### Test Timeouts

Increase timeout for slow networks:

```bash
INTEGRATION_TEST_TIMEOUT=60000 pnpm test:integration:sonarqube
INTEGRATION_TEST_TIMEOUT=60000 pnpm test:integration:sonarcloud
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run nightly
  workflow_dispatch:     # Manual trigger

jobs:
  integration-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [sonarqube, sonarcloud]
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Run SonarQube Integration Tests
        if: matrix.platform == 'sonarqube'
        env:
          SONARQUBE_URL: ${{ secrets.SONARQUBE_URL }}
          SONARQUBE_TOKEN: ${{ secrets.SONARQUBE_TOKEN }}
        run: pnpm test:integration:sonarqube
      
      - name: Run SonarCloud Integration Tests  
        if: matrix.platform == 'sonarcloud'
        env:
          SONARQUBE_URL: "https://sonarcloud.io"
          SONARQUBE_TOKEN: ${{ secrets.SONARCLOUD_TOKEN }}
          SONARQUBE_ORGANIZATION: ${{ secrets.SONARCLOUD_ORG }}
        run: pnpm test:integration:sonarcloud
```

### Security Considerations

- Store authentication tokens as encrypted secrets
- Use dedicated service accounts with minimal required permissions
- Consider using temporary tokens for CI/CD that expire regularly
- Never commit tokens or sensitive URLs to version control

## Performance and Rate Limiting

### Test Optimization

- Tests run sequentially (`maxWorkers: 1`) to avoid rate limiting
- Response times are monitored and validated
- Retry logic handles transient network issues
- Pagination limits prevent excessive data retrieval

### Rate Limiting

The framework respects API rate limits:

- Automatic retry with exponential backoff
- Sequential test execution to reduce load
- Configurable timeouts and delays
- Graceful handling of 429 responses

## Contributing

### Adding New API Tests

1. Create a new test file in `src/__integration__/api/[api-name]/`
2. Follow the existing test patterns and structure
3. Add the test to appropriate platform suites
4. Update test configuration if new features are required
5. Test against both SonarQube and SonarCloud when applicable

### Test Best Practices

- Use descriptive test names that explain the scenario
- Handle permission errors gracefully with informative messages
- Validate response structure and data types
- Include performance assertions for response times
- Clean up any test data created during the test
- Use the `TestTiming` constants for consistent timeout values

### Example Test Structure

```typescript
describe('New API Integration Tests', () => {
  let client: IntegrationTestClient;
  let dataManager: TestDataManager;

  beforeAll(async () => {
    const envConfig = getIntegrationTestConfig();
    const testConfig = getTestConfiguration(envConfig);
    client = new IntegrationTestClient(envConfig, testConfig);
    dataManager = new TestDataManager(client);
    await client.validateConnection();
  });

  afterAll(async () => {
    await dataManager.cleanup();
  });

  test('should perform API operation', async () => {
    const { result, durationMs } = await measureTime(() => 
      client.newApi.operation().execute()
    );

    IntegrationAssertions.expectValidResponse(result);
    IntegrationAssertions.expectReasonableResponseTime(durationMs);
  });
});
```

This framework provides a solid foundation for comprehensive integration testing while being flexible enough to adapt to different environments and requirements.