import type { AuthProvider } from './AuthProvider';

/**
 * No authentication provider - for public API access
 */
export class NoAuthProvider implements AuthProvider {
  applyAuth(headers: Headers): Headers {
    // No authentication headers to apply
    return headers;
  }

  getAuthType(): 'none' {
    return 'none';
  }
}
