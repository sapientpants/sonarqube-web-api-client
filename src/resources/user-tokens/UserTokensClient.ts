import { BaseClient } from '../../core/BaseClient';
import type {
  GenerateTokenRequest,
  GenerateTokenResponse,
  RevokeTokenRequest,
  SearchTokensRequest,
  SearchTokensResponse,
} from './types';

/**
 * Client for managing user access tokens
 */
export class UserTokensClient extends BaseClient {
  /**
   * Generate a user access token
   *
   * Please keep your tokens secret. They enable to authenticate and analyze projects.
   * The endpoint generates a token for the logged in user.
   *
   * @param params Token generation parameters
   * @returns The generated token details
   *
   * @example
   * ```typescript
   * const client = new UserTokensClient(baseUrl, token);
   * const result = await client.generate({
   *   name: 'Project scan on Travis'
   * });
   * console.log(result.token); // The generated token value
   * ```
   */
  async generate(params: GenerateTokenRequest): Promise<GenerateTokenResponse> {
    const body = new URLSearchParams();
    body.append('name', params.name);
    if (params.login !== undefined && params.login.length > 0) {
      body.append('login', params.login);
    }

    return this.request<GenerateTokenResponse>('/api/user_tokens/generate', {
      method: 'POST',
      body: body.toString(),
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Revoke a user access token
   *
   * It requires administration permissions to specify a 'login' and revoke a token for another user.
   * Otherwise, the token for the current user is revoked.
   *
   * @param params Token revocation parameters
   * @returns Nothing
   *
   * @example
   * ```typescript
   * const client = new UserTokensClient(baseUrl, token);
   * await client.revoke({
   *   name: 'Project scan on Travis'
   * });
   * // Token is now revoked
   * ```
   */
  async revoke(params: RevokeTokenRequest): Promise<void> {
    const body = new URLSearchParams();
    body.append('name', params.name);
    if (params.login !== undefined && params.login.length > 0) {
      body.append('login', params.login);
    }

    await this.request('/api/user_tokens/revoke', {
      method: 'POST',
      body: body.toString(),
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * List the access tokens of a user
   *
   * The login must exist and active.
   * Field 'lastConnectionDate' is only updated every hour, so it may not be accurate.
   * It requires administration permissions to specify a 'login' and list the tokens of another user.
   * Otherwise, tokens for the current user are listed.
   *
   * @param params Search parameters
   * @returns List of user tokens
   *
   * @example
   * ```typescript
   * const client = new UserTokensClient(baseUrl, token);
   * const result = await client.search();
   * console.log(result.userTokens); // Array of tokens for current user
   * ```
   */
  async search(params?: SearchTokensRequest): Promise<SearchTokensResponse> {
    const searchParams = new URLSearchParams();
    if (params?.login !== undefined && params.login.length > 0) {
      searchParams.append('login', params.login);
    }

    const queryString = searchParams.toString();
    const url =
      queryString.length > 0 ? `/api/user_tokens/search?${queryString}` : '/api/user_tokens/search';

    return this.request<SearchTokensResponse>(url);
  }
}
