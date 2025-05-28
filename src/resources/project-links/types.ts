/**
 * Project link information
 */
export interface ProjectLink {
  id: string;
  name: string;
  type: string;
  url: string;
}

/**
 * Request parameters for creating a project link
 */
export interface CreateProjectLinkRequest {
  /**
   * Link name
   * @maxLength 128
   */
  name: string;
  /**
   * Project id
   */
  projectId?: string;
  /**
   * Project key
   */
  projectKey?: string;
  /**
   * Link url
   * @maxLength 2048
   */
  url: string;
}

/**
 * Response from creating a project link
 */
export interface CreateProjectLinkResponse {
  link: ProjectLink;
}

/**
 * Request parameters for deleting a project link
 */
export interface DeleteProjectLinkRequest {
  /**
   * Link id
   */
  id: string;
}

/**
 * Request parameters for searching project links
 */
export interface SearchProjectLinksRequest {
  /**
   * Project Id
   */
  projectId?: string;
  /**
   * Project Key
   */
  projectKey?: string;
}

/**
 * Response from searching project links
 */
export interface SearchProjectLinksResponse {
  links: ProjectLink[];
}
