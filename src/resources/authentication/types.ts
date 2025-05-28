/**
 * Response from the validate endpoint
 * Indicates whether the user's authentication is valid
 */
export interface ValidateResponse {
  /**
   * Whether the user's authentication is valid
   * Returns true for anonymous users
   */
  valid: boolean;
}

/**
 * Response from the logout endpoint
 * The logout endpoint returns no content
 */
export type LogoutResponse = undefined;
