# SonarQube Web API Deprecations

This document tracks all deprecated and removed APIs in the SonarQube Web API based on the official API specification. It serves as a reference for maintaining backward compatibility and planning migrations.

## Table of Contents

- [Completely Removed APIs](#completely-removed-apis)
- [Deprecated Services](#deprecated-services)
- [Deprecated Actions by Domain](#deprecated-actions-by-domain)
- [Deprecated Parameters](#deprecated-parameters)
- [Timeline Summary](#timeline-summary)
- [Implementation Status](#implementation-status)

## Completely Removed APIs

These APIs have been removed from SonarQube and are no longer available:

### 1. Favourites API (`api/favourites`)
- **Removed Since**: 6.3
- **Replacement**: Use `api/favorites` instead
- **Action Removed**: `index`
- **Implementation Status**: ✅ Not implemented (correctly excluded)

### 2. Time Machine API (`api/timemachine`)
- **Removed Since**: 6.3
- **Replacement**: Use `api/measures/search_history` instead
- **Description**: Was used to retrieve historical measures
- **Implementation Status**: ✅ Not implemented (correctly excluded)

### 3. User Properties API (`api/user_properties`)
- **Removed Since**: 6.3
- **Replacement**: Split into:
  - `api/favorites` for managing favorite projects
  - `api/notifications` for managing notification preferences
- **Action Removed**: `index`
- **Implementation Status**: ✅ Implemented with deprecation handling

## Deprecated Services

### Properties API (`api/properties`)
- **Deprecated Since**: 6.3
- **Status**: Still available but deprecated
- **Replacement**: Use `api/settings` instead
- **Description**: Manage SonarQube properties and settings
- **Implementation Status**: ❌ Not implemented

## Deprecated Actions by Domain

### 1. Issues Management

#### Severity and Type Management
- **Deprecated Since**: August 25, 2023
- **Actions**:
  - `api/issues/set_severity` - Change severity of issues
  - `api/issues/set_type` - Change type of issue
- **Impact**: Can no longer change issue severity or type after deprecation
- **Implementation Status**: ⚠️ Methods exist but need deprecation warnings

### 2. Quality Profiles

#### Export/Import Functionality
- **Deprecated Since**: March 18, 2025
- **Actions**:
  - `api/qualityprofiles/export` → Use `GET /api/qualityprofiles/backup`
  - `api/qualityprofiles/exporters` - No more custom profile exporters
  - `api/qualityprofiles/importers` - No more custom profile importers
- **Implementation Status**: ⚠️ Methods exist but need deprecation warnings

#### Built-in Profile Restoration
- **Deprecated Since**: 6.4
- **Action**: `api/qualityprofiles/restore_built_in`
- **Status**: Returns HTTP 410 (Gone)
- **Reason**: Built-in profiles are automatically updated and read-only
- **Implementation Status**: ⚠️ Method exists but needs deprecation warning

### 3. Permissions

#### Search Permissions
- **Deprecated Since**: 6.5
- **Actions**:
  - `api/permissions/search_global_permissions` - List global permissions
  - `api/permissions/search_project_permissions` - List project permissions
- **Implementation Status**: ⚠️ Methods exist but need deprecation warnings

### 4. Users

#### User Search
- **Deprecated Since**: February 10, 2025
- **Will be dropped**: August 13, 2025
- **Action**: `api/users/search`
- **Replacement**: Use `/users/users?organizationIds=<organization-uuid>`
- **Implementation Status**: ✅ Already has deprecation warnings and V2 implementation

### 5. Metrics

#### Domains Listing
- **Deprecated Since**: 7.7
- **Action**: `api/metrics/domains` - List all custom metric domains
- **Implementation Status**: ⚠️ Method exists but needs deprecation warning

### 6. Projects

#### Bulk Key Update
- **Deprecated Since**: 7.6
- **Action**: `api/projects/bulk_update_key` - Bulk update project keys
- **Replacement**: Use individual project key updates
- **Implementation Status**: ⚠️ Method exists but needs deprecation warning

### 7. Quality Gates

#### Unset Default
- **Deprecated Since**: 7.0
- **Action**: `api/qualitygates/unset_default`
- **Status**: No longer available
- **Reason**: A default quality gate is mandatory
- **Implementation Status**: ⚠️ Method exists but needs deprecation warning

## Deprecated Parameters

### Issues API
- **`api/issues/bulk_change`**:
  - `set_severity` (deprecated August 25, 2023)
  - `set_type` (deprecated August 25, 2023)
- **`api/issues/search`**:
  - `facetMode` (deprecated 7.9)
  - `resolutions` (deprecated July 3, 2024)
  - `severities` (deprecated August 25, 2023)
  - `statuses` (deprecated July 3, 2024)
  - `types` (deprecated August 25, 2023)

### Quality Profiles API
- **Multiple actions** (deprecated 6.6):
  - `key` parameter deprecated in favor of profile name/language combination
  - Affected actions: `add_project`, `backup`, `change_parent`, `changelog`, `delete`, `export`, `inheritance`, `remove_project`, `set_default`

### Permissions API
- **`groupId` parameter** (deprecated April 7, 2025):
  - Use `groupName` and `organization` instead
  - Affected actions: `add_group`, `add_group_to_template`, `remove_group`, `remove_group_from_template`

### Projects API
- **`api/projects/create`**: `branch` parameter (deprecated 7.8)
- **`api/projects/bulk_delete`**: `qualifiers` parameter (deprecated 8.0)
- **`api/projects/search`**: `qualifiers` parameter (deprecated 8.0)

### Component/CE API
- **`componentId`** (deprecated 6.6/8.0): Use `component` instead
- **`componentKey`** in `activity_status` (deprecated 6.6)

### Measures API
- **Developer Cockpit parameters** (deprecated 6.4):
  - `developerId`
  - `developerKey`
- **Component ID parameters**:
  - `componentId` (deprecated 6.6)
  - `baseComponentId` (deprecated 6.6)

### Other APIs
- **`api/duplications/show`**: `uuid` parameter (deprecated 6.5)
- **`api/rules/update`**: `debt_sub_characteristic` parameter (deprecated 5.5, ignored)
- **`api/qualitygates/deselect`**: `projectId` parameter (deprecated 6.1)
- **`api/metrics/search`**: `f` parameter (deprecated 7.7)

## Timeline Summary

### Version-based Deprecations
| Version | Deprecations |
|---------|-------------|
| 5.5 | Rules debt characteristics |
| 6.1 | Quality gates projectId |
| 6.3 | Multiple services removed (favourites, timemachine, user_properties), properties deprecated |
| 6.4 | Quality profiles restore_built_in, Developer Cockpit parameters |
| 6.5 | Permissions search actions, various parameters |
| 6.6 | Multiple component ID parameters, quality profile keys |
| 7.0 | Quality gates unset_default |
| 7.6 | Projects bulk_update_key |
| 7.7 | Metrics domains and search parameter |
| 7.8 | Projects branch parameter |
| 7.9 | Issues facetMode |
| 8.0 | Component ID parameters, project qualifiers |

### Date-based Deprecations
| Date | Deprecations | Drop Date |
|------|-------------|-----------|
| August 25, 2023 | Issues severity and type management | - |
| July 3, 2024 | Issues resolutions and statuses | - |
| February 10, 2025 | Users search | August 13, 2025 |
| March 18, 2025 | Quality profiles export/importers | - |
| April 7, 2025 | Permissions groupId parameters | - |

## Implementation Status

### Summary
- ✅ **Correctly Handled**: 3 (removed APIs not implemented, user search with V2)
- ⚠️ **Need Deprecation Warnings**: 8 actions
- ❌ **Not Implemented**: 1 (properties API)

### Action Items
1. **High Priority** (approaching drop dates):
   - Ensure users.search() migration to V2 is complete
   - Add warnings for quality profiles export functionality

2. **Medium Priority** (recently deprecated):
   - Add deprecation warnings for issues severity/type methods
   - Update permissions methods to warn about groupId deprecation

3. **Low Priority** (old deprecations):
   - Add warnings for pre-7.0 deprecated methods
   - Consider removing very old deprecated parameters

### Deprecation Handling Strategy
1. Use `@Deprecated` decorator for methods
2. Use `@DeprecatedParameter` for specific parameters
3. Provide clear migration guides
4. Set removal dates based on SonarQube's timeline
5. Use compatibility bridges where possible