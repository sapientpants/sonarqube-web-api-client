# Issues API Analysis and Implementation Gaps

## Summary

This document outlines the differences between the documented SonarQube Issues API and the current implementation in this client library.

## Missing Endpoints

The following endpoints are documented in the API but not implemented in the client:

### 1. `GET api/issues/authors` (since 5.1)
- **Purpose**: Search SCM accounts which match a given query
- **Parameters**: 
  - `q` (optional): Query string
  - `ps` (optional): Page size (default 10, max 100)
  - `project` (optional): Project key
- **Returns**: List of SCM authors
- **Note**: Returns 503 when issue indexing is in progress

### 2. `POST api/issues/bulk_change` (since 3.7)
- **Purpose**: Bulk change on issues. Up to 500 issues can be updated
- **Parameters**:
  - `issues` (required): Comma-separated list of issue keys
  - `add_tags` (optional): Tags to add
  - `remove_tags` (optional): Tags to remove
  - `assign` (optional): Assignee login or '_me_'
  - `set_severity` (optional): New severity
  - `set_type` (optional): New type
  - `do_transition` (optional): Transition to apply
  - `comment` (optional): Comment to add
  - `sendNotifications` (optional): Send notifications (default false)

### 3. `GET api/issues/changelog` (since 4.1)
- **Purpose**: Display changelog of an issue
- **Parameters**:
  - `issue` (required): Issue key
- **Returns**: List of changelog entries

### 4. `POST api/issues/delete_comment` (since 3.6)
- **Purpose**: Delete a comment
- **Parameters**:
  - `comment` (required): Comment key

### 5. `POST api/issues/edit_comment` (since 3.6)
- **Purpose**: Edit a comment
- **Parameters**:
  - `comment` (required): Comment key
  - `text` (required): New comment text

### 6. `GET api/issues/gitlab_sast_export` (since 10.2)
- **Purpose**: Return vulnerabilities in GitLab SAST JSON format
- **Parameters**:
  - `project` (required): Project key
  - `branch` (optional): Branch key
  - `pullRequest` (optional): Pull request id

### 7. `POST api/issues/reindex` (since 9.8)
- **Purpose**: Reindex issues for a project
- **Parameters**:
  - `project` (required): Project key
- **Requires**: Administer System permission

### 8. `POST api/issues/set_severity` (since 3.6)
- **Purpose**: Change severity
- **Parameters**:
  - `issue` (required): Issue key
  - `severity` (required): New severity
- **Requires**: Administer Issues permission

### 9. `GET api/issues/tags` (since 5.1)
- **Purpose**: List tags matching a given query
- **Parameters**:
  - `q` (optional): Query string (limit 2 chars min)
  - `ps` (optional): Page size (default 10, max 100)
  - `organization` (optional): Organization key

## Missing Search Parameters

The search endpoint is missing several parameters:

### New in recent versions:
- `casa` (since 10.7): Comma-separated list of CASA categories
- `codeVariants` (since 10.1): Comma-separated list of code variants
- `fixedInPullRequest` (since 10.4): Pull request id to filter issues that would be fixed
- `owaspAsvs-4.0` (since 9.7): OWASP ASVS v4.0 categories
- `owaspAsvsLevel` (since 9.7): Level of OWASP ASVS categories (1, 2, or 3)
- `owaspMobileTop10-2024` (since 2025.3): OWASP Mobile Top 10 2024 categories
- `pciDss-3.2` (since 9.6): PCI DSS v3.2 categories
- `pciDss-4.0` (since 9.6): PCI DSS v4.0 categories
- `prioritizedRule`: To match issues with prioritized rule or not
- `stig-ASD_V5R3` (since 10.7): STIG V5R3 categories
- `timeZone` (since 8.6): For date resolution and histogram computation

### Deprecated parameters still in use:
- `statuses` → should map to `issueStatuses`
- `severities` → deprecated in favor of `impactSeverities`
- `types` → deprecated in favor of Clean Code taxonomy
- `resolutions` → deprecated in favor of `issueStatuses`

## Implementation Issues

### 1. Multiple Parameter Values
The API documentation shows that the `author` parameter should be called once for each value:
```
author=torvalds@linux-foundation.org&author=linux@fondation.org
```
But the current implementation joins arrays with commas.

### 2. Parameter Name Mapping
Several parameters need special handling:
- `owaspTop10-2021` (with hyphen in API)
- `pciDss-3.2` and `pciDss-4.0` (with periods)
- `owaspAsvs-4.0` (with hyphen and period)

### 3. Error Handling
The API returns 503 when issue indexing is in progress. This should be handled specially.

### 4. Response Types
Many endpoints return similar response structures with:
- `issue`: The updated issue
- `components`: Array of component information
- `rules`: Array of rule information
- `users`: Array of user information

These could be consolidated into a common response type.

## Deprecated Parameters Migration Guide

| Deprecated Parameter | New Parameter | Notes |
|---------------------|---------------|-------|
| `componentKeys` | `components` | Use `components` for consistency with API |
| `componentRootUuids` | `components` | Merged into unified `components` parameter |
| `componentRoots` | `components` | Merged into unified `components` parameter |
| `componentUuids` | `components` | Merged into unified `components` parameter |
| `fileUuids` | `files` | Use file paths instead of UUIDs |
| `moduleUuids` | N/A | Modules concept removed from SonarQube |
| `projectUuids` | `projects` | Use project keys instead of UUIDs |
| `severities` | `impactSeverities` | Part of Clean Code taxonomy |
| `statuses` | `issueStatuses` | New issue workflow states |
| `types` | `impactSoftwareQualities` | Part of Clean Code taxonomy |

## Recommendations

1. **High Priority**: Add missing endpoints that are commonly used:
   - `authors` - for author search
   - `bulk_change` - for bulk operations
   - `changelog` - for issue history
   - `set_severity` - for severity changes
   - `tags` - for tag search

2. **Medium Priority**: Update search parameters:
   - Add new security-related parameters (OWASP, PCI DSS, etc.)
   - Fix parameter mapping for special cases
   - Update deprecated parameter handling

3. **Low Priority**: 
   - Add specialized endpoints like `gitlab_sast_export`
   - Improve error handling for indexing state
   - Add comprehensive integration tests

## Breaking Changes to Consider

1. The `statuses` parameter is deprecated - consider migration path
2. The severity/type/resolution model is being replaced by Clean Code taxonomy
3. Multiple parameter handling needs to change for `author`