# 🚀 SonarQube Web API Client

> A modern TypeScript client library for the SonarQube/SonarCloud Web API with type-safe interfaces and comprehensive error handling.

[![npm version](https://img.shields.io/npm/v/sonarqube-web-api-client.svg)](https://www.npmjs.com/package/sonarqube-web-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 🌟 Features

- 🔒 **Type-safe** - Full TypeScript support with comprehensive type definitions
- 🏗️ **Builder Pattern** - Intuitive API with method chaining for complex queries
- 🔄 **Async Iteration** - Efficiently handle large datasets with built-in pagination
- 🛡️ **Error Handling** - Rich error types for different failure scenarios
- 🎯 **Modern Design** - Built with async/await and ES6+ features
- 📦 **Tree-shakeable** - Only import what you need
- 🧪 **Well Tested** - Comprehensive test coverage with MSW

## 📦 Installation

```bash
npm install sonarqube-web-api-client
# or
pnpm add sonarqube-web-api-client
# or
yarn add sonarqube-web-api-client
```

## 🎯 Quick Start

```typescript
import { SonarQubeClient } from 'sonarqube-web-api-client';

// Initialize the client
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// Search for projects - it's that easy! 
const projects = await client.projects.search()
  .query('my-project')
  .execute();

// Get metrics with type-safe filters
const metrics = await client.metrics.search()
  .type('INT')
  .execute();

// Work with issues using the fluent API
const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL', 'MAJOR'])
  .withStatuses(['OPEN'])
  .pageSize(100)
  .execute();
```

## 📊 API Implementation Status

We're continuously adding support for more SonarQube/SonarCloud APIs. Here's what's available today:

| API | Path | Status | Availability | Notes |
|-----|------|--------|--------------|-------|
| **ALM Integrations** | `api/alm_integrations` | ✅ Implemented | SonarQube only | Azure, Bitbucket, GitHub, GitLab integration |
| **ALM Settings** | `api/alm_settings` | ✅ Implemented | SonarQube only | ALM configuration management |
| **Analysis Cache** | `api/analysis_cache` | ✅ Implemented | SonarQube only | Scanner cache data |
| **Applications** | `api/applications` | ✅ Implemented | SonarQube only | Application portfolio management |
| **Authentication** | `api/authentication` | ❌ Not implemented | Both | Login/logout endpoints |
| **CE (Compute Engine)** | `api/ce` | ❌ Not implemented | Both | Background task management |
| **Components** | `api/components` | ❌ Not implemented | Both | Component navigation and search |
| **Duplications** | `api/duplications` | ❌ Not implemented | Both | Code duplication data |
| **Favorites** | `api/favorites` | ❌ Not implemented | Both | User favorites management |
| **Hotspots** | `api/hotspots` | ❌ Not implemented | Both | Security hotspot management |
| **Issues** | `api/issues` | ✅ Implemented | Both | Issue search and management |
| **Languages** | `api/languages` | ❌ Not implemented | Both | Supported languages list |
| **Measures** | `api/measures` | ✅ Implemented | Both | Component measures and history |
| **Metrics** | `api/metrics` | ✅ Implemented | Both | Metric definitions |
| **Notifications** | `api/notifications` | ❌ Not implemented | Both | User notifications |
| **Permissions** | `api/permissions` | ❌ Not implemented | Both | Permission management |
| **Project Analyses** | `api/project_analyses` | ❌ Not implemented | Both | Analysis history and events |
| **Project Badges** | `api/project_badges` | ❌ Not implemented | Both | Project status badges |
| **Project Branches** | `api/project_branches` | ❌ Not implemented | Both | Branch management |
| **Project Links** | `api/project_links` | ❌ Not implemented | Both | Project external links |
| **Project Pull Requests** | `api/project_pull_requests` | ❌ Not implemented | Both | Pull request management |
| **Project Tags** | `api/project_tags` | ❌ Not implemented | Both | Project tag management |
| **Projects** | `api/projects` | ✅ Implemented | Both | Project management |
| **Properties** | `api/properties` | ❌ Not implemented | Both | Property management (deprecated) |
| **Quality Gates** | `api/qualitygates` | ✅ Implemented | Both | Quality gate management |
| **Quality Profiles** | `api/qualityprofiles` | ❌ Not implemented | Both | Quality profile management |
| **Rules** | `api/rules` | ❌ Not implemented | Both | Coding rule management |
| **Settings** | `api/settings` | ❌ Not implemented | Both | Global and project settings |
| **Sources** | `api/sources` | ✅ Implemented | Both | Source code access |
| **System** | `api/system` | ✅ Implemented | SonarQube only | System information and health |
| **Time Machine** | `api/timemachine` | ❌ Not implemented | Both | Historical measures (deprecated) |
| **User Groups** | `api/user_groups` | ❌ Not implemented | Both | User group management |
| **User Properties** | `api/user_properties` | ❌ Not implemented | SonarCloud only | User property management |
| **User Tokens** | `api/user_tokens` | ❌ Not implemented | Both | User token management |
| **Users** | `api/users` | ❌ Not implemented | Both | User management |
| **Webhooks** | `api/webhooks` | ❌ Not implemented | Both | Webhook management |
| **Web Services** | `api/webservices` | ❌ Not implemented | Both | API documentation |

📊 **Progress**: 11 of 38 APIs implemented (29%)

Want to help? Check out our [contributing guide](#🤝-contributing) - we'd love your help implementing more APIs!

## 🔥 Examples

### 🔍 Search with Pagination

```typescript
// Automatically handle pagination with async iteration
for await (const project of client.projects.searchAll()) {
  console.log(`Found project: ${project.key}`);
}

// Or manually control pagination
const page1 = await client.projects.search()
  .pageSize(50)
  .page(1)
  .execute();
```

### 📊 Working with Measures

```typescript
// Get multiple metrics for a component
const measures = await client.measures.component({
  component: 'my-project',
  metricKeys: ['coverage', 'bugs', 'vulnerabilities']
});

// Get measure history
const history = await client.measures.history({
  component: 'my-project',
  metrics: ['coverage'],
  from: '2024-01-01'
});
```

### 🚨 Advanced Issue Filtering

```typescript
const criticalIssues = await client.issues.search()
  .withProjects(['my-project'])
  .withBranch('main')
  .withSeverities(['CRITICAL'])
  .withTypes(['BUG', 'VULNERABILITY'])
  .createdAfter('2024-01-01')
  .assignedTo('john.doe')
  .sortBy('SEVERITY')
  .execute();
```

### 💚 System Health Monitoring

```typescript
// Check system health (SonarQube only)
const health = await client.system.health();
if (health.health === 'RED') {
  console.error('System is unhealthy:', health.causes);
}

// Simple ping check
const pong = await client.system.ping();
console.log(pong); // 'pong'
```

## 🛡️ Error Handling

The library provides rich error types to help you handle different failure scenarios gracefully:

```typescript
import { 
  AuthenticationError, 
  RateLimitError,
  NotFoundError,
  NetworkError 
} from 'sonarqube-web-api-client';

try {
  const projects = await client.projects.search().execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid token or authentication expired
    console.error('Please check your authentication token');
  } else if (error instanceof RateLimitError) {
    // Too many requests
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    // Implement retry logic here
  } else if (error instanceof NotFoundError) {
    // Resource doesn't exist
    console.error(`Resource not found: ${error.resource}`);
  } else if (error instanceof NetworkError) {
    // Network connectivity issues
    console.error('Network error:', error.cause);
  }
}
```

## 🔌 API Compatibility

The library supports both SonarQube and SonarCloud APIs. Check the [API Implementation Status](#📊-api-implementation-status) table above for specific availability details.

## 🛠️ Development

Want to contribute? Awesome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/sapientpants/sonarqube-web-api-client.git
cd sonarqube-web-api-client

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the library
pnpm build

# Run linting
pnpm lint

# Fix formatting
pnpm format
```

### 🏗️ Architecture

The library follows a modular, resource-based architecture:

- Each API resource has its own client class
- Builder pattern for complex queries
- Shared base client for common functionality
- Comprehensive TypeScript types
- MSW (Mock Service Worker) for testing

## 🤝 Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🔧 Code contributions

Check out our [issues](https://github.com/sapientpants/sonarqube-web-api-client/issues) page to see what we're working on. Feel free to pick up any issue marked as "good first issue" or "help wanted".

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using TypeScript
- Tested with [MSW](https://mswjs.io/) for reliable API mocking
- Inspired by modern API client design patterns

---

<p align="center">
  Made with ❤️ by the open source community
</p>