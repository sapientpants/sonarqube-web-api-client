/**
 * Types for SonarQube Views API
 *
 * Manage portfolios and application views.
 *
 * @since SonarQube 1.0
 */

/**
 * Request to add an existing application to a portfolio
 */
export interface AddApplicationRequest {
  /**
   * Application key to add to the portfolio
   */
  application: string;

  /**
   * Portfolio key
   */
  portfolio: string;
}

/**
 * Request to add a branch of an application selected in a portfolio
 */
export interface AddApplicationBranchRequest {
  /**
   * Application key
   */
  application: string;

  /**
   * Branch name
   */
  branch: string;

  /**
   * Portfolio key
   */
  portfolio: string;
}

/**
 * Request to show portfolio details
 */
export interface ShowPortfolioRequest {
  /**
   * Portfolio key
   */
  key: string;
}

/**
 * Portfolio component details
 */
export interface PortfolioComponent {
  /**
   * Component key
   */
  key: string;

  /**
   * Component name
   */
  name: string;

  /**
   * Component qualifier (TRK for projects, APP for applications, VW for portfolios)
   */
  qualifier: string;

  /**
   * Component description
   */
  description?: string;

  /**
   * Component path in the portfolio hierarchy
   */
  path?: string;
}

/**
 * Portfolio details response
 */
export interface ShowPortfolioResponse {
  /**
   * Portfolio key
   */
  key: string;

  /**
   * Portfolio name
   */
  name: string;

  /**
   * Portfolio description
   */
  description?: string;

  /**
   * Portfolio qualifier
   */
  qualifier: string;

  /**
   * Portfolio visibility (public or private)
   */
  visibility: 'public' | 'private';

  /**
   * List of components in the portfolio
   */
  components?: PortfolioComponent[];

  /**
   * Sub-portfolios
   */
  subPortfolios?: PortfolioComponent[];
}

/**
 * Request to update a portfolio
 */
export interface UpdatePortfolioRequest {
  /**
   * Portfolio key
   */
  key: string;

  /**
   * New portfolio name
   */
  name?: string;

  /**
   * New portfolio description
   */
  description?: string;
}
