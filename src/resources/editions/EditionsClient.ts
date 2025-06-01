import { BaseClient } from '../../core/BaseClient';
import type { ActivateGracePeriodRequest, SetLicenseRequest } from './types';

/**
 * Client for SonarQube Editions API
 *
 * Manage SonarSource commercial editions.
 *
 * **Note**: Only available in SonarQube (not SonarCloud) and requires
 * appropriate permissions for license management.
 *
 * @since SonarQube 7.2
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
 * // Activate grace period if server ID is invalid
 * await client.editions.activateGracePeriod();
 * ```
 */
export class EditionsClient extends BaseClient {
  /**
   * Enable a license 7-days grace period if the Server ID is invalid.
   *
   * This endpoint is typically used when the server ID has changed and
   * you need temporary access while resolving licensing issues.
   *
   * **Requires**: Administer System permission
   *
   * @param request - Empty request object (no parameters required)
   * @returns Promise that resolves when grace period is activated
   *
   * @since SonarQube 6.7
   *
   * @example
   * ```typescript
   * await client.editions.activateGracePeriod();
   * ```
   */
  async activateGracePeriod(_request: ActivateGracePeriodRequest = {}): Promise<undefined> {
    return this.request<undefined>('/api/editions/activate_grace_period', {
      method: 'POST',
    });
  }

  /**
   * Set the license for enabling features of commercial editions.
   *
   * This endpoint is used to install or update a SonarSource commercial
   * license to enable enterprise features.
   *
   * **Requires**: Administer System permission
   *
   * @param request - The license configuration request
   * @returns Promise that resolves when license is set
   *
   * @since SonarQube 7.2
   *
   * @example
   * ```typescript
   * await client.editions.setLicense({
   *   license: 'your-sonarqube-enterprise-license-key'
   * });
   * ```
   */
  async setLicense(request: SetLicenseRequest): Promise<undefined> {
    const formData = new URLSearchParams();
    formData.append('license', request.license);

    return this.request<undefined>('/api/editions/set_license', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  }
}
