import { BaseClient } from '../../core/BaseClient';
import type { ValidateResponse, LogoutResponse } from './types';

/**
 * Client for handling authentication operations
 */
export class AuthenticationClient extends BaseClient {
  /**
   * Check credentials
   *
   * Returns true for anonymous users.
   *
   * @returns Authentication validation status
   *
   * @example
   * ```typescript
   * const client = new AuthenticationClient(baseUrl, token);
   * const result = await client.validate();
   * console.log(result.valid); // true if authenticated, false otherwise
   * ```
   */
  async validate(): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('/api/authentication/validate');
  }

  /**
   * Logout a user
   *
   * This endpoint logs out the current user and invalidates their session.
   * Requires authentication.
   *
   * @returns No content
   *
   * @example
   * ```typescript
   * const client = new AuthenticationClient(baseUrl, token);
   * await client.logout();
   * // User is now logged out
   * ```
   */
  async logout(): Promise<LogoutResponse> {
    return this.request('/api/authentication/logout', {
      method: 'POST',
    });
  }
}
