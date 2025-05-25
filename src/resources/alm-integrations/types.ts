/**
 * ALM (Application Lifecycle Management) integration types
 */

/**
 * Supported ALM providers
 */
export enum AlmProvider {
  Azure = 'azure',
  BitbucketServer = 'bitbucketserver',
  BitbucketCloud = 'bitbucketcloud',
  GitHub = 'github',
  GitLab = 'gitlab',
}

/**
 * Base interface for ALM settings
 */
export interface AlmSetting {
  key: string;
  almProvider?: AlmProvider;
}

/**
 * Personal Access Token configuration
 */
export interface SetPatRequest {
  almSetting: string;
  pat: string;
  username?: string; // Required for Bitbucket Cloud
}

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  p?: number; // Page number
  ps?: number; // Page size
}

/**
 * Common search parameters
 */
export interface SearchParams extends PaginationParams {
  almSetting: string;
}

/**
 * Azure-specific types
 */
export interface AzureProject {
  name: string;
  key: string;
  description?: string;
}

export interface AzureRepository {
  name: string;
  id: string;
  project: string;
  url?: string;
}

export type ListAzureProjectsRequest = SearchParams;

export interface ListAzureProjectsResponse {
  projects: AzureProject[];
  paging: Paging;
}

export interface SearchAzureReposRequest extends SearchParams {
  projectName: string;
  searchQuery?: string;
}

export interface SearchAzureReposResponse {
  repositories: AzureRepository[];
  paging: Paging;
}

/**
 * Bitbucket Server-specific types
 */
export interface BitbucketServerProject {
  key: string;
  name: string;
  id: number;
}

export interface BitbucketServerRepository {
  id: number;
  name: string;
  slug: string;
  projectKey: string;
  sqProjectKey?: string;
  links?: {
    clone?: Array<{
      href: string;
      name: string;
    }>;
  };
}

export type ListBitbucketServerProjectsRequest = SearchParams;

export interface ListBitbucketServerProjectsResponse {
  projects: BitbucketServerProject[];
  isLastPage: boolean;
}

export interface SearchBitbucketServerReposRequest extends SearchParams {
  projectKey: string;
  repositoryName?: string;
}

export interface SearchBitbucketServerReposResponse {
  repositories: BitbucketServerRepository[];
  isLastPage: boolean;
}

/**
 * Bitbucket Cloud-specific types
 */
export interface BitbucketCloudRepository {
  uuid: string;
  name: string;
  slug: string;
  projectKey: string;
  workspace: string;
  sqProjectKey?: string;
}

export interface SearchBitbucketCloudReposRequest extends SearchParams {
  workspaceId: string;
  repositoryName?: string;
}

export interface SearchBitbucketCloudReposResponse {
  repositories: BitbucketCloudRepository[];
  paging: Paging;
}

/**
 * GitLab-specific types
 */
export interface GitLabProject {
  id: string;
  name: string;
  pathName: string;
  pathSlug: string;
  sqProjectKey?: string;
  url?: string;
}

export interface SearchGitLabReposRequest extends SearchParams {
  projectName?: string;
  minAccessLevel?: number;
}

export interface SearchGitLabReposResponse {
  projects: GitLabProject[];
  paging: Paging;
}

/**
 * Common response types
 */
export interface Paging {
  pageIndex: number;
  pageSize: number;
  total: number;
}

/**
 * Import project requests (for future implementation)
 */
export interface ImportProjectRequest {
  almSetting: string;
}

export interface ImportAzureProjectRequest extends ImportProjectRequest {
  projectName: string;
  repositoryName: string;
}

export interface ImportBitbucketServerProjectRequest extends ImportProjectRequest {
  projectKey: string;
  repositorySlug: string;
}

export interface ImportBitbucketCloudProjectRequest extends ImportProjectRequest {
  workspaceId: string;
  repositorySlug: string;
}

export interface ImportGitHubProjectRequest extends ImportProjectRequest {
  repositoryKey: string;
  organization?: string;
}

export interface ImportGitLabProjectRequest extends ImportProjectRequest {
  gitlabProjectId: string;
}

/**
 * Import response
 */
export interface ImportProjectResponse {
  project: {
    key: string;
    name: string;
  };
}
