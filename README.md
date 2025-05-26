# SonarQube Web API Client

A TypeScript client library for the SonarQube/SonarCloud Web API with type-safe interfaces and comprehensive error handling.

## Installation

```bash
npm install sonarqube-web-api-client
# or
pnpm add sonarqube-web-api-client
# or
yarn add sonarqube-web-api-client
```

## Usage

```typescript
import { SonarQubeClient } from 'sonarqube-web-api-client';

// Initialize the client
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// Use resource APIs
const projects = await client.projects.search()
  .query('my-project')
  .execute();

const metrics = await client.metrics.search()
  .type('INT')
  .execute();
```

## API Compatibility

This library supports both SonarQube and SonarCloud APIs. However, some APIs are only available in SonarQube:

### ✅ Available in both SonarQube and SonarCloud

- **Metrics API** (`client.metrics`)
  - `search()` - Search for metrics
  - `searchAll()` - Iterate through all metrics
  - `types()` - Get available metric types
  - `domains()` - Get metric domains (deprecated)

- **Projects API** (`client.projects`)
  - `search()` / `searchAll()` - Search for projects
  - `create()` - Create a project
  - `delete()` - Delete a project
  - `bulkDelete()` - Delete multiple projects
  - `bulkUpdateKey()` - Bulk update project keys (deprecated since 7.6)
  - `updateKey()` - Update a project key
  - `updateVisibility()` - Update project visibility

### ❌ SonarQube-only APIs

The following APIs are only available when connecting to a SonarQube instance:

- **ALM Integrations API** (`client.almIntegrations`)
  - Azure DevOps, Bitbucket, GitHub, and GitLab repository integration

- **ALM Settings API** (`client.almSettings`)
  - Configuration for Application Lifecycle Management tools

- **Analysis Cache API** (`client.analysisCache`)
  - Access to analysis cache data

- **Applications API** (`client.applications`)
  - Management of application portfolios

- **Projects API - SonarQube-only endpoints**
  - `exportFindings()` - Export all issues and hotspots
  - `getContainsAiCode()` - Check if project contains AI-generated code
  - `setContainsAiCode()` - Mark project as containing AI-generated code
  - `licenseUsage()` - Get license usage information

## Error Handling

The library provides a comprehensive error hierarchy for better error handling:

```typescript
import { 
  AuthenticationError, 
  RateLimitError,
  NotFoundError 
} from 'sonarqube-web-api-client';

try {
  const projects = await client.projects.search().execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid token or authentication expired');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

## License

MIT