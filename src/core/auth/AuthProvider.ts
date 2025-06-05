/**
 * Authentication provider interface for SonarQube API
 */
export interface AuthProvider {
  /**
   * Apply authentication to request headers
   * @param headers - Existing headers object
   * @returns Headers object with authentication applied
   */
  applyAuth: (headers: Headers) => Headers;

  /**
   * Get the type of authentication
   */
  getAuthType: () => 'bearer' | 'basic' | 'passcode' | 'none';
}
