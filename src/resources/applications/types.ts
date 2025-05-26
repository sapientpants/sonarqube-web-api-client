/**
 * Applications API types
 */

/**
 * Application visibility
 */
export type ApplicationVisibility = 'public' | 'private';

/**
 * Application branch
 */
export interface ApplicationBranch {
  name: string;
  isMain: boolean;
  projects: ApplicationProject[];
}

/**
 * Project within an application
 */
export interface ApplicationProject {
  key: string;
  name: string;
  branch?: string;
  enabled: boolean;
}

/**
 * Application details
 */
export interface Application {
  key: string;
  name: string;
  description?: string;
  visibility: ApplicationVisibility;
  branches?: ApplicationBranch[];
  projects?: ApplicationProject[];
  tags?: string[];
}

/**
 * Request to add a project to an application
 * @since 7.3
 */
export interface AddProjectRequest {
  application: string;
  project: string;
}

/**
 * Request to create a new application
 * @since 7.3
 */
export interface CreateApplicationRequest {
  key: string;
  name: string;
  description?: string;
  visibility?: ApplicationVisibility;
}

/**
 * Response from creating an application
 * @since 7.3
 */
export interface CreateApplicationResponse {
  application: Application;
}

/**
 * Request to create a branch on an application
 * @since 7.3
 */
export interface CreateBranchRequest {
  application: string;
  branch: string;
  project: string;
  projectBranch: string;
}

/**
 * Request to delete an application
 * @since 7.3
 */
export interface DeleteApplicationRequest {
  application: string;
}

/**
 * Request to delete a branch from an application
 * @since 7.3
 */
export interface DeleteBranchRequest {
  application: string;
  branch: string;
}

/**
 * Request to remove a project from an application
 * @since 7.3
 */
export interface RemoveProjectRequest {
  application: string;
  project: string;
}

/**
 * Request to set tags on an application
 * @since 8.3
 */
export interface SetTagsRequest {
  application: string;
  tags: string;
}

/**
 * Request to show application details
 * @since 7.3
 */
export interface ShowApplicationRequest {
  application: string;
  branch?: string;
}

/**
 * Response from showing application details
 * @since 7.3
 */
export interface ShowApplicationResponse {
  application: Application;
}

/**
 * Request to update an application
 * @since 7.3
 */
export interface UpdateApplicationRequest {
  application: string;
  name: string;
  description?: string;
}

/**
 * Request to update a branch on an application
 * @since 7.3
 */
export interface UpdateBranchRequest {
  application: string;
  branch: string;
  name: string;
  project: string;
  projectBranch: string;
}
