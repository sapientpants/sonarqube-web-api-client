# 6. Use async iterators for pagination

Date: 2025-05-25

## Status

Accepted

## Context

The SonarQube Web API uses pagination for endpoints that return large result sets. The typical pagination pattern includes:

- A `p` parameter for page number (1-based)
- A `ps` parameter for page size (default 100, max 500)
- A `paging` object in responses with `pageIndex`, `pageSize`, and `total`

Common challenges when working with paginated APIs include:

- **Manual Page Management**: Developers need to manually track page numbers and make multiple requests
- **Memory Concerns**: Loading all results at once can cause memory issues for large datasets
- **Complex Loop Logic**: Implementing pagination loops with error handling is repetitive and error-prone
- **Inconsistent Patterns**: Different approaches to pagination across codebases lead to maintenance issues

We need to design an elegant way to handle large result sets that is both developer-friendly and memory-efficient.

## Decision

We will implement async iterators (Symbol.asyncIterator) for automatic pagination handling. This approach will:

1. **Provide a `searchAll()` method variant** for paginated endpoints:
   ```typescript
   // Regular method returns single page
   const page = await client.issues.search({ projectKey: 'my-project' });
   
   // searchAll variant returns async iterator
   for await (const issue of client.issues.searchAll({ projectKey: 'my-project' })) {
     console.log(issue);
   }
   ```

2. **Handle pagination automatically** by:
   - Making the initial request
   - Yielding items from each page
   - Fetching next pages as needed
   - Stopping when all pages are consumed

3. **Support early termination**:
   ```typescript
   for await (const issue of client.issues.searchAll()) {
     if (issue.severity === 'BLOCKER') {
       break; // Stops fetching additional pages
     }
   }
   ```

4. **Provide utility methods** for common operations:
   ```typescript
   // Convert to array (loads all pages)
   const allIssues = await client.issues.searchAll().toArray();
   
   // Take first N items
   const first100 = await client.issues.searchAll().take(100).toArray();
   ```

## Consequences

### Positive

- **Clean API**: Developers can iterate over results without managing pagination logic
- **Memory Efficient**: Only loads one page at a time, suitable for large datasets
- **Lazy Evaluation**: Pages are only fetched as needed, reducing unnecessary API calls
- **Composable**: Works well with async iteration utilities and operators
- **Familiar Pattern**: Follows JavaScript's standard iteration protocols
- **Early Termination**: Breaking from loop prevents fetching unnecessary pages

### Negative

- **Modern JavaScript Required**: Async iterators require ES2018+ or transpilation
- **Learning Curve**: Developers unfamiliar with async iterators need to learn the pattern
- **No Random Access**: Cannot jump to specific pages without iterating through previous ones
- **Debugging Complexity**: Async iteration can be harder to debug than simple arrays
- **Performance Considerations**: Multiple sequential requests may be slower than parallel fetching for known sizes
