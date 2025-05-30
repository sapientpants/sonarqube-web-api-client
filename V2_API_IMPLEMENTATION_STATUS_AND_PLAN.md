# SonarQube v2 API Implementation Status and Plan

## Executive Summary

This document provides the current implementation status of SonarQube v2 APIs in the sonarqube-web-api-client library and a comprehensive plan for incorporating the remaining v2 endpoints discovered from the SonarQube v2 API documentation.

### Key Findings

- **No separate User Groups v2 API**: Unlike v1, the v2 API consolidates group management under the Authorizations API (`/api/v2/authorizations/groups/*`)
- The existing `user-groups/types-v2.ts` file contains types that should be moved to the authorizations module
- This architectural change in v2 reflects a more logical grouping where permissions and groups are managed together

## Current Implementation Status

### ✅ Fully Implemented v2 APIs

1. **Users API** (`/api/v2/users/*`)
   - `searchV2()` - Full implementation with builder pattern
   - Located in: `src/resources/users/UsersClient.ts`
   - Since: SonarQube 10.4

2. **System API** (`/api/v2/system/*`)
   - `getInfoV2()` - Get system information
   - `getHealthV2()` - Get system health status
   - `getStatusV2()` - Get system operational status
   - Located in: `src/resources/system/SystemClient.ts`
   - Since: SonarQube 10.6

### ✅ Fully Implemented v2 APIs (continued)

3. **Authorizations API** (`/api/v2/authorizations/*`)
   - Full implementation with AuthorizationsClient
   - Group CRUD operations (search, create, get, update, delete)
   - Group membership management (search, add, remove)
   - Builder pattern for search operations
   - Located in: `src/resources/authorizations/AuthorizationsClient.ts`
   - Since: SonarQube 10.5+
   - Note: Replaces the legacy user_groups API entirely

4. **Analysis API** (`/api/v2/analysis/*`)
   - Full implementation with AnalysisClient
   - Active rules retrieval for project analysis
   - Scanner engine metadata and binary downloads
   - JRE listing, metadata, and binary downloads
   - Server version information
   - Download progress tracking with streaming support
   - Located in: `src/resources/analysis/AnalysisClient.ts`
   - Since: SonarQube 10.3
   - Note: Handles both JSON metadata and binary file downloads

5. **SCA API** (`/api/v2/sca/*`)
   - Full implementation with ScaClient
   - Software Bill of Materials (SBOM) generation and analysis
   - Multi-format support: JSON, SPDX (JSON/RDF), CycloneDX (JSON/XML)
   - Vulnerability tracking with CVE/CVSS scoring
   - License compliance analysis and risk assessment
   - Streaming support for large SBOM reports (1000+ components)
   - Progress tracking for binary downloads with abort signal support
   - Format conversion utilities (SbomFormatConverter) for industry standards
   - SBOM analysis utilities (SbomAnalyzer) for security and compliance insights
   - Located in: `src/resources/sca/ScaClient.ts`
   - Since: SonarQube 10.6
   - Note: Essential for software supply chain security and regulatory compliance

### ⚠️ Incorrectly Created Types (No v2 API Exists)

1. **Projects** (`src/resources/projects/types-v2.ts`)
   - **No Projects v2 API exists in SonarQube**
   - ✅ This file has been removed
   - Projects API remains v1 only

2. **User Groups** (`src/resources/user-groups/*`)
   - **No separate User Groups v2 API exists**
   - ✅ UserGroupsClient was never released (skipped entirely)
   - ✅ All group management functionality is now under AuthorizationsClient

### 🔲 v2 APIs Available but Not Implemented

Based on the SonarQube v2 API page exploration, the following v2 APIs are available but have no implementation:

1. **Fix Suggestions API** (`/api/v2/fix-suggestions/*`)
   - Purpose: AI-powered code fix suggestions
   - Endpoints: 2 (ai-suggestions, issue availability)
   - Priority: MEDIUM

2. **DOP Translation API** (`/api/v2/dop-translation/*`)
   - Purpose: DevOps platform translation/integration
   - Endpoints: 2 (bound-projects, dop-settings)
   - Priority: LOW

3. **Clean Code Policy API** (`/api/v2/clean-code-policy/*`)
   - Purpose: Clean code policy and custom rule management
   - Endpoints: 1 (custom rule creation)
   - Priority: MEDIUM

4. **SCA API** (`/api/v2/sca/*`) - ✅ IMPLEMENTED
   - Purpose: Software Composition Analysis (SBOM reports)
   - Endpoints: 1 (sbom-reports)
   - Priority: HIGH (security/compliance)
   - Status: ✅ Complete implementation with comprehensive SBOM support

## Discovered v2 Endpoints from SonarQube Documentation

