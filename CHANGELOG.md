# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-27

### ⚠️ BREAKING CHANGES

- **SonarQubeClient constructor**: The `token` parameter is now required instead of optional. This ensures proper authentication for all API calls.

### Added

- **Organization support**: Added optional `organization` parameter to `SonarQubeClient` constructor for multi-organization SonarCloud environments
- **Enhanced API coverage**: Organization parameter is automatically included in API requests when provided
- **Comprehensive test coverage**: Added extensive tests for organization parameter functionality across all resource clients

### Changed

- **Required authentication**: `token` parameter is now mandatory in the `SonarQubeClient` constructor
- **Improved error handling**: Better validation for authentication tokens
- **Enhanced type safety**: Stricter typing for required parameters

### Migration Guide

#### Before (v0.1.x):
```typescript
// Without token (no longer supported)
const client = new SonarQubeClient('https://sonarqube.example.com');

// With optional token
const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
```

#### After (v0.2.0):
```typescript
// Token is now required
const client = new SonarQubeClient('https://sonarqube.example.com', 'token');

// With organization (for SonarCloud multi-org environments)
const client = new SonarQubeClient('https://sonarqube.example.com', 'token', 'my-org');
```

### Technical Details

- Updated `BaseClient` to handle organization parameter
- Modified legacy methods (`getProjects()`, `getIssues()`) to include organization in query parameters
- All resource clients now support organization parameter
- Improved test naming conventions (`clientWithEmptyToken` instead of `clientWithoutToken`)

## [0.1.0] - 2024-12-19

### Added

- Initial release of SonarQube Web API client
- Support for multiple SonarQube API resources:
  - ALM Integrations API
  - ALM Settings API
  - Analysis Cache API
  - Applications API
  - Issues API
  - Projects API
  - Metrics API
  - Measures API
  - Quality Gates API
  - Sources API
  - System API
- TypeScript support with full type definitions
- Builder pattern for complex API requests
- Comprehensive error handling with custom error hierarchy
- MSW-based testing setup
- Legacy methods for backward compatibility (`getProjects()`, `getIssues()`)