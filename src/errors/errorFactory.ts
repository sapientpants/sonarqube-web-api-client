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

    case 429: {
      // Try to parse Retry-After header
      const retryAfter = response.headers.get('Retry-After');
      let retrySeconds: number | undefined;
      if (retryAfter !== null && retryAfter !== '') {
        const parsed = parseInt(retryAfter, 10);
        retrySeconds = isNaN(parsed) ? undefined : parsed;
      }
      return new RateLimitError(errorMessage, retrySeconds);
    }

    default:
      // Server errors (5xx)
      if (status >= 500 && status < 600) {
        return new ServerError(errorMessage, status, {
          headers: Object.fromEntries(response.headers.entries()),
        });
      }

      // Other client errors (4xx)
      if (status >= 400 && status < 500) {
        return new ApiError(errorMessage, status, {
          headers: Object.fromEntries(response.headers.entries()),
        });
      }

      // Unexpected status codes
      return new SonarQubeError(errorMessage, 'UNKNOWN_ERROR', status, {
        headers: Object.fromEntries(response.headers.entries()),
      });
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
