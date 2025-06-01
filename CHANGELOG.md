# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2025-01-30

### 🔒 Security

- **ReDoS Prevention**: Fixed Regular Expression Denial of Service (ReDoS) vulnerabilities in multiple regex patterns
  - Fixed vulnerable patterns in `clean-code-policy/utils.ts` (hyphen removal, key validation, string patterns, comment patterns)
  - Fixed vulnerable patterns in `dop-translation/utils.ts` (URL matching for GitHub, GitLab, Bitbucket, Azure DevOps)
  - Replaced unbounded quantifiers (`+`, `*`) with bounded alternatives (`{1,100}`) to prevent catastrophic backtracking
  - Added non-greedy quantifiers and atomic groups where appropriate

### 🧹 Removed

- **Dead Code Elimination**: Removed unused `templateUtils` object and associated functions
  - Removed `getSuggestedTemplates()` method that had no actual usage in production code
  - Removed `isCustomizable()` method and `commonTemplates` object
  - Eliminated 109 lines of unused code to reduce bundle size

### 📦 Dependencies

- **Updated all dependencies to latest stable versions**:
  - ESLint and TypeScript ESLint to v9.28.0 and v8.33.0
  - MSW to v2.8.7 for improved testing capabilities
  - @types/node to v22.15.29 for latest Node.js types
  - eslint-plugin-prettier to v5.4.1
  - Maintained stable versions (avoided beta releases for production readiness)

### 🔧 Fixed

- **Code Quality**: Resolved multiple SonarQube code quality issues
  - Fixed nested template literals in MigrationAssistant
  - Resolved critical cyclic dependency between FixSuggestionsClient and builders
  - Fixed ESLint errors in calculateMedian method
  - Improved platform validation in enterprise info extraction
  - Removed unnecessary async keywords

### ✨ Added

- **Complete SonarQube API v2 Coverage**: Achieved 100% coverage of all SonarQube v2 APIs
  - **SCA (Software Composition Analysis) API v2**: Complete implementation (`api/v2/sca`)
    - Software Bill of Materials (SBOM) generation with comprehensive dependency analysis
    - Support for industry-standard formats: JSON, SPDX (JSON/RDF), CycloneDX (JSON/XML)
    - Vulnerability tracking with CVE/CVSS scoring and security risk analysis
    - License compliance analysis with automated risk assessment
    - Streaming support for large SBOM reports (1000+ components)
    - Progress tracking for binary downloads with abort signal support
    - Format conversion utilities (`SbomFormatConverter`) for SPDX and CycloneDX
    - SBOM analysis utilities (`SbomAnalyzer`) for security and compliance insights
    - Available in SonarQube 10.6+

  - **Authorizations API v2**: Complete implementation (`api/v2/authorizations`)
    - Modern REST API for group management (replaces legacy user_groups API)
    - Search for groups with advanced filtering and pagination
    - Create, update, and delete groups with UUID-based identification
    - Manage group memberships with dedicated endpoints
    - Support for external provider integration (LDAP/SAML)
    - Builder pattern for complex search operations
    - Full async iteration support for paginated results
    - Available in SonarQube 10.5+

  - **Analysis API v2**: Full implementation (`api/v2/analysis`)
    - Scanner management and project analysis functionality
    - Get active rules for project analysis with branch/PR support
    - Scanner engine metadata retrieval and binary downloads
    - JRE listing, metadata, and binary downloads for different platforms
    - Server version information endpoint
    - Download progress tracking with streaming support for large files
    - Conditional responses based on Accept headers (JSON metadata vs binary)
    - Available in SonarQube 10.3+

- **Enhanced Deprecation Management System**: Comprehensive developer experience improvements
  - Smart deprecation warnings with contextual information
  - Migration assistance with automated code transformation suggestions
  - Compatibility bridges for smooth transitions between API versions
  - Configurable warning levels and filtering options

- **Complete API Resource Coverage**: Added support for all remaining SonarQube API resources
  - **Permissions API**: User and group permission management
  - **Web Services API**: API documentation and introspection
  - **Webhooks API**: Event notification management
  - **User Tokens API**: Authentication token management
  - **Users API**: User account management with v2 API support
  - **Rules API**: Code quality rule management
  - **Settings API**: Configuration management
  - **Quality Profiles API**: Code quality profile management
  - **Project APIs**: Tags, Links, Pull Requests, Branches, Badges, Analyses
  - **Notifications API**: User notification preferences
  - **Languages API**: Programming language support
  - **Security Hotspots API**: Security vulnerability management
  - **Favorites API**: User favorite project management
  - **Duplications API**: Code duplication analysis
  - **Authentication API**: Session management
  - **Components API**: Project component navigation
  - **Compute Engine (CE) API**: Background task management

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