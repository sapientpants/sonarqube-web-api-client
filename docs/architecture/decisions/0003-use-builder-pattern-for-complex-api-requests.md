# 3. Use builder pattern for complex API requests

Date: 2025-05-25

## Status

Accepted

## Context

Many SonarQube API endpoints accept numerous optional parameters. For example, the issues search endpoint can accept:

- Multiple project keys
- Multiple component keys
- Severity levels
- Issue types
- Statuses
- Tags
- Date ranges
- Pagination parameters
- Sorting options

Using traditional method signatures with many optional parameters leads to:

- Poor readability when many parameters are passed
- Difficulty in understanding which parameters are being set
- Potential for parameter order confusion
- Verbose method signatures that are hard to maintain

## Decision

We will implement a builder pattern for API endpoints that have more than 3-4 optional parameters. This will
provide a fluent interface for constructing complex queries:

```typescript
const issues = await client.issues
  .search()
  .withProjects(['project1', 'project2'])
  .withSeverities(['MAJOR', 'CRITICAL'])
  .withTypes(['BUG', 'VULNERABILITY'])
  .withStatuses(['OPEN', 'REOPENED'])
  .withTags(['security', 'performance'])
  .createdAfter('2024-01-01')
  .assignedTo('john.doe')
  .sortBy('SEVERITY')
  .pageSize(50)
  .execute();
```

For simple endpoints with few parameters, we'll provide direct methods:

```typescript
// Simple endpoint - direct method
const project = await client.projects.get('project-key');

// Complex endpoint - builder pattern
const projects = await client.projects
  .search()
  .withQuery('mobile')
  .withQualityGates(['gate1'])
  .execute();
```

## Consequences

### Positive

- **Improved readability**: Method chaining clearly shows what parameters are being set
- **Better IntelliSense**: Each builder method can have specific documentation and type hints
- **Flexible API**: Easy to add new parameters without breaking existing code
- **Self-documenting**: The fluent interface acts as documentation
- **Type safety**: Each builder method can enforce correct types for its specific parameter
- **Reusability**: Builders can be partially configured and reused

### Negative

- **Additional complexity**: Requires implementing builder classes for complex endpoints
- **Learning curve**: Developers need to understand the builder pattern
- **More code**: Builder pattern requires more implementation code than simple methods
- **Potential confusion**: Having two patterns (direct methods and builders) might be confusing

### Mitigation

- Provide clear documentation on when to use builders vs direct methods
- Use a consistent threshold (e.g., >4 optional parameters) for when to use builders
- Implement a base builder class to reduce boilerplate
- Ensure all builder methods return properly typed builders for chaining
- Consider generating builders from API specifications to reduce manual work
