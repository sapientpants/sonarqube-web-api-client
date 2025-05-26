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
  ValidationError,
} from '../SonarQubeError';

describe('SonarQubeError', () => {
  it('should create base error with all properties', () => {
    const error = new SonarQubeError('Test error', 'TEST_ERROR', 500, { foo: 'bar' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SonarQubeError);
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('SonarQubeError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.stack).toBeDefined();
  });

  it('should create error without optional properties', () => {
    const error = new SonarQubeError('Test error', 'TEST_ERROR');

    expect(error.statusCode).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

describe('ApiError', () => {
  it('should create API error', () => {
    const error = new ApiError('Bad request', 400, { error: 'Invalid parameter' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(SonarQubeError);
    expect(error.message).toBe('Bad request');
    expect(error.name).toBe('ApiError');
    expect(error.code).toBe('API_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ error: 'Invalid parameter' });
  });
});

describe('ValidationError', () => {
  it('should create validation error with field', () => {
    const error = new ValidationError('Invalid value', 'username');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid value');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBeUndefined();
    expect(error.details).toEqual({ field: 'username' });
  });

  it('should create validation error without field', () => {
    const error = new ValidationError('Invalid request');

    expect(error.details).toBeUndefined();
  });
});

describe('RateLimitError', () => {
  it('should create rate limit error with retry after', () => {
    const error = new RateLimitError('Too many requests', 60);

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe('Too many requests');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.details).toEqual({ retryAfter: 60 });
  });

  it('should create rate limit error without retry after', () => {
    const error = new RateLimitError('Too many requests');

    expect(error.retryAfter).toBeUndefined();
  });
});

describe('AuthenticationError', () => {
  it('should create authentication error with custom message', () => {
    const error = new AuthenticationError('Invalid token');

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Invalid token');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('should create authentication error with default message', () => {
    const error = new AuthenticationError();

    expect(error.message).toBe('Authentication failed');
  });
});

describe('AuthorizationError', () => {
  it('should create authorization error with custom message', () => {
    const error = new AuthorizationError('Admin access required');

    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.message).toBe('Admin access required');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(403);
  });

  it('should create authorization error with default message', () => {
    const error = new AuthorizationError();

    expect(error.message).toBe('Insufficient permissions');
  });
});

describe('NotFoundError', () => {
  it('should create not found error with resource', () => {
    const error = new NotFoundError('Project not found', 'project');

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Project not found');
    expect(error.code).toBe('NOT_FOUND_ERROR');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ resource: 'project' });
  });

  it('should create not found error with default message', () => {
    const error = new NotFoundError();

    expect(error.message).toBe('Resource not found');
  });
});

describe('NetworkError', () => {
  it('should create network error with cause', () => {
    const cause = new Error('Connection refused');
    const error = new NetworkError('Failed to connect', cause);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('Failed to connect');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.statusCode).toBeUndefined();
    expect(error.cause).toBe(cause);
    expect(error.details).toEqual({ cause });
  });

  it('should create network error without cause', () => {
    const error = new NetworkError('Network unavailable');

    expect(error.cause).toBeUndefined();
  });
});

describe('TimeoutError', () => {
  it('should create timeout error with timeout value', () => {
    const error = new TimeoutError('Request timed out', 30000);

    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.message).toBe('Request timed out');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.details).toEqual({ timeout: 30000 });
  });

  it('should create timeout error with default message', () => {
    const error = new TimeoutError();

    expect(error.message).toBe('Request timed out');
  });
});

describe('ServerError', () => {
  it('should create server error', () => {
    const error = new ServerError('Internal server error', 500, {
      timestamp: '2023-01-01T00:00:00Z',
    });

    expect(error).toBeInstanceOf(ServerError);
    expect(error.message).toBe('Internal server error');
    expect(error.code).toBe('SERVER_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ timestamp: '2023-01-01T00:00:00Z' });
  });
});

describe('Error inheritance', () => {
  it('should properly handle instanceof checks', () => {
    const apiError = new ApiError('API error', 400);
    const authError = new AuthenticationError();

    expect(apiError instanceof Error).toBe(true);
    expect(apiError instanceof SonarQubeError).toBe(true);
    expect(apiError instanceof ApiError).toBe(true);
    expect(apiError instanceof AuthenticationError).toBe(false);

    expect(authError instanceof Error).toBe(true);
    expect(authError instanceof SonarQubeError).toBe(true);
    expect(authError instanceof AuthenticationError).toBe(true);
    expect(authError instanceof ApiError).toBe(false);
  });
});
