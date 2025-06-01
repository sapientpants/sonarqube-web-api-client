import { BaseClient } from '../../core/BaseClient';
import type {
  AddApplicationRequest,
  AddApplicationResponse,
  AddApplicationBranchRequest,
  AddApplicationBranchResponse,
  ShowPortfolioRequest,
  ShowPortfolioResponse,
  UpdatePortfolioRequest,
  UpdatePortfolioResponse,
} from './types';

/**
 * Client for SonarQube Views API
 *
 * Provides portfolio and application view management functionality.
 *
 * **Note**: Portfolios are available in SonarQube Enterprise Edition and above.
 *
 * @since SonarQube 1.0
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
 * // Update portfolio information
 * await client.views.update({
 *   key: 'my-portfolio-key',
 *   name: 'Updated Portfolio Name',
 *   description: 'Updated description'
 * });
 * ```
 */
export class ViewsClient extends BaseClient {
  /**
   * Add an existing application to a portfolio.
   *
   * Requires 'Administrator' permission on the portfolio.
   *
   * @param request - The add application request
   * @returns Promise that resolves when application is added
   *
   * @since SonarQube 9.3
   *
   * @example
   * ```typescript
   * // Add an application to a portfolio
   * await client.views.addApplication({
   *   application: 'my-app-key',
   *   portfolio: 'my-portfolio-key'
   * });
   * ```
   */
  async addApplication(request: AddApplicationRequest): Promise<AddApplicationResponse> {
    const formData = new URLSearchParams();
    formData.append('application', request.application);
    formData.append('portfolio', request.portfolio);

    await this.request('/api/views/add_application', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      responseType: 'text',
    });

    return undefined;
  }

  /**
   * Add a branch of an application selected in a portfolio.
   *
   * Requires 'Administrator' permission on the portfolio and 'Browse' permission on the application.
   *
   * @param request - The add application branch request
   * @returns Promise that resolves when application branch is added
   *
   * @since SonarQube 9.3
   *
   * @example
   * ```typescript
   * // Add a specific branch of an application to a portfolio
   * await client.views.addApplicationBranch({
   *   application: 'my-app-key',
   *   branch: 'feature-branch',
   *   portfolio: 'my-portfolio-key'
   * });
   * ```
   */
  async addApplicationBranch(
    request: AddApplicationBranchRequest
  ): Promise<AddApplicationBranchResponse> {
    const formData = new URLSearchParams();
    formData.append('application', request.application);
    formData.append('branch', request.branch);
    formData.append('portfolio', request.portfolio);

    await this.request('/api/views/add_application_branch', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      responseType: 'text',
    });

    return undefined;
  }

  /**
   * Show the details of a portfolio, including its hierarchy and permissions.
   *
   * Authentication is required for this API endpoint.
   *
   * @param request - The show portfolio request
   * @returns Promise resolving to portfolio details
   *
   * @since SonarQube 1.0
   *
   * @example
   * ```typescript
   * // Get portfolio details and hierarchy
   * const portfolio = await client.views.show({
   *   key: 'my-portfolio-key'
   * });
   *
   * console.log('Portfolio:', portfolio.name);
   * console.log('Components:', portfolio.components?.length);
   * console.log('Sub-portfolios:', portfolio.subPortfolios?.length);
   * ```
   */
  async show(request: ShowPortfolioRequest): Promise<ShowPortfolioResponse> {
    const query = new URLSearchParams();
    query.append('key', request.key);

    return this.request<ShowPortfolioResponse>(`/api/views/show?${query.toString()}`);
  }

  /**
   * Update a portfolio.
   *
   * Requires 'Administrator' permission on the portfolio.
   *
   * @param request - The update portfolio request
   * @returns Promise that resolves when portfolio is updated
   *
   * @since SonarQube 1.0
   *
   * @example
   * ```typescript
   * // Update portfolio name and description
   * await client.views.update({
   *   key: 'my-portfolio-key',
   *   name: 'Updated Portfolio Name',
   *   description: 'Updated portfolio description'
   * });
   * ```
   */
  async update(request: UpdatePortfolioRequest): Promise<UpdatePortfolioResponse> {
    const formData = new URLSearchParams();
    formData.append('key', request.key);

    if (request.name !== undefined) {
      formData.append('name', request.name);
    }

    if (request.description !== undefined) {
      formData.append('description', request.description);
    }

    await this.request('/api/views/update', {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      responseType: 'text',
    });

    return undefined;
  }
}
