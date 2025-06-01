/**
 * Editions API module
 *
 * This module provides functionality for managing SonarSource commercial editions.
 *
 * **Note**: Only available in SonarQube (not SonarCloud) and requires
 * appropriate system administration permissions.
 *
 * @since SonarQube 7.2
 * @module editions
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Set license for commercial edition
 * await client.editions.setLicense({
 *   license: 'your-license-key'
 * });
 *
 * // Activate grace period if needed
 * await client.editions.activateGracePeriod();
 * ```
 */

// Export the client
export { EditionsClient } from './EditionsClient';

// Export all types
export type {
  ActivateGracePeriodRequest,
  ActivateGracePeriodResponse,
  SetLicenseRequest,
  SetLicenseResponse,
} from './types';
