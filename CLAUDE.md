# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript client library for the SonarQube Web API. The library provides a type-safe interface for interacting with SonarQube's REST API endpoints.

## Memories

- Use puppeteer to read v1 SonarQube Web API documentation at https://next.sonarqube.com/sonarqube/web_api
- Use puppeteer to read v2 SonarQube Web API documentation at https://next.sonarqube.com/sonarqube/web_api_v2

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test
pnpm test:watch      # Watch mode
pnpm test:coverage   # With coverage report

# Run integration tests (requires environment setup)
pnpm test:integration:sonarqube         # SonarQube-specific tests
pnpm test:integration:sonarcloud        # SonarCloud-specific tests

# Linting and formatting
pnpm lint            # Check for linting issues
pnpm lint:fix        # Fix linting issues
pnpm format          # Format code with Prettier
pnpm format:check    # Check formatting
pnpm typecheck       # Run TypeScript type checking

# Development mode (watch for changes)
pnpm dev
```

## Architecture Decision Records (ADRs)

This project uses adr-tools to document architectural decisions. ADRs are stored in `doc/architecture/decisions/`.

```bash
# Create a new ADR without opening an editor (prevents timeout in Claude Code)
EDITOR=true adr-new "Title of the decision"

# Then edit the created file manually
```

## Architecture

The project uses:
- **TypeScript** for type safety
- **tsup** for building and bundling (configured to output both CommonJS and ESM)
- **Jest** with ts-jest for testing
- **ESLint** with TypeScript parser for linting
- **Prettier** for code formatting

### Key Files
- `src/index.ts` - Main entry point with the SonarQubeClient class
- `src/__tests__/` - Test files
- `dist/` - Built output (gitignored)

### SonarQubeClient Class
The main class provides methods for interacting with SonarQube API:
- Constructor accepts baseUrl and optional auth token
- `getProjects()` - Fetches projects list
- `getIssues(projectKey?)` - Fetches issues, optionally filtered by project
- Private `request()` method handles HTTP requests with auth headers

The library is designed to be extended with additional API endpoints as needed.

### Error Handling

The library uses a custom error hierarchy for better error handling:

```typescript
import { 
  SonarQubeClient, 
  AuthenticationError, 
  RateLimitError,
  NetworkError 
} from 'sonarqube-web-api-client';

const client = new SonarQubeClient('https://sonarqube.example.com', 'token');

try {
  const projects = await client.getProjects();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication failure (401)
    console.error('Invalid token or authentication expired');
  } else if (error instanceof RateLimitError) {
    // Handle rate limiting (429)
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof NetworkError) {
    // Handle network issues
    console.error('Network error:', error.cause);
  } else {
    // Handle other errors
    throw error;
  }
}
```

Available error types:
- `SonarQubeError` - Base error class
- `ApiError` - General API errors (4xx)
- `AuthenticationError` - Authentication failures (401)
- `AuthorizationError` - Authorization failures (403)
- `NotFoundError` - Resource not found (404)
- `RateLimitError` - Rate limit exceeded (429)
- `ServerError` - Server errors (5xx)
- `NetworkError` - Network connectivity issues
- `TimeoutError` - Request timeouts
- `ValidationError` - Client-side validation errors

## Integration Testing

The project includes comprehensive integration tests that validate the client against real SonarQube and SonarCloud instances.

### Quick Setup

Set environment variables and run tests:

```bash
# Required for all tests
export SONARQUBE_URL="https://your-sonarqube-instance.com"
export SONARQUBE_TOKEN="your-authentication-token"

# Required for SonarCloud only
export SONARQUBE_ORGANIZATION="your-organization-key"

# Run integration tests
pnpm test:integration:sonarqube   # For SonarQube instances
pnpm test:integration:sonarcloud  # For SonarCloud instances
```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `SONARQUBE_URL` | SonarQube/SonarCloud instance URL | *required* |
| `SONARQUBE_TOKEN` | Authentication token | *required* |
| `SONARQUBE_ORGANIZATION` | Organization key (SonarCloud only) | *optional* |
| `INTEGRATION_TEST_DESTRUCTIVE` | Allow tests that create/delete data | `false` |
| `INTEGRATION_TEST_ADMIN` | Include admin-only tests | `false` |
| `INTEGRATION_TEST_ENTERPRISE` | Include enterprise feature tests | `false` |

### Test Architecture

- **Modular API Tests**: Individual files for each API category (`src/__integration__/api/`)
- **Platform-Specific Suites**: Separate test suites for SonarQube vs SonarCloud
- **Environment-Driven**: Tests adapt based on platform detection and configuration
- **Test Data Management**: Automatic cleanup of test artifacts
- **Robust Error Handling**: Graceful handling of permissions and API differences

See `src/__integration__/README.md` for detailed documentation.

## Development Tips

- Use `pnpm format` to fix formatting issues in the code
- Use `jq` to read json files
```