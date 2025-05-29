/**
 * Request parameters for the response_example endpoint
 */
export interface ResponseExampleRequest {
  /**
   * Controller of the web service (e.g., "api/issues")
   */
  controller: string;

  /**
   * Action of the web service (e.g., "search")
   */
  action: string;
}

/**
 * Web service action definition
 */
export interface WebServiceAction {
  /**
   * Additional properties
   */
  [key: string]: unknown;

  /**
   * Action key/name
   */
  key?: string;

  /**
   * Description of the action
   */
  description?: string;

  /**
   * Whether the action is internal
   */
  internal?: boolean;

  /**
   * Whether the action uses POST method
   */
  post?: boolean;

  /**
   * Whether the action has a response example
   */
  hasResponseExample?: boolean;

  /**
   * Changelog entries for the action
   */
  changelog?: Array<{
    version?: string;
    description?: string;
  }>;

  /**
   * Parameters accepted by the action
   */
  params?: Array<{
    key?: string;
    description?: string;
    required?: boolean;
    internal?: boolean;
    exampleValue?: string;
  }>;
}

/**
 * Web service definition
 */
export interface WebService {
  /**
   * Additional properties
   */
  [key: string]: unknown;

  /**
   * API path (e.g., "api/webservices")
   */
  path?: string;

  /**
   * Description of the web service
   */
  description?: string;

  /**
   * Available actions for this web service
   */
  actions?: WebServiceAction[];
}

/**
 * Response from the list endpoint
 */
export interface ListWebservicesResponse {
  /**
   * Additional properties
   */
  [key: string]: unknown;

  /**
   * List of available web services
   */
  webServices?: WebService[];
}

/**
 * Response from the response_example endpoint
 * The content varies based on the requested controller and action
 */
export type ResponseExampleResponse = Record<string, unknown>;
