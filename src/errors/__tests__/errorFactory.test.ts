import { createErrorFromResponse, createNetworkError } from '../errorFactory';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  SonarQubeError,
  TimeoutError,
} from '../SonarQubeError';

describe('createErrorFromResponse', () => {
  const createMockResponse = (
    status: number,
    statusText: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Response => {
    const headersMap = new Map(Object.entries(headers ?? {}));

    const response = {
      status,
      statusText,
      ok: status >= 200 && status < 300,
      headers: {
        get: (key: string) => headersMap.get(key) ?? null,
        entries: () => headersMap.entries(),
      },
      text: async () => (body !== undefined && body !== null ? JSON.stringify(body) : ''),
    } as unknown as Response;

    return response;
  };

  describe('Authentication errors', () => {
    it('should create AuthenticationError for 401 status', async () => {
      const response = createMockResponse(401, 'Unauthorized');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    it('should parse SonarQube error format for 401', async () => {
      const response = createMockResponse(
        401,
        'Unauthorized',
        { errors: [{ msg: 'Invalid token' }] },
        { 'content-type': 'application/json' }
      );
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('Authorization errors', () => {
    it('should create AuthorizationError for 403 status', async () => {
      const response = createMockResponse(403, 'Forbidden');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should parse multiple SonarQube errors', async () => {
      const response = createMockResponse(
        403,
        'Forbidden',
        {
          errors: [{ msg: 'Insufficient privileges' }, { msg: 'Admin access required' }],
        },
        { 'content-type': 'application/json' }
      );
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Insufficient privileges, Admin access required');
    });
  });

  describe('Not Found errors', () => {
    it('should create NotFoundError for 404 status', async () => {
      const response = createMockResponse(404, 'Not Found');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Not Found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('Rate Limit errors', () => {
    it('should create RateLimitError for 429 status', async () => {
      const response = createMockResponse(429, 'Too Many Requests');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Too Many Requests');
      expect(error.statusCode).toBe(429);
    });

    it('should parse Retry-After header', async () => {
      const response = createMockResponse(429, 'Too Many Requests', undefined, {
        'Retry-After': '60',
      });
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBe(60);
    });

    it('should handle invalid Retry-After header', async () => {
      const response = createMockResponse(429, 'Too Many Requests', undefined, {
        'Retry-After': 'invalid',
      });
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBeUndefined();
    });
  });

  describe('Server errors', () => {
    it('should create ServerError for 500 status', async () => {
      const response = createMockResponse(500, 'Internal Server Error');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Internal Server Error');
      expect(error.statusCode).toBe(500);
    });

    it('should create ServerError for 503 status', async () => {
      const response = createMockResponse(503, 'Service Unavailable');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Service Unavailable');
      expect(error.statusCode).toBe(503);
    });

    it('should include response headers in details', async () => {
      const response = createMockResponse(500, 'Internal Server Error', undefined, {
        'X-Request-Id': '123456',
      });
      const error = await createErrorFromResponse(response);

      expect(error.details).toEqual({
        headers: { 'X-Request-Id': '123456' },
      });
    });
  });

  describe('Client errors', () => {
    it('should create ApiError for 400 status', async () => {
      const response = createMockResponse(400, 'Bad Request');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Bad Request');
      expect(error.statusCode).toBe(400);
    });

    it('should create ApiError for 422 status', async () => {
      const response = createMockResponse(422, 'Unprocessable Entity');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Unprocessable Entity');
      expect(error.statusCode).toBe(422);
    });
  });

  describe('Unknown errors', () => {
    it('should create SonarQubeError for unexpected status codes', async () => {
      const response = createMockResponse(999, 'Unknown Status');
      const error = await createErrorFromResponse(response);

      expect(error).toBeInstanceOf(SonarQubeError);
      expect(error).not.toBeInstanceOf(ApiError);
      expect(error.message).toBe('Unknown Status');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.statusCode).toBe(999);
    });
  });

  describe('Error parsing', () => {
    it('should handle invalid JSON in response', async () => {
      const headersMap = new Map([['content-type', 'application/json']]);
      const response = {
        status: 400,
        statusText: 'Bad Request',
        ok: false,
        headers: {
          get: (key: string) => headersMap.get(key) ?? null,
          entries: () => headersMap.entries(),
        },
        text: async () => 'invalid json',
      } as unknown as Response;

      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Bad Request');
    });

    it('should handle empty response body', async () => {
      const response = createMockResponse(400, 'Bad Request', '', {
        'content-type': 'application/json',
      });
      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Bad Request');
    });

    it('should handle non-JSON content type', async () => {
      const response = createMockResponse(400, 'Bad Request', 'Plain text error', {
        'content-type': 'text/plain',
      });
      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('Bad Request');
    });

    it('should handle missing status text', async () => {
      const response = createMockResponse(400, '');
      const error = await createErrorFromResponse(response);

      expect(error.message).toBe('HTTP 400');
    });
  });
});

describe('createNetworkError', () => {
  it('should create NetworkError from Error instance', () => {
    const cause = new Error('Network failure');
    const error = createNetworkError(cause);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('Network failure');
    if (error instanceof NetworkError) {
      expect(error.cause).toBe(cause);
    }
  });

  it('should handle fetch errors', () => {
    const cause = new Error('Failed to fetch');
    const error = createNetworkError(cause);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('Network request failed');
    if (error instanceof NetworkError) {
      expect(error.cause).toBe(cause);
    }
  });

  it('should handle abort errors', () => {
    const cause = new Error('The operation was aborted');
    cause.name = 'AbortError';
    const error = createNetworkError(cause);

    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.message).toBe('Request was aborted');
  });

  it('should handle non-Error objects', () => {
    const error = createNetworkError('string error');

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('An unknown network error occurred');
    if (error instanceof NetworkError) {
      expect(error.cause).toBeUndefined();
    }
  });

  it('should handle null/undefined', () => {
    const error1 = createNetworkError(null);
    const error2 = createNetworkError(undefined);

    expect(error1).toBeInstanceOf(NetworkError);
    expect(error1.message).toBe('An unknown network error occurred');
    expect(error2).toBeInstanceOf(NetworkError);
    expect(error2.message).toBe('An unknown network error occurred');
  });
});
