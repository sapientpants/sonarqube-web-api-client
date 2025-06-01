/**
 * Types for SonarQube Editions API
 *
 * Manage SonarSource commercial editions
 *
 * @since SonarQube 7.2
 */

/**
 * Request to activate a 7-day grace period
 */
export type ActivateGracePeriodRequest = Record<string, never>;

/**
 * Request to set license for commercial editions
 */
export interface SetLicenseRequest {
  /**
   * The license string/key for the commercial edition
   */
  license: string;
}
