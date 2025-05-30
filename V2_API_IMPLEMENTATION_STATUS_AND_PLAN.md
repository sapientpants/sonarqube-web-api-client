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

### 🟡 Type Definitions Only (No Implementation)

1. **Authorizations API** (`/api/v2/authorizations/*`)
   - Types defined in: `src/resources/authorizations/types.ts`
   - Group types incorrectly placed in: `src/resources/user-groups/types-v2.ts`
   - No client implementation yet
   - Note: v2 API combines group management and permissions under authorizations

### ⚠️ Incorrectly Created Types (No v2 API Exists)

1. **Projects** (`src/resources/projects/types-v2.ts`)
   - **No Projects v2 API exists in SonarQube**
   - This file should be removed
   - Projects API remains v1 only

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

4. **SCA API** (`/api/v2/sca/*`)
   - Purpose: Software Composition Analysis (SBOM reports)
   - Endpoints: 1 (sbom-reports)
   - Priority: HIGH (security/compliance)

5. **Analysis API** (`/api/v2/analysis/*`)
   - Purpose: Scanner management and project analysis
   - Endpoints: 5 (active rules, engine, JREs, version)
   - Priority: HIGH (core functionality)

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

### Authorizations (🟡 Types Only)
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

### SCA (🔲 Not Implemented)
- `GET /api/v2/sca/sbom-reports` - Get a software bill of materials (SBOM) report

### Analysis (🔲 Not Implemented)
- `GET /api/v2/analysis/active_rules` - Get all active rules for a specific project
- `GET /api/v2/analysis/engine` - Scanner engine download/metadata
- `GET /api/v2/analysis/jres` - All JREs metadata
- `GET /api/v2/analysis/jres/{id}` - JRE download/metadata
- `GET /api/v2/analysis/version` - Server version

## Implementation Plan

### Phase 1: Complete Partially Implemented APIs (Week 1)

#### 1. Authorizations API
Implement the full authorizations API with both group management and permissions:

```typescript
// src/resources/authorizations/AuthorizationsClient.ts
export class AuthorizationsClient extends BaseClient {
  // Group management (v2)
  searchGroupsV2(): SearchGroupsV2Builder
  createGroupV2(data: CreateGroupV2Request): Promise<GroupV2>
  getGroupV2(id: string): Promise<GroupV2>
  updateGroupV2(id: string, data: UpdateGroupV2Request): Promise<GroupV2>
  deleteGroupV2(id: string): Promise<void>
  
  // Group memberships (v2)
  searchGroupMembershipsV2(): SearchGroupMembershipsV2Builder
  addGroupMembershipV2(data: AddGroupMembershipV2Request): Promise<GroupMembershipV2>
  removeGroupMembershipV2(id: string): Promise<void>
}
```

**Note**: The group types currently in `src/resources/user-groups/types-v2.ts` should be moved to the authorizations module since the v2 API endpoints are under `/api/v2/authorizations/groups/*`.

#### 2. Cleanup Incorrect Types
Remove the incorrectly created Projects v2 types:
- Delete `src/resources/projects/types-v2.ts` (no Projects v2 API exists)

### Phase 2: High-Priority New APIs (Week 2)

#### 3. Analysis API
Create new resource for scanner and project analysis management:

```typescript
// src/resources/analysis/AnalysisClient.ts
export class AnalysisClient extends BaseClient {
  // Get all active rules for a specific project
  getActiveRulesV2(projectKey: string): Promise<ActiveRulesV2Response>
  
  // Scanner engine management
  getEngineMetadataV2(): Promise<EngineMetadataV2>
  downloadEngineV2(): Promise<Blob>
  
  // JRE management for scanners
  getAllJresMetadataV2(): Promise<JreMetadataV2[]>
  getJreMetadataV2(id: string): Promise<JreMetadataV2>
  downloadJreV2(id: string): Promise<Blob>
  
  // Get server version
  getVersionV2(): Promise<VersionV2Response>
}
```

#### 4. SCA (Software Composition Analysis) API
Create new resource for SBOM (Software Bill of Materials) management:

```typescript
// src/resources/sca/ScaClient.ts
export class ScaClient extends BaseClient {
  // Get SBOM report for a project
  getSbomReportV2(params: SbomReportV2Request): Promise<SbomReportV2Response>
}

// src/resources/sca/types-v2.ts
export interface SbomReportV2Request {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  format?: 'json' | 'spdx' | 'cyclonedx';
}

export interface SbomReportV2Response {
  format: string;
  components: SbomComponentV2[];
  dependencies: SbomDependencyV2[];
  vulnerabilities?: SbomVulnerabilityV2[];
}
```

### Phase 3: Medium-Priority APIs (Week 3)

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

### Phase 4: Low-Priority APIs (Week 4)

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

### Current Status
- **Total v2 API Categories**: 8 (not 10 - Projects v2 doesn't exist)
- **Fully Implemented**: 2 (Users, System)
- **Partially Implemented (Types Only)**: 1 (Authorizations)
- **Not Implemented**: 5 (Fix Suggestions, DOP Translation, Clean Code Policy, SCA, Analysis)
- **Incorrectly Created**: Projects v2 types (should be removed)

### Implementation Priority Summary
1. **Immediate (Week 1)**: 
   - Complete Authorizations API (types already exist)
   - Clean up incorrect Projects v2 types
   - Move user-groups types to authorizations
2. **High Priority (Week 2)**: Analysis API (core functionality) and SCA API (security/compliance)
3. **Medium Priority (Week 3)**: Clean Code Policy and Fix Suggestions APIs
4. **Low Priority (Week 4)**: DOP Translation API

### Key Architectural Changes in v2
- User Groups management moved under Authorizations API
- RESTful HTTP methods (GET, POST, PATCH, DELETE)
- UUID-based identification instead of keys
- Standardized error responses and pagination
- More consistent naming conventions

## Next Steps

1. **Immediate**: 
   - Remove incorrect `src/resources/projects/types-v2.ts` file
   - Move user-groups types to authorizations module
2. **Week 1**: Implement Authorizations v2 API
3. **Week 2**: Add Analysis and SCA APIs for core functionality
4. **Week 3**: Implement Fix Suggestions and Clean Code Policy APIs
5. **Week 4**: Add DOP Translation API
6. **Ongoing**: Monitor SonarQube releases for new v2 endpoints

## References

- [SonarQube Web API v2 Documentation](https://next.sonarqube.com/sonarqube/web_api_v2)
- [Existing Implementation Plans](./SONARQUBE_V2_API_INTEGRATION_PLAN.md)
- [Available V2 APIs Plan](./AVAILABLE_V2_APIS_IMPLEMENTATION_PLAN.md)