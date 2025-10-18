# 11. Adopt Authorizations v2 API for Group Management

Date: 2025-01-30

## Status

Accepted

## Context

SonarQube 10.5 introduced a new Authorizations v2 API that consolidates group management and permissions under a
unified interface. This replaces the legacy `api/user_groups` endpoint with a modern REST-compliant API at
`api/v2/authorizations`.

The v2 API offers several improvements:

- RESTful design with proper HTTP verbs (GET, POST, PATCH, DELETE)
- UUID-based identification instead of keys/logins
- Dedicated endpoints for group membership management
- Better support for external provider integration (LDAP/SAML)
- Consistent pagination structure with other v2 APIs
- Clearer separation between managed and non-managed groups

Since the UserGroupsClient was not yet released (still in the Unreleased section of CHANGELOG), we had the
opportunity to skip the v1 implementation entirely and go directly to v2.

## Decision

We will implement only the Authorizations v2 API for group management, skipping the legacy user_groups API entirely.
This means:

1. No UserGroupsClient will be released
2. Users will use `client.authorizations` for all group management operations
3. The API will require SonarQube 10.5+ for group management features

## Consequences

### Positive

- **Clean API Surface**: Users only have one way to manage groups, avoiding confusion
- **No Deprecation Burden**: No need to maintain deprecated v1 methods
- **Modern Design**: Users benefit from REST-compliant API design from day one
- **Better Type Safety**: UUID-based identification provides stronger type guarantees
- **Future-Proof**: Aligned with SonarQube's API modernization direction

### Negative

- **Version Requirement**: Group management requires SonarQube 10.5+
- **No Backward Compatibility**: Users on older SonarQube versions cannot use group management
- **Learning Curve**: Users familiar with v1 API patterns need to learn v2 patterns

### Neutral

- **Documentation**: Need clear documentation about version requirements
- **Migration Path**: Users upgrading from other libraries need migration guides

## Implementation Details

The AuthorizationsClient provides:

```typescript
// Group CRUD operations
client.authorizations.searchGroupsV2();
client.authorizations.createGroupV2(data);
client.authorizations.getGroupV2(id);
client.authorizations.updateGroupV2(id, data);
client.authorizations.deleteGroupV2(id);

// Membership management
client.authorizations.searchGroupMembershipsV2();
client.authorizations.addGroupMembershipV2(data);
client.authorizations.removeGroupMembershipV2(id);
```

All methods follow v2 conventions:

- Builder pattern for search operations
- UUID-based identification
- Proper HTTP verbs
- Consistent error handling
- Full TypeScript support

## References

- SonarQube Web API v2 Documentation: <https://next.sonarqube.com/sonarqube/web_api_v2>
- SonarQube 10.5 Release Notes
- ADR-0010: Adopt Parallel v1/v2 API Pattern (related pattern)
