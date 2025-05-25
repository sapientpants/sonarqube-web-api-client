# 9. Add ALM settings resource support

Date: 2025-05-26

## Status

Accepted

## Context

SonarQube provides the `api/alm_settings` resource for managing DevOps Platform Settings. This API enables integration with various Application Lifecycle Management (ALM) platforms including:

- Azure DevOps
- Bitbucket Server
- Bitbucket Cloud
- GitHub
- GitLab

The ALM settings API provides functionality for:
1. Creating, updating, and deleting ALM platform configurations
2. Binding projects to ALM platforms
3. Validating ALM connections
4. Listing available ALM settings

This is distinct from the existing `api/alm_integrations` resource, which focuses on searching repositories and setting personal access tokens within already configured ALM platforms.

## Decision

We will implement a new `AlmSettingsClient` resource module following our established patterns:

1. **Follow ADR-0002 (Modular Resource-Based Design)**: Create a dedicated `alm-settings` module under `src/resources/`
2. **Use Existing Patterns**: Extend `BaseClient` for common HTTP functionality
3. **Type-Safe Interface**: Define comprehensive TypeScript types for all ALM platforms and operations
4. **Consistent Naming**: Use clear, consistent naming to differentiate from the existing `alm-integrations` resource

### Implementation Details

- **Types**: Separate type definitions for each ALM platform (Azure, Bitbucket, GitHub, GitLab)
- **Operations**: Implement all 24 API endpoints including:
  - CRUD operations for each platform type
  - Project binding management
  - Settings validation
  - Listing operations
- **Testing**: Comprehensive unit tests covering all methods and error scenarios

## Consequences

### Positive

- **Complete ALM Support**: Users can now manage the full lifecycle of ALM integrations
- **Type Safety**: Strong typing for each platform's specific requirements
- **Consistency**: Follows established patterns making it easy to understand and maintain
- **Separation of Concerns**: Clear distinction between settings management (`alm_settings`) and repository operations (`alm_integrations`)

### Negative

- **Naming Overlap**: Both resources use "ALM" which could cause confusion
- **Complexity**: Supporting 5 different platforms with their unique requirements adds complexity
- **Maintenance**: Need to keep up with changes to each platform's API

### Mitigation

- Used distinct type names (e.g., `AlmSettingDefinition` instead of `AlmSetting`) to avoid conflicts
- Comprehensive documentation explaining the difference between `alm_settings` and `alm_integrations`
- Clear method naming that reflects the operation being performed