# 8. Use MSW for testing HTTP interactions

Date: 2025-05-25

## Status

Accepted

## Context

Testing HTTP interactions in a client library presents several challenges:

- **Real API Dependency**: Testing against actual SonarQube instances is slow, requires setup, and may have rate limits
- **Mock Complexity**: Traditional mocking approaches (jest.mock) require mocking fetch or HTTP libraries directly
- **Response Fidelity**: Hand-written mocks may not accurately represent real API responses
- **Test Maintenance**: Changes to API interaction patterns require updating mocks in multiple places
- **Environment Differences**: Tests should work consistently in both Node.js and browser environments

We need a reliable way to test HTTP interactions without hitting real APIs while maintaining realistic behavior.

## Decision

We will use Mock Service Worker (MSW) for intercepting and mocking HTTP requests in tests. MSW provides:

1. **Request interception at the network level**:

   ```typescript
   import { setupServer } from 'msw/node';
   import { rest } from 'msw';

   const server = setupServer(
     rest.get('https://sonarqube.example.com/api/projects/search', (req, res, ctx) => {
       return res(
         ctx.status(200),
         ctx.json({
           components: [{ key: 'project1', name: 'Project 1' }],
           paging: { pageIndex: 1, pageSize: 100, total: 1 },
         }),
       );
     }),
   );
   ```

2. **Realistic request/response handling**:
   - Full access to request headers, body, and query parameters
   - Support for delays, errors, and conditional responses
   - Matches actual network behavior

3. **Test organization**:

   ```typescript
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());

   test('handles API errors', async () => {
     server.use(
       rest.get('*/api/issues/search', (req, res, ctx) => {
         return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
       }),
     );

     await expect(client.issues.search()).rejects.toThrow(ApiError);
   });
   ```

4. **Shared handlers** for common scenarios:
   - Authentication flows
   - Pagination sequences
   - Error conditions

## Consequences

### Positive

- **Realistic Testing**: Tests interact with actual network layer, catching integration issues
- **Environment Agnostic**: Same test code works in Node.js and browsers
- **No Implementation Details**: Tests don't depend on internal HTTP client implementation
- **Debugging Support**: MSW provides detailed logs of intercepted requests
- **Reusable Handlers**: Mock definitions can be shared across tests
- **Progressive Enhancement**: Can start with basic mocks and add complexity as needed

### Negative

- **Additional Test Dependency**: MSW is a development dependency that needs maintenance
- **Setup Complexity**: Initial setup requires understanding MSW patterns
- **Performance Overhead**: Network interception adds slight overhead to test execution
- **Learning Curve**: Developers need to learn MSW's API and patterns
- **Version Compatibility**: Need to ensure MSW versions work with Node.js and test runner versions