### Users Management (✅ Implemented)
- `POST /api/v2/users` - User creation
- `GET /api/v2/users` - Users search
- `GET /api/v2/users/{id}` - Fetch a single user
- `PATCH /api/v2/users/{id}` - Update a user
- `DELETE /api/v2/users/{id}` - Deactivate a user

### System (✅ Implemented)
- `GET /api/v2/system/health`
- `GET /api/v2/system/liveness` - Kubernetes liveness probe
- `GET /api/v2/system/migrations-status` - Database migration status

### Authorizations (✅ Implemented)
**Group Management:**
- `POST /api/v2/authorizations/groups` - Create a new group
- `GET /api/v2/authorizations/groups` - Group search
- `GET /api/v2/authorizations/groups/{id}` - Fetch a single group
- `PATCH /api/v2/authorizations/groups/{id}` - Update a group
- `DELETE /api/v2/authorizations/groups/{id}` - Delete a group

**Group Memberships:**
- `POST /api/v2/authorizations/group-memberships` - Add a group membership
- `GET /api/v2/authorizations/group-memberships` - Search across group memberships
- `DELETE /api/v2/authorizations/group-memberships/{id}` - Remove a group membership

### Fix Suggestions (🔲 Not Implemented)
- `POST /api/v2/fix-suggestions/ai-suggestions` - Suggest a fix for the given issue
- `GET /api/v2/fix-suggestions/issues` - Fetch AI suggestion availability for the given issue

### DOP Translation (🔲 Not Implemented)
- `POST /api/v2/dop-translation/bound-projects` - Create a SonarQube project with the information from the provided DevOps platform project
- `GET /api/v2/dop-translation/dop-settings` - List all DevOps Platform Integration settings

### Clean Code Policy (🔲 Not Implemented)
- `POST /api/v2/clean-code-policy/rules` - Custom rule creation

### SCA (✅ Implemented)
- `GET /api/v2/sca/sbom-reports` - Get a software bill of materials (SBOM) report

### Analysis (✅ Implemented)
- `GET /api/v2/analysis/active_rules` - Get all active rules for a specific project
- `GET /api/v2/analysis/engine` - Scanner engine download/metadata
- `GET /api/v2/analysis/jres` - All JREs metadata
- `GET /api/v2/analysis/jres/{id}` - JRE download/metadata
- `GET /api/v2/analysis/version` - Server version

## Implementation Plan

### Phase 1: ✅ COMPLETED (January 30, 2025)

#### 1. Authorizations API - ✅ FULLY IMPLEMENTED
The Authorizations API has been fully implemented with all group management operations:

- ✅ `searchGroupsV2()` - Search groups with advanced filtering
- ✅ `createGroupV2()` - Create new groups
- ✅ `getGroupV2()` - Fetch single group details
- ✅ `updateGroupV2()` - Update group information
- ✅ `deleteGroupV2()` - Delete groups
- ✅ `searchGroupMembershipsV2()` - Search group memberships
- ✅ `addGroupMembershipV2()` - Add users to groups
- ✅ `removeGroupMembershipV2()` - Remove users from groups

**Implementation Details:**
- Full builder pattern support with fluent API
- UUID-based identification
- Support for external providers (LDAP/SAML)
- Comprehensive test coverage with MSW v2
- Complete TypeScript type definitions

#### 2. Cleanup - ✅ COMPLETED
- ✅ Removed incorrect `src/resources/projects/types-v2.ts`
- ✅ Moved group types from `user-groups/types-v2.ts` to `authorizations/types.ts`
- ✅ Deleted entire `user-groups` directory (never released)
- ✅ Updated all imports and exports

### Phase 2: ✅ COMPLETED (January 30, 2025)

#### 3. Analysis API - ✅ FULLY IMPLEMENTED
The Analysis API has been fully implemented with all scanner and project analysis operations:

- ✅ `getActiveRulesV2()` - Get active rules for project analysis with branch/PR support
- ✅ `getEngineMetadataV2()` - Get scanner engine metadata
- ✅ `downloadEngineV2()` - Download scanner engine ZIP file with progress tracking
- ✅ `getAllJresV2()` - Get all available JRE metadata
- ✅ `getJreMetadataV2()` - Get specific JRE metadata
- ✅ `downloadJreV2()` - Download JRE binary with streaming support
- ✅ `getVersionV2()` - Get SonarQube server version

**Implementation Details:**
- Binary download support with progress tracking
- Streaming for large file downloads (JREs 100+ MB)
- Conditional responses based on Accept headers
- Comprehensive error handling and timeout support
- Full TypeScript type definitions

#### 4. SCA (Software Composition Analysis) API - ✅ FULLY IMPLEMENTED
The SCA API has been fully implemented with comprehensive SBOM support:

