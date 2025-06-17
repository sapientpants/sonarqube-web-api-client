# 4. Use interceptor chain pattern for cross-cutting concerns

Date: 2025-05-25

## Status

Accepted

## Context

When building a SonarQube API client, we'll need to handle several cross-cutting concerns that apply across multiple API calls:

- **Authentication**: Adding auth tokens/headers to every request
- **Logging**: Recording request/response details for debugging
- **Retry Logic**: Automatically retrying failed requests with exponential backoff
- **Rate Limiting**: Respecting API rate limits and throttling requests
- **Request/Response Transformation**: Converting data formats, adding metadata
- **Metrics Collection**: Tracking API performance, success rates, and latency

Without a proper abstraction, these concerns would need to be implemented directly in each API method or in the base request method, which would lead to:
- Tight coupling between business logic and infrastructure concerns
- Difficulty in enabling/disabling features per request
- Code duplication across different API endpoints
- Hard-to-test logic mixed with HTTP handling

## Decision

We will implement an interceptor chain pattern that allows middleware-like functions to process requests and responses. This pattern provides a pluggable architecture where interceptors can be registered, ordered, and executed in sequence.

### Core Design

```typescript
// Interceptor interface
interface Interceptor {
  name: string;
  order?: number; // Lower numbers execute first
  
  // Called before request is sent
  onRequest?: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
  
  // Called after response is received
  onResponse?: (response: Response) => Promise<Response> | Response;
  
  // Called when request fails
  onError?: (error: Error) => Promise<Error> | Error;
}

// Request configuration
interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  metadata?: Record<string, any>; // For passing data between interceptors
}
```

### Example Implementation

```typescript
class SonarQubeClient {
  private interceptors: Interceptor[] = [];
  
  // Register an interceptor
  use(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
    // Sort by order (lower numbers first)
    this.interceptors.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }
  
  // Remove an interceptor by name
  eject(name: string): void {
    this.interceptors = this.interceptors.filter(i => i.name !== name);
  }
  
  private async executeRequest(config: RequestConfig): Promise<Response> {
    // Apply request interceptors
    let processedConfig = config;
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        processedConfig = await interceptor.onRequest(processedConfig);
      }
    }
    
    try {
      // Make the actual HTTP request
      const response = await fetch(processedConfig.url, {
        method: processedConfig.method,
        headers: processedConfig.headers,
        body: processedConfig.body
      });
      
      // Apply response interceptors in reverse order
      let processedResponse = response;
      for (let i = this.interceptors.length - 1; i >= 0; i--) {
        const interceptor = this.interceptors[i];
        if (interceptor.onResponse) {
          processedResponse = await interceptor.onResponse(processedResponse);
        }
      }
      
      return processedResponse;
    } catch (error) {
      // Apply error interceptors
      let processedError = error;
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          processedError = await interceptor.onError(processedError as Error);
        }
      }
      throw processedError;
    }
  }
}
```

### Example Interceptors

```typescript
// Authentication interceptor
const authInterceptor: Interceptor = {
  name: 'auth',
  order: 10,
  onRequest: (config) => {
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }
    return config;
  }
};

// Logging interceptor
const loggingInterceptor: Interceptor = {
  name: 'logging',
  order: 20,
  onRequest: (config) => {
    console.log(`[API] ${config.method} ${config.url}`);
    config.metadata = { ...config.metadata, startTime: Date.now() };
    return config;
  },
  onResponse: (response) => {
    const duration = Date.now() - (response.metadata?.startTime || 0);
    console.log(`[API] Response ${response.status} (${duration}ms)`);
    return response;
  },
  onError: (error) => {
    console.error('[API] Request failed:', error.message);
    return error;
  }
};

// Retry interceptor
const retryInterceptor: Interceptor = {
  name: 'retry',
  order: 30,
  onError: async (error) => {
    const config = error.config;
    const retryCount = config.metadata?.retryCount || 0;
    
    if (retryCount < 3 && isRetriableError(error)) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      config.metadata = { ...config.metadata, retryCount: retryCount + 1 };
      return this.executeRequest(config); // Retry the request
    }
    
    return error;
  }
};

// Usage
const client = new SonarQubeClient();
client.use(authInterceptor);
client.use(loggingInterceptor);
client.use(retryInterceptor);

// Disable logging for specific requests
client.eject('logging');
```

## Consequences

### Positive

- **Separation of Concerns**: Business logic is separated from infrastructure concerns
- **Reusable Logic**: Interceptors can be shared across different API clients
- **Easy to Add/Remove Features**: Interceptors can be dynamically registered or removed
- **Testable in Isolation**: Each interceptor can be unit tested independently
- **Flexible Ordering**: Interceptor execution order can be controlled via the order property
- **Non-invasive**: Existing code doesn't need to change to add new cross-cutting features
- **Composable**: Multiple interceptors can work together (e.g., auth + retry + logging)

### Negative

- **Additional Abstraction Layer**: Adds complexity to the request flow
- **Potential Performance Overhead**: Each interceptor adds processing time
- **Debugging Complexity**: Stack traces may be harder to follow through the interceptor chain
- **Order Dependencies**: Some interceptors may depend on specific ordering
- **Error Handling Complexity**: Errors in interceptors need careful handling

### Mitigation Strategies

1. **Good Logging**: Provide detailed logging options to trace request flow through interceptors
2. **Bypass Mechanism**: Allow specific requests to bypass certain interceptors:
   ```typescript
   client.request(url, { 
     skipInterceptors: ['logging', 'retry'] 
   });
   ```
3. **Documentation**: Clearly document interceptor ordering requirements and dependencies
4. **Performance Monitoring**: Add metrics to track interceptor overhead
5. **Error Boundaries**: Wrap interceptor execution in try-catch to prevent one interceptor from breaking the chain
6. **Type Safety**: Use TypeScript to ensure interceptors conform to the expected interface
