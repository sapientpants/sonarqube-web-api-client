import type { AuthProvider } from './AuthProvider.js';

/**
 * Bearer token authentication provider
 */
export class BearerTokenAuthProvider implements AuthProvider {
  constructor(private readonly token: string) {
    if (!token) {
      throw new Error('Token is required for Bearer authentication');
    }
  }

  applyAuth(headers: Headers): Headers {
    headers.set('Authorization', `Bearer ${this.token}`);
    return headers;
  }

  getAuthType(): 'bearer' {
    return 'bearer';
  }
}
