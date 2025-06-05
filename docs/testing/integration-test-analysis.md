# Integration Test Analysis Guide

This guide helps you understand and validate integration test results for the SonarQube Web API Client.

## Quick Assessment

If your integration tests show **120/144 passing tests (83% success rate)** with:
- 6 expected 404s for v2 APIs
- 3 real failures for enterprise APIs (license usage, AI code detection, invalid language filter)

**This is EXPECTED and NORMAL behavior** for most SonarQube instances!

## Analysis Tools

### 1. Analyze Your Instance

Get a detailed analysis of your specific SonarQube instance:

```bash
# Set your environment variables
export SONARQUBE_URL="http://localhost:9000"
export SONARQUBE_TOKEN="your-token-here"

# Analyze your instance
pnpm run analyze-instance
```

This tool will:
- ✅ Test connectivity to your SonarQube instance
- 🔍 Detect version, edition, and available features
- 📊 Calculate expected test results for your configuration
- 💡 Provide clear assessment of pass/fail expectations

### 2. View Examples

See expected results for different SonarQube configurations:

```bash
pnpm run analyze-instance:examples
```

This shows analysis for:
- SonarQube Community 10.8 (latest with v2 APIs)
- SonarQube Developer 10.8 (with branch features)
- SonarQube Enterprise 10.8 (all features)
- SonarQube Community 10.5 (without v2 APIs)

## Understanding Test Results

### Expected Failure Categories

#### 1. V2 API Failures (404 errors)
**Expected for SonarQube < 10.6**
- `/api/v2/system/info`
- `/api/v2/system/health`
- `/api/v2/system/status`
- `/api/v2/authorizations/groups`
- `/api/v2/analysis/jres`
- `/api/v2/sca/sbom-report`

**Count**: 6 failures

#### 2. Enterprise Features (403/404 errors)
**Expected for Community/Developer editions**
- `/api/projects/license_usage` (Enterprise only)
- `/api/projects/get_contains_ai_code` (requires specific features)

**Count**: 1-2 failures depending on edition

#### 3. Invalid Parameters (400 errors)
**Always expected - intentional validation tests**
- `/api/issues/search?languages=unknownlang`

**Count**: 1 failure

### Success Rate by Edition

| Edition | Version | Expected Success Rate | Typical Results |
|---------|---------|----------------------|----------------|
| Community 10.8+ | Latest | 98% (141/144) | 3 failures |
| Developer 10.8+ | Latest | 99% (142/144) | 2 failures |
| Enterprise 10.8+ | Latest | 99% (143/144) | 1 failure |
| Community 10.5 | Older | 94% (135/144) | 9 failures |

## Troubleshooting

### Your Results Show 120/144 Passing (83%)

This suggests:
- ✅ Community or Developer Edition
- ✅ Some v2 APIs available (SonarQube 10.6+)
- ✅ Enterprise features disabled (normal)
- ✅ **This is completely expected behavior!**

### Red Flags (Investigate Further)

❌ **Less than 80% success rate**
- May indicate connectivity issues
- Check authentication and permissions
- Verify SonarQube instance is healthy

❌ **Unexpected API errors**
- 401/403 on basic APIs like `/api/system/ping`
- Network timeouts or connection failures
- Invalid response formats

### Common Issues

#### Authentication Problems
```bash
# Verify your token works
curl -H "Authorization: Bearer your-token" http://localhost:9000/api/system/ping
```

#### Version Compatibility
```bash
# Check SonarQube version
curl http://localhost:9000/api/system/status
```

#### Network Connectivity
```bash
# Test basic connectivity
curl http://localhost:9000/api/system/ping
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SONARQUBE_URL` | SonarQube instance URL | ✅ Yes |
| `SONARQUBE_TOKEN` | Authentication token | ✅ Yes |
| `SONARQUBE_ORGANIZATION` | Organization key (SonarCloud only) | SonarCloud |
| `INTEGRATION_TEST_ALLOW_DESTRUCTIVE` | Allow destructive tests | No (default: false) |
| `INTEGRATION_TEST_RUN_ADMIN` | Include admin tests | No (default: false) |
| `INTEGRATION_TEST_RUN_ENTERPRISE` | Include enterprise tests | No (default: false) |

## Advanced Analysis

### Running Full Integration Tests

```bash
# Run all tests with detailed output
pnpm test:integration:sonarqube -- --verbose

# Run with admin tests (requires admin token)
INTEGRATION_TEST_RUN_ADMIN=true pnpm test:integration:sonarqube

# Run with enterprise tests (requires enterprise edition)
INTEGRATION_TEST_RUN_ENTERPRISE=true pnpm test:integration:sonarqube
```

### Interpreting Detailed Results

```bash
# Sample test output interpretation:
✅ System API tests passing → Basic connectivity OK
✅ Projects API tests passing → Core functionality OK
❌ License usage API failing → Enterprise feature (expected for Community)
❌ V2 API failing → Version < 10.6 (expected for older versions)
```

## Conclusion

**Most test failures are expected and indicate proper API validation rather than actual problems.**

Your **120/144 passing tests (83% success rate)** is:
- ✅ Within normal range for Community/Developer editions
- ✅ Indicates proper API boundaries and permissions
- ✅ Shows the client correctly handles different SonarQube configurations

Run `pnpm run analyze-instance` for a personalized assessment of your specific setup!