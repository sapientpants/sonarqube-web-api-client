/**
 * Views API module
 *
 * This module provides functionality for managing portfolios and application views
 * in SonarQube Enterprise Edition and above.
 *
 * **Note**: Portfolios are available in SonarQube Enterprise Edition and above.
 *
 * @since SonarQube 1.0
 * @module views
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Show portfolio details
 * const portfolio = await client.views.show({
 *   key: 'my-portfolio-key'
 * });
 *
 * // Add an application to a portfolio
 * await client.views.addApplication({
 *   application: 'my-app-key',
 *   portfolio: 'my-portfolio-key'
 * });
 *
 * // Update portfolio
 * await client.views.update({
 *   key: 'my-portfolio-key',
 *   name: 'Updated Name'
 * });
 * ```
 */

// Export the client
export { ViewsClient } from './ViewsClient';

// Export all types
export type {
  AddApplicationRequest,
  AddApplicationBranchRequest,
  ShowPortfolioRequest,
  ShowPortfolioResponse,
  UpdatePortfolioRequest,
  PortfolioComponent,
} from './types';
