# 10. Adopt parallel v1/v2 API pattern for SonarQube Web API v2 integration

Date: 2025-05-29

## Status

Proposed

## Context

SonarQube is transitioning from their original Web API (v1) to a new REST-compliant Web API v2. This transition is
happening gradually, with new v2 endpoints being introduced while v1 endpoints are deprecated following their
standard deprecation policy.

Key characteristics of this transition:

1. v2 endpoints follow REST standards (proper HTTP verbs, consistent naming)
2. v2 and v1 will coexist for multiple release cycles
3. When a v2 endpoint is introduced, the v1 equivalent is deprecated
4. Deprecated v1 endpoints remain available until the next LTS, then removed

Our client library needs a strategy to:

- Support both v1 and v2 endpoints
- Provide a smooth migration path for users
- Leverage our existing deprecation system
- Maintain backward compatibility

## Decision

We will adopt a parallel implementation pattern where v2 methods coexist with v1 methods in the same client classes.
This pattern:

1. **Adds v2 methods with "V2" suffix** (e.g., `searchV2()` alongside `search()`)
2. **Keeps both APIs in the same client** rather than separate v1/v2 clients
3. **Uses our deprecation system** to mark v1 methods when v2 equivalents exist
4. **Maintains separate types** for v1 and v2 responses
5. **Shares the same BaseClient** infrastructure with v2-aware enhancements

Example implementation:

```typescript
export class ProjectsClient extends BaseClient {
  // V1 method (deprecated when v2 exists)
  @Deprecated({
    deprecatedSince: '10.5',
    replacement: 'searchV2()',
    reason: 'V1 endpoint deprecated in favor of REST-compliant v2',
  })
  search(): SearchProjectsBuilder {
    return new SearchProjectsBuilder((params) => this.request('/api/projects/search', { params }));
  }

  // V2 method
  searchV2(): SearchProjectsV2Builder {
    return new SearchProjectsV2Builder((params) =>
      this.request('/api/v2/projects', {
        method: 'GET',
        params,
      }),
    );
  }

  // V2 REST operations
  async getProjectV2(id: string): Promise<ProjectV2> {
    return this.request(`/api/v2/projects/${id}`);
  }

  async updateProjectV2(id: string, data: Partial<ProjectV2>): Promise<ProjectV2> {
    return this.request(`/api/v2/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
```

## Consequences

### Positive

1. **Smooth Migration Path**: Users can migrate incrementally, method by method
2. **No Breaking Changes**: Existing v1 code continues to work
3. **Clear Deprecation Signals**: IDE warnings guide users to v2
4. **Consistent Experience**: Same client object, familiar patterns
5. **Type Safety**: Separate types prevent v1/v2 confusion
6. **Leverages Existing Infrastructure**: Reuses BaseClient, builders, error handling
7. **Future-Proof**: Easy to remove v1 methods after deprecation period

### Negative

1. **Increased API Surface**: Both v1 and v2 methods in same class
2. **Naming Convention**: "V2" suffix might feel redundant long-term
3. **Maintenance Overhead**: Supporting two API versions
4. **Type Duplication**: Separate v1/v2 types even when similar
5. **Documentation Complexity**: Must document both versions

### Mitigation Strategies

- Use deprecation warnings to actively guide migration
- Consider removing "V2" suffix after v1 is removed (major version)
- Generate v2 types from OpenAPI spec when available
- Create migration guides with clear examples
- Monitor v2 adoption through telemetry

## Alternatives Considered

### 1. Separate V2 Client

```typescript
const clientV1 = new SonarQubeClient(config);
const clientV2 = new SonarQubeClientV2(config);
```

- **Pros**: Clean separation, no naming conflicts
- **Cons**: Requires users to manage two clients, harder migration

### 2. Version Parameter

```typescript
const client = new SonarQubeClient({ ...config, apiVersion: 'v2' });
```

- **Pros**: Single client, explicit version choice
- **Cons**: Can't use both versions simultaneously, all-or-nothing migration

### 3. Wrapper/Adapter Pattern

```typescript
const v2Client = client.v2.projects.search();
```

- **Pros**: Namespace separation, clear versioning
- **Cons**: Changes familiar API patterns, deeper nesting

### 4. Feature Flags

```typescript
client.enableV2APIs();
client.projects.search(); // Now uses v2
```

- **Pros**: Gradual rollout possible
- **Cons**: Runtime behavior changes, harder to reason about

## Implementation Notes

The parallel pattern has already been proven with the Users API, which successfully implements both `search()` (v1)
and `searchV2()` methods. This establishes the pattern and demonstrates its viability.

Key implementation guidelines:

1. Always implement v2 methods as additive changes
2. Use `@Deprecated` decorator when v1 has a v2 equivalent
3. Keep v1 tests intact while adding v2 tests
4. Document migration path in method JSDoc
5. Consider builder inheritance to share common logic

## References

- [SonarQube Web API v2 Announcement](https://www.sonarsource.com/blog/new-web-api-v2/)
- [REST Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html)
- [Semantic Versioning](https://semver.org/)
- Internal: Users API v2 implementation (src/resources/users/)
