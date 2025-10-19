/**
 * Base error class for all SonarQube API errors
 */
export class SonarQubeError extends Error {
  /**
   * Error code for categorizing the error type
   */
  public readonly code: string;

  /**
   * HTTP status code if applicable
   */
  public readonly statusCode: number | undefined;

  /**
   * Additional error details
   */
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when the API returns an error response
 */
export class ApiError extends SonarQubeError {
  constructor(message: string, statusCode: number, response?: unknown) {
    super(message, 'API_ERROR', statusCode, response);
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends SonarQubeError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      undefined,
      field !== undefined && field !== '' ? { field } : undefined,
    );
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends SonarQubeError {
  public readonly retryAfter: number | undefined;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends SonarQubeError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends SonarQubeError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * Error thrown when resource is not found
 */
export class NotFoundError extends SonarQubeError {
  constructor(message = 'Resource not found', resource?: string) {
    super(message, 'NOT_FOUND_ERROR', 404, { resource });
  }
}

/**
 * Error thrown when there's a network issue
 */
export class NetworkError extends SonarQubeError {
  public readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', undefined, { cause });
    this.cause = cause;
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends SonarQubeError {
  constructor(message = 'Request timed out', timeout?: number) {
    super(message, 'TIMEOUT_ERROR', undefined, { timeout });
  }
}

/**
 * Error thrown when server returns 5xx status
 */
export class ServerError extends SonarQubeError {
  constructor(message: string, statusCode: number, response?: unknown) {
    super(message, 'SERVER_ERROR', statusCode, response);
  }
}

/**
 * Error thrown when SonarQube is indexing issues and the operation is temporarily unavailable
 */
export class IndexingInProgressError extends SonarQubeError {
  constructor(message = 'Issue indexing in progress, please try again later') {
    super(message, 'INDEXING_IN_PROGRESS', 503);
  }
}
