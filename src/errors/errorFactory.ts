import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  IndexingInProgressError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  SonarQubeError,
  TimeoutError,
} from './SonarQubeError';

/**
 * SonarQube error response format
 */
interface SonarQubeErrorResponse {
  errors?: Array<{
    msg: string;
  }>;
}

/**
 * Parses the error response from SonarQube API
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json') === true) {
      const text = await response.text();
      if (text) {
        const errorData = JSON.parse(text) as SonarQubeErrorResponse;
        if (errorData.errors && errorData.errors.length > 0) {
          return errorData.errors.map((e) => e.msg).join(', ');
        }
      }
    }
  } catch {
    // If parsing fails, fall back to status text
  }

  return response.statusText && response.statusText !== ''
    ? response.statusText
    : `HTTP ${String(response.status)}`;
}

/**
 * Check if error message indicates indexing is in progress
 */
function isIndexingError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes('indexing in progress') ||
    lowerMessage.includes('issues index') ||
    lowerMessage.includes('index is not ready') ||
    (lowerMessage.includes('index') && lowerMessage.includes('progress'))
  );
}

/**
 * Parse Retry-After header value
 */
function parseRetryAfter(retryAfter: string | null): number | undefined {
  if (retryAfter === null || retryAfter === '') {
    return undefined;
  }
  const parsed = parseInt(retryAfter, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Create error with response headers
 */
function createErrorWithHeaders(
  errorClass: typeof ApiError | typeof ServerError | typeof SonarQubeError,
  errorMessage: string,
  status: number,
  headers: Headers,
): ApiError | ServerError | SonarQubeError {
  const headerObject = Object.fromEntries(headers.entries());
  if (errorClass === SonarQubeError) {
    return new SonarQubeError(errorMessage, 'UNKNOWN_ERROR', status, { headers: headerObject });
  }
  if (errorClass === ApiError) {
    return new ApiError(errorMessage, status, { headers: headerObject });
  }
  return new ServerError(errorMessage, status, { headers: headerObject });
}

/**
 * Creates appropriate error instance based on the response
 */
export async function createErrorFromResponse(response: Response): Promise<SonarQubeError> {
  const errorMessage = await parseErrorResponse(response);
  const { status } = response;

  // Handle specific status codes
  switch (status) {
    case 401:
      return new AuthenticationError(errorMessage);

    case 403:
      return new AuthorizationError(errorMessage);

    case 404:
      return new NotFoundError(errorMessage);

    case 429:
      return new RateLimitError(errorMessage, parseRetryAfter(response.headers.get('Retry-After')));

    case 503:
      if (isIndexingError(errorMessage)) {
        return new IndexingInProgressError(errorMessage);
      }
      return createErrorWithHeaders(ServerError, errorMessage, status, response.headers);

    default:
      // Server errors (5xx)
      if (status >= 500 && status < 600) {
        return createErrorWithHeaders(ServerError, errorMessage, status, response.headers);
      }

      // Other client errors (4xx)
      if (status >= 400 && status < 500) {
        return createErrorWithHeaders(ApiError, errorMessage, status, response.headers);
      }

      // Unexpected status codes
      return createErrorWithHeaders(SonarQubeError, errorMessage, status, response.headers);
  }
}

/**
 * Creates a NetworkError from a caught error
 */
export function createNetworkError(error: unknown): NetworkError | TimeoutError {
  if (error instanceof Error) {
    // Handle specific network error types
    if (error.message.includes('fetch')) {
      return new NetworkError('Network request failed', error);
    }
    if (error.name === 'AbortError') {
      return new TimeoutError('Request was aborted');
    }
    return new NetworkError(error.message, error);
  }

  return new NetworkError('An unknown network error occurred');
}