- ✅ `getSbomReportV2()` - Get structured SBOM data with full component analysis
- ✅ `downloadSbomReportV2()` - Download in industry-standard formats (JSON, SPDX, CycloneDX)
- ✅ `getSbomMetadataV2()` - Get report metadata and generation status
- ✅ `streamSbomReportV2()` - Stream large reports to avoid memory issues
- ✅ `getVulnerabilitySummaryV2()` - Get vulnerability summary without full SBOM

**Implementation Details:**
- Multi-format support: JSON, SPDX (JSON/RDF), CycloneDX (JSON/XML)
- Vulnerability tracking with CVE/CVSS scoring and detailed analysis
- License compliance analysis with automated risk assessment
- Streaming support for large SBOM reports (1000+ components)
- Progress tracking for binary downloads with abort signal support
- Format conversion utilities (`SbomFormatConverter`) for SPDX and CycloneDX
- SBOM analysis utilities (`SbomAnalyzer`) for security and compliance insights
- 30+ TypeScript interfaces for type-safe SBOM data structures
- Comprehensive test suite with MSW handlers for various SBOM formats

### Phase 3: Medium-Priority APIs (Future)

#### 5. Clean Code Policy API
```typescript
// src/resources/clean-code-policy/CleanCodePolicyClient.ts
export class CleanCodePolicyClient extends BaseClient {
  // Create custom rules
  createCustomRuleV2(data: CreateCustomRuleV2Request): Promise<CustomRuleV2>
}

// src/resources/clean-code-policy/types-v2.ts
export interface CreateCustomRuleV2Request {
  key: string;
  name: string;
  description: string;
  severity: 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
  type: 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';
  language: string;
  params?: Record<string, any>;
}
```

#### 6. Fix Suggestions API
```typescript
// src/resources/fix-suggestions/FixSuggestionsClient.ts
export class FixSuggestionsClient extends BaseClient {
  // Get AI suggestion availability for an issue
  getIssueAvailabilityV2(issueId: string): Promise<FixSuggestionAvailabilityV2>
  
  // Request AI fix suggestions for an issue
  requestAiSuggestionsV2(data: AiSuggestionRequestV2): Promise<AiSuggestionResponseV2>
}

// src/resources/fix-suggestions/types-v2.ts
export interface AiSuggestionRequestV2 {
  issueId: string;
}

export interface AiSuggestionResponseV2 {
  suggestions: Array<{
    id: string;
    explanation: string;
    changes: Array<{
      filePath: string;
      startLine: number;
      endLine: number;
      newCode: string;
    }>;
  }>;
}
```

### Phase 4: Low-Priority APIs (Future)

#### 7. DOP Translation API
```typescript
// src/resources/dop-translation/DopTranslationClient.ts
export class DopTranslationClient extends BaseClient {
  // Create SonarQube project from DevOps platform project
  createBoundProjectV2(data: CreateBoundProjectV2Request): Promise<BoundProjectV2>
  
  // Get all DevOps Platform Integration settings
  getDopSettingsV2(): Promise<DopSettingsV2Response>
}

// src/resources/dop-translation/types-v2.ts
export interface CreateBoundProjectV2Request {
  dopPlatform: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  projectIdentifier: string;
  organizationName?: string;
  repositoryName?: string;
}

export interface DopSettingsV2Response {
  platforms: Array<{
    key: string;
    name: string;
    enabled: boolean;
    url?: string;
  }>;
}
```

## Migration Notes

### User Groups API Changes
In v1, user groups had their own API endpoint (`/api/user_groups/*`). In v2, this functionality has been moved under the Authorizations API:

- **v1**: `/api/user_groups/search` → **v2**: `/api/v2/authorizations/groups`
- **v1**: `/api/user_groups/create` → **v2**: `POST /api/v2/authorizations/groups`
- **v1**: `/api/user_groups/update` → **v2**: `PATCH /api/v2/authorizations/groups/{id}`
- **v1**: `/api/user_groups/delete` → **v2**: `DELETE /api/v2/authorizations/groups/{id}`

This means the v1 `UserGroupsClient` functionality will be split between:
- Group management → `AuthorizationsClient` (v2)
- Group membership management → `AuthorizationsClient` (v2)

## Technical Implementation Guidelines

### 1. V2 Builder Pattern
All v2 search/list methods should use the V2 builder pattern:

```typescript
export class SearchResourceV2Builder extends BaseBuilder<SearchResourceV2Request, SearchResourceV2Response> {
  // Use buildV2Query utility for query building
  protected buildQuery(): string {
    return buildV2Query(this.params);
  }
  
  // Support v2 pagination pattern
  page(pageIndex: number): this {
    this.params.page = pageIndex;
    return this;
  }
}
```

### 2. Error Handling
Enhance error handling for v2-specific error codes:

