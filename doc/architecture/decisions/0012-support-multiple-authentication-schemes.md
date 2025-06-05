# 12. Support Multiple Authentication Schemes

Date: 2025-01-06

## Status

Accepted

## Context

SonarQube supports multiple authentication methods for API access:
- Bearer Token (most common)
- HTTP Basic Authentication (username/password)
- X-Sonar-Passcode header (for system passcode authentication)

Our client library initially only supported Bearer token authentication, hardcoded throughout the codebase. This limitation prevented users from utilizing alternative authentication methods that might be required in their environments.

## Decision

We have implemented an authentication provider pattern that allows flexible authentication schemes:

1. **AuthProvider Interface**: A simple interface that all authentication providers implement:
   ```typescript
   interface AuthProvider {
     applyAuth(headers: Headers): Headers;
     getAuthType(): 'bearer' | 'basic' | 'passcode';
   }
   ```

2. **Built-in Providers**:
   - `BearerTokenAuthProvider`: For Bearer token authentication
   - `BasicAuthProvider`: For HTTP Basic authentication (with proper UTF-8 encoding)
   - `PasscodeAuthProvider`: For X-Sonar-Passcode header authentication

3. **Factory Methods**: Static factory methods on `SonarQubeClient` for easy instantiation:
   - `SonarQubeClient.withToken(baseUrl, token, options?)`
   - `SonarQubeClient.withBasicAuth(baseUrl, username, password, options?)`
   - `SonarQubeClient.withPasscode(baseUrl, passcode, options?)`
   - `SonarQubeClient.withAuth(baseUrl, authProvider, options?)` for custom providers

4. **Breaking Change**: Since we're not concerned with backward compatibility (as specified by the user), the constructor now accepts an `AuthProvider` as the second parameter. For convenience, it still accepts a string token which is automatically converted to a `BearerTokenAuthProvider`.

## Consequences

### Positive

- **Flexibility**: Users can now use any authentication method supported by SonarQube
- **Extensibility**: Custom authentication providers can be implemented by users
- **Clean Architecture**: Authentication logic is properly encapsulated
- **Type Safety**: Each authentication method is strongly typed
- **Testability**: Authentication providers can be easily mocked for testing

### Negative

- **Breaking Change**: Existing code that instantiates clients directly will need to be updated
- **Increased Complexity**: The codebase now has additional interfaces and classes

### Neutral

- **Migration Path**: Users can easily migrate by using the appropriate factory method
- **Documentation**: Clear examples show how to use each authentication method

## Examples

```typescript
// Bearer Token
const client = SonarQubeClient.withToken('https://sonar.example.com', 'my-token');

// Basic Auth
const client = SonarQubeClient.withBasicAuth('https://sonar.example.com', 'admin', 'password');

// Passcode
const client = SonarQubeClient.withPasscode('https://sonar.example.com', 'system-passcode');

// Custom Provider (implementing as 'none' type since it's custom)
const customAuth: AuthProvider = {
  applyAuth(headers: Headers): Headers {
    headers.set('X-Custom-Auth', 'custom-value');
    return headers;
  },
  getAuthType(): 'none' {
    return 'none';
  }
};
const client = SonarQubeClient.withAuth('https://sonar.example.com', customAuth);
```

## Implementation Details

- All HTTP requests in `BaseClient` and `V2BaseClient` now use the `AuthProvider` to apply authentication
- The `AuthProvider` interface is minimal to allow maximum flexibility
- Built-in providers handle edge cases (empty credentials, UTF-8 encoding for Basic auth)
- Factory methods provide a clean API that guides users to the correct authentication method