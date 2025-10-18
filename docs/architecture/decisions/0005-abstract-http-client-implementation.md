# 5. Abstract HTTP client implementation

Date: 2025-05-25

## Status

Accepted

## Context

When building our SonarQube client, we need to decide how to handle HTTP communication. A common approach is to
directly use the Fetch API, but this would create several challenges:

- **Limited Environment Support**: The Fetch API is not available in older Node.js versions (< 18) without
  polyfills
- **Testing Complexity**: Direct HTTP calls would make it difficult to test the business logic in isolation
- **Flexibility Constraints**: Users wouldn't be able to easily substitute their preferred HTTP library (axios,
  node-fetch, got, etc.)
- **Interceptor Support**: Adding features like request/response interceptors, retries, or custom middleware would be
  difficult

We should decouple the HTTP implementation from the business logic to support different HTTP libraries and enable
better testing strategies.

## Decision

We will introduce an `HttpClient` interface that abstracts the HTTP communication layer. The implementation will
follow these principles:

1. **Define a minimal HTTP client interface**:

   ```typescript
   interface HttpClient {
     request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
   }
   ```

2. **Provide pluggable implementations**:
   - `FetchHttpClient` (default, using native Fetch API)
   - `AxiosHttpClient` (for axios users)
   - `NodeFetchHttpClient` (for older Node.js versions)

3. **Support dependency injection**:

   ```typescript
   const client = new SonarQubeClient({
     baseUrl: 'https://sonarqube.example.com',
     httpClient: new AxiosHttpClient(axiosInstance),
   });
   ```

4. **Maintain backward compatibility** by using FetchHttpClient as the default when no httpClient is provided.

## Consequences

### Positive

- **Flexibility**: Users can choose their preferred HTTP library or implement custom clients
- **Testability**: Easy to mock HTTP interactions by providing a test implementation
- **Environment Agnostic**: Can run in any JavaScript environment by choosing appropriate implementation
- **Extensibility**: Custom implementations can add logging, retries, caching, etc.
- **Separation of Concerns**: Business logic is decoupled from HTTP implementation details

### Negative

- **Additional Abstraction**: Adds another layer of abstraction that developers need to understand
- **Maintenance Overhead**: Need to maintain multiple HTTP client implementations
- **Bundle Size**: Including multiple implementations increases the package size (though tree-shaking can help)
- **Type Complexity**: Generic types and interfaces add complexity to the type system