```typescript
// Add to errorFactory.ts
if (response.headers.get('content-type')?.includes('application/json')) {
  const v2Error = await response.json();
  if (v2Error.error) {
    // Handle v2 error format
    return mapV2Error(v2Error);
  }
}
```

### 3. Testing Strategy
For each v2 implementation:
1. Create MSW handlers for v2 endpoints
2. Test all CRUD operations
3. Test error scenarios
4. Test pagination
5. Compare with v1 behavior for migration guide

### 4. Documentation
For each implemented v2 API:
1. Update API documentation with v2 examples
2. Add deprecation notices to v1 methods
3. Create migration guide section
4. Update CHANGELOG.md

## Success Metrics

1. **Coverage**: 100% of discovered v2 endpoints implemented
2. **Type Safety**: All v2 responses fully typed
3. **Migration Path**: Clear deprecation notices and migration guides
4. **Performance**: v2 endpoints should show improved performance
5. **Adoption**: Track v2 vs v1 method usage

## Summary of v2 API Implementation Status

### Current Status (Updated: January 30, 2025)
- **Total v2 API Categories**: 8 (not 10 - Projects v2 doesn't exist)
- **Fully Implemented**: 5 (Users, System, Authorizations, Analysis, SCA)
- **Not Implemented**: 3 (Fix Suggestions, DOP Translation, Clean Code Policy)
- **Cleanup Completed**: 
  - ✅ Removed incorrect Projects v2 types
  - ✅ Removed unreleased UserGroupsClient
  - ✅ Consolidated group management under Authorizations

### Implementation Priority Summary
1. **✅ Completed (January 30, 2025)**: 
   - ✅ Authorizations API fully implemented
   - ✅ Analysis API fully implemented with binary download support
   - ✅ SCA API fully implemented with comprehensive SBOM support
   - ✅ Cleaned up incorrect Projects v2 types
   - ✅ Moved user-groups types to authorizations
   - ✅ Removed unreleased UserGroupsClient
2. **Medium Priority (Future)**: Clean Code Policy and Fix Suggestions APIs
3. **Low Priority (Future)**: DOP Translation API

### Key Architectural Changes in v2
- User Groups management moved under Authorizations API
- RESTful HTTP methods (GET, POST, PATCH, DELETE)
- UUID-based identification instead of keys
- Standardized error responses and pagination
- More consistent naming conventions

## Next Steps

1. **✅ Completed (January 30, 2025)**: 
   - ✅ Removed incorrect `src/resources/projects/types-v2.ts` file
   - ✅ Moved user-groups types to authorizations module
   - ✅ Implemented complete Authorizations v2 API
   - ✅ Added comprehensive documentation and examples
2. **Medium Priority (Future)**: Implement Fix Suggestions and Clean Code Policy APIs
3. **Low Priority (Future)**: Add DOP Translation API
4. **Ongoing**: Monitor SonarQube releases for new v2 endpoints

## Implementation Achievements

### Authorizations API (January 30, 2025)
- **Decision**: Skipped v1 UserGroups API entirely, went directly to v2
- **Rationale**: Since UserGroupsClient was unreleased, avoided deprecation burden
- **Benefits**: Clean API surface, no legacy code, modern REST design
- **ADR**: Created ADR-0011 documenting the decision
- **Documentation**: Updated README with comprehensive examples
- **Testing**: Full test coverage with MSW v2 handlers

### Analysis API (January 30, 2025)
- **Implementation**: Complete with all 5 endpoints (7 methods)
- **Binary Downloads**: Implemented streaming support for large JRE files
- **Progress Tracking**: Added download progress callbacks
- **Special Features**: Conditional responses based on Accept headers
- **Testing**: Comprehensive tests including binary download scenarios
- **Integration**: Fully integrated into main SonarQubeClient

### SCA API (January 30, 2025)
- **Implementation**: Complete with comprehensive SBOM support (5 methods)
- **Multi-Format Support**: JSON, SPDX (JSON/RDF), CycloneDX (JSON/XML)
- **Security Features**: Vulnerability tracking with CVE/CVSS scoring
- **Compliance Tools**: License analysis and risk assessment utilities
- **Performance**: Streaming support for large reports (1000+ components)
- **Standards**: SPDX 2.3, CycloneDX 1.4, NTIA compliance
- **Utilities**: Format converters and security/compliance analyzers
- **Testing**: Comprehensive test suite with MSW handlers for all formats
- **Integration**: Fully integrated into main SonarQubeClient

## References

- [SonarQube Web API v2 Documentation](https://next.sonarqube.com/sonarqube/web_api_v2)
- [Existing Implementation Plans](./SONARQUBE_V2_API_INTEGRATION_PLAN.md)
- [Available V2 APIs Plan](./AVAILABLE_V2_APIS_IMPLEMENTATION_PLAN.md)