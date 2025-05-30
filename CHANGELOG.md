# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Authorizations API v2**: Complete implementation of the SonarQube Authorizations API v2 (`api/v2/authorizations`)
  - Modern REST API for group management (replaces legacy user_groups API)
  - Search for groups with advanced filtering and pagination
  - Create, update, and delete groups with UUID-based identification
  - Manage group memberships with dedicated endpoints
  - Support for external provider integration (LDAP/SAML)
  - Builder pattern for complex search operations
  - Full async iteration support for paginated results
  - Available in SonarQube 10.5+

- **Analysis API v2**: Full implementation of the SonarQube Analysis API v2 (`api/v2/analysis`)
  - Scanner management and project analysis functionality
  - Get active rules for project analysis with branch/PR support
  - Scanner engine metadata retrieval and binary downloads
  - JRE listing, metadata, and binary downloads for different platforms
  - Server version information endpoint
  - Download progress tracking with streaming support for large files
  - Conditional responses based on Accept headers (JSON metadata vs binary)
  - Available in SonarQube 10.3+

## [0.2.2] - 2025-01-28

### Fixed

- **Type definitions**: Fixed `IssueStatus` type by removing invalid values `TO_REVIEW`, `IN_REVIEW`, and `REVIEWED` which are only valid for security hotspots, not issues
- **Type definitions**: Fixed `ProjectVisibility` type by removing invalid `INTERNAL` value
- **Findings**: Updated `FindingStatus` type to include security hotspot status values for findings export

### Added

- **API Reference**: Added complete SonarQube Web API specification file (`sonarqube-web-api-spec.json`) for development reference

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