# 🚀 SonarQube Web API Client

A modern TypeScript client library for the SonarQube/SonarCloud Web API with type-safe interfaces and comprehensive error handling.

[![CI](https://github.com/sapientpants/sonarqube-web-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/sapientpants/sonarqube-web-api-client/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=bugs)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=coverage)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![npm version](https://img.shields.io/npm/v/sonarqube-web-api-client.svg)](https://www.npmjs.com/package/sonarqube-web-api-client)
[![npm downloads](https://img.shields.io/npm/dm/sonarqube-web-api-client.svg)](https://www.npmjs.com/package/sonarqube-web-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 💡 Why Use This Library?

Working with the SonarQube/SonarCloud API directly can be challenging:
- 📚 **Complex API surface** - Hundreds of endpoints with various parameters
- 🔍 **No TypeScript support** - The official API lacks type definitions
- 🔄 **Pagination handling** - Manual pagination logic for large datasets
- ❌ **Generic error responses** - Difficult to handle different error scenarios
- 🏢 **Multi-organization** - Complexity when working with SonarCloud organizations

This library solves these problems by providing:
- ✅ **Complete type safety** - Full TypeScript definitions for all endpoints
- ✅ **Intuitive API design** - Resource-based structure with method chaining
- ✅ **Automatic pagination** - Built-in async iterators for large datasets
- ✅ **Rich error handling** - Specific error types for different failures
- ✅ **Zero dependencies** - Lightweight with no external runtime dependencies

## 🌟 Features

- 🔒 **Type-safe** - Full TypeScript support with comprehensive type definitions
- 🏢 **Multi-Organization** - Support for SonarCloud organizations and SonarQube instances
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

// Initialize the client (token is required)
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// For SonarCloud with organization support
const cloudClient = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'your-organization');

// Everything is type-safe and intuitive
const projects = await client.projects.search()
  .query('my-project')
  .execute();

const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL'])
  .execute();

// Async iteration for large datasets
for await (const component of client.components.tree()
  .component('my-project')
  .filesOnly()
  .all()) {
  console.log(`File: ${component.path}`);
}
```

### 📝 Full TypeScript Support

Get autocomplete, type checking, and inline documentation right in your IDE:

```typescript
// TypeScript knows exactly what parameters are available
const projects = await client.projects.search()
  .query('my-app')        // ✅ Autocomplete shows available methods
  .visibility('private')  // ✅ Type-safe parameter values
  .pageSize(50)          // ✅ Number validation
  .execute();            // ✅ Returns typed response

// TypeScript catches errors at compile time
const issues = await client.issues.search()
  .withSeverities(['WRONG'])  // ❌ TypeScript error: not a valid severity
  .execute();

// Full type information for responses
projects.components.forEach(project => {
  console.log(project.key);        // ✅ TypeScript knows the structure
  console.log(project.lastAnalysis); // ✅ Optional field handling
});
```

## 📊 API Implementation Status

We're continuously adding support for more SonarQube/SonarCloud APIs. Here's what's available today:

| API | Path | Status | Availability | Notes |
|-----|------|--------|--------------|-------|
| **ALM Integrations** | `api/alm_integrations` | ✅ Implemented | SonarQube only | Azure, Bitbucket, GitHub, GitLab integration |
| **ALM Settings** | `api/alm_settings` | ✅ Implemented | SonarQube only | ALM configuration management |
| **Analysis Cache** | `api/analysis_cache` | ✅ Implemented | SonarQube only | Scanner cache data |
| **Applications** | `api/applications` | ✅ Implemented | SonarQube only | Application portfolio management |
| **Authentication** | `api/authentication` | ✅ Implemented | Both | Validate credentials and logout |
| **CE (Compute Engine)** | `api/ce` | ✅ Implemented | Both | Background task management |
| **Components** | `api/components` | ✅ Implemented | Both | Component navigation and search |
| **Duplications** | `api/duplications` | ✅ Implemented | Both | Code duplication data |
| **Favorites** | `api/favorites` | ✅ Implemented | Both | User favorites management |
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

📊 **Progress**: 14 of 38 APIs implemented (37%)

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

### 🗂️ Component Navigation

```typescript
// Get a component with its ancestors
const result = await client.components.show('my-project:src/main.ts');
console.log('Component:', result.component);
console.log('Ancestors:', result.ancestors);

// Navigate through component trees
const files = await client.components.tree()
  .component('my-project')
  .filesOnly()
  .sortByPath()
  .execute();

// Search for specific components with pagination
for await (const component of client.components.tree()
  .component('my-project')
  .query('Controller')
  .qualifiers(['FIL'])
  .all()) {
  console.log('Found file:', component.name);
}

// Get only direct children of a directory
const children = await client.components.tree()
  .component('my-project:src')
  .childrenOnly()
  .execute();
```

### ⭐ Managing User Favorites

```typescript
// Add a project to favorites
await client.favorites.add({
  component: 'my-project'
});

// Remove a project from favorites
await client.favorites.remove({
  component: 'my-project'
});

// Search favorites with pagination
const favorites = await client.favorites.search()
  .pageSize(50)
  .execute();

// Iterate through all favorites
for await (const favorite of client.favorites.searchAll()) {
  console.log(`Favorite project: ${favorite.name} (${favorite.key})`);
}
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

### 🔐 Authentication

```typescript
// Validate current authentication
const validation = await client.authentication.validate();
if (validation.valid) {
  console.log('Authentication is valid');
} else {
  console.log('Authentication is invalid or expired');
}

// Logout current user (invalidates the session)
await client.authentication.logout();
console.log('Successfully logged out');

// Note: The validate() endpoint returns true for anonymous users
// Use it to check if credentials are properly configured
```

### 📋 Code Duplications

```typescript
// Get duplications for a specific file
const duplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php'
});

console.log(`Found ${duplications.duplications.length} duplication sets`);
console.log(`Involving ${duplications.files.length} files`);

// Process each duplication set
duplications.duplications.forEach((duplication, index) => {
  console.log(`\nDuplication set ${index + 1}:`);
  duplication.blocks.forEach((block, blockIndex) => {
    // The _ref field is a reference identifier for this duplication block
    console.log(`  Block ${blockIndex + 1} (ref: ${block._ref}): lines ${block.from}-${block.to} (${block.size} lines)`);
  });
});

// Access file information separately
duplications.files.forEach(file => {
  console.log(`Involved file: ${file.name} (${file.key})`);
});

// Get duplications for a file on a specific branch
const branchDuplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php',
  branch: 'feature/my_branch'
});

// Get duplications for a file in a pull request
const prDuplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php',
  pullRequest: '123'
});
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

## 🏗️ Resource-Based API Design

The library is organized around API resources, making it intuitive and easy to discover available methods:

```typescript
const client = new SonarQubeClient(baseUrl, token);

// Each resource has its own namespace
client.authentication   // Authentication endpoints
client.projects        // Project management
client.issues          // Issue tracking
client.measures        // Code metrics
client.qualityGates    // Quality gate management
client.components      // Component navigation
client.sources         // Source code access
client.system          // System administration
// ... and many more
```

Each resource client provides methods that map directly to SonarQube API endpoints, with full TypeScript support for parameters and responses.

### 🔨 Builder Pattern for Complex Queries

Many APIs support complex filtering and pagination. The library provides a fluent builder pattern for these cases:

```typescript
// Simple method calls for basic operations
const project = await client.projects.create({
  key: 'my-project',
  name: 'My Project'
});

// Builder pattern for complex queries
const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL', 'MAJOR'])
  .createdAfter('2024-01-01')
  .assignedTo('developer@example.com')
  .sortBy('SEVERITY')
  .pageSize(50)
  .execute();

// Async iteration for large datasets
for await (const issue of client.issues.search()
  .withSeverities(['CRITICAL'])
  .all()) {
  console.log(`Critical issue: ${issue.key}`);
}
```

## 🔌 API Compatibility

The library supports both SonarQube and SonarCloud APIs. Check the [API Implementation Status](#📊-api-implementation-status) table above for specific availability details.

### 🏢 Organization Support (SonarCloud)

For SonarCloud users with multiple organizations, you can specify the organization when creating the client:

```typescript
// SonarCloud with organization
const client = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'my-organization');

// The organization parameter is automatically included in API requests
const projects = await client.projects.search().execute();
// → GET /api/projects/search?organization=my-organization
```

### 🔄 Migration from v0.1.x

**Version 0.2.0 introduces breaking changes.** The `token` parameter is now required:

```typescript
// ❌ v0.1.x - token was optional
const client = new SonarQubeClient('https://sonarqube.example.com');

// ✅ v0.2.0 - token is required
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// ✅ v0.2.0 - with organization support
const client = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'your-org');
```

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
  ⭐ If you find this library helpful, please consider giving it a star on GitHub!
</p>

<p align="center">
  Made with ❤️ by the open source community
</p>
