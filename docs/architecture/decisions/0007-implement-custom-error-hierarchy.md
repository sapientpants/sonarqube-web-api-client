# 7. Implement custom error hierarchy

Date: 2025-05-25

## Status

Accepted

## Context

When interacting with the SonarQube API, various types of errors can occur:

- **API Errors**: 4xx/5xx responses with error messages from SonarQube
- **Validation Errors**: Invalid parameters or request format
- **Rate Limiting**: Too many requests (429 status)
- **Network Errors**: Connection timeouts, DNS failures, etc.
- **Authentication Errors**: Invalid or expired tokens

Without proper error structuring, generic errors would make it difficult to:

- Handle different error types appropriately
- Provide meaningful error messages to users
- Implement retry logic for transient failures
- Debug issues in production

We need to design structured error handling for different failure scenarios to improve developer experience and system reliability.

## Decision

We will implement a custom error hierarchy with a base `SonarQubeError` class and specific error types for different scenarios:

1. **Base error class** with common properties:
   ```typescript
   class SonarQubeError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode?: number,
       public details?: unknown
     ) {
       super(message);
       this.name = this.constructor.name;
     }
   }
   ```

2. **Specific error classes**:
   ```typescript
   class ApiError extends SonarQubeError {
     constructor(message: string, statusCode: number, response?: unknown) {
       super(message, 'API_ERROR', statusCode, response);
     }
   }
   
   class ValidationError extends SonarQubeError {
     constructor(message: string, field?: string) {
       super(message, 'VALIDATION_ERROR', undefined, { field });
     }
   }
   
   class RateLimitError extends SonarQubeError {
     constructor(message: string, retryAfter?: number) {
       super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
     }
   }
   
   class NetworkError extends SonarQubeError {
     constructor(message: string, cause?: Error) {
       super(message, 'NETWORK_ERROR', undefined, { cause });
     }
   }
   ```

3. **Error handling in the client**:
   ```typescript
   try {
     const result = await client.issues.search();
   } catch (error) {
     if (error instanceof RateLimitError) {
       // Wait and retry
     } else if (error instanceof ApiError && error.statusCode === 401) {
       // Re-authenticate
     } else if (error instanceof NetworkError) {
       // Check connection
     }
   }
   ```

## Consequences

### Positive

- **Better Error Handling**: Different error types can be handled with specific strategies
- **Improved Debugging**: Error types and details provide clear context for troubleshooting
- **Type Safety**: TypeScript can narrow error types in catch blocks
- **Retry Logic**: Specific errors (rate limits, network) can trigger automatic retries
- **User Experience**: More meaningful error messages can be shown to end users
- **Monitoring**: Error types can be tracked separately in monitoring systems

### Negative

- **More Classes to Maintain**: Each error type is a separate class that needs documentation and tests
- **Breaking Changes**: Existing error handling code may need updates
- **Bundle Size**: Additional error classes increase the library size slightly
- **Complexity**: Developers need to understand the error hierarchy
- **Over-engineering Risk**: Too many specific error types could complicate simple use cases
