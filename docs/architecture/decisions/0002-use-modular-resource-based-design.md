# 2. Use modular resource-based design

Date: 2025-05-25

## Status

Accepted

## Context

We need to design a TypeScript client for the SonarQube Web API that will support dozens of different API endpoints across
multiple resource domains (projects, issues, users, rules, quality gates, etc.). The client needs to be:

- Easy to extend with new endpoints
- Intuitive to use with good discoverability
- Type-safe with proper TypeScript support
- Maintainable as the API evolves

The SonarQube API is organized around resources, with each resource having multiple operations (CRUD operations, search,
bulk operations, etc.).

## Decision

We will organize the client using a modular resource-based design where:

1. Each API resource domain (projects, issues, users, etc.) gets its own dedicated module/class
2. The main `SonarQubeClient` acts as a facade that composes all resource modules
3. Each resource module encapsulates all operations related to that resource
4. Resource modules inherit from a base class that provides common HTTP functionality

Example structure:

```typescript
const client = new SonarQubeClient(config);
client.projects.search({ query: 'my-project' });
client.issues.search({ projectKeys: ['key1'] });
client.users.create({ login: 'john.doe' });
```

## Consequences

### Positive

- **Better organization**: Related endpoints are grouped together logically
- **Improved discoverability**: IDEs can autocomplete available resources and methods
- **Easier maintenance**: Changes to one resource don't affect others
- **Parallel development**: Multiple developers can work on different resources simultaneously
- **Clear separation of concerns**: Each module handles its own types, validation, and business logic
- **Extensibility**: New resources can be added without modifying existing code

### Negative

- **More boilerplate**: Each resource needs its own class/module setup
- **Potential duplication**: Similar patterns might be repeated across resources
- **Learning curve**: Developers need to understand the resource hierarchy
- **Bundle size**: Modular design might lead to larger bundle if tree-shaking isn't properly configured

### Mitigation

- Use a base class to share common functionality and reduce boilerplate
- Implement proper tree-shaking in the build configuration
- Provide clear documentation showing the resource hierarchy
- Use TypeScript generics to reduce code duplication where possible
