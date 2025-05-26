import { PaginatedBuilder, validateRequired } from '../../core/builders';
import type {
  SearchAzureReposRequest,
  SearchAzureReposResponse,
  AzureRepository,
  SearchBitbucketServerReposRequest,
  SearchBitbucketServerReposResponse,
  BitbucketServerRepository,
  SearchBitbucketCloudReposRequest,
  SearchBitbucketCloudReposResponse,
  BitbucketCloudRepository,
  SearchGitLabReposRequest,
  SearchGitLabReposResponse,
  GitLabProject,
} from './types';

/**
 * Builder for searching Azure repositories
 */
export class AzureReposSearchBuilder extends PaginatedBuilder<
  SearchAzureReposRequest,
  SearchAzureReposResponse,
  AzureRepository
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting', almSetting);
  }

  /**
   * Set the Azure project name (required)
   */
  inProject(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the search query to filter repositories
   */
  withQuery(searchQuery: string): this {
    return this.setParam('searchQuery', searchQuery);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchAzureReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    validateRequired(this.params.projectName, 'Project name');

    return this.executor(this.params as SearchAzureReposRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchAzureReposResponse): AzureRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching Bitbucket Server repositories
 */
export class BitbucketServerReposSearchBuilder extends PaginatedBuilder<
  SearchBitbucketServerReposRequest,
  SearchBitbucketServerReposResponse,
  BitbucketServerRepository
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting', almSetting);
  }

  /**
   * Set the Bitbucket project key (required)
   */
  inProject(projectKey: string): this {
    return this.setParam('projectKey', projectKey);
  }

  /**
   * Set the repository name to filter
   */
  withRepositoryName(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketServerReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    validateRequired(this.params.projectKey, 'Project key');

    return this.executor(this.params as SearchBitbucketServerReposRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchBitbucketServerReposResponse): BitbucketServerRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching Bitbucket Cloud repositories
 */
export class BitbucketCloudReposSearchBuilder extends PaginatedBuilder<
  SearchBitbucketCloudReposRequest,
  SearchBitbucketCloudReposResponse,
  BitbucketCloudRepository
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting', almSetting);
  }

  /**
   * Set the Bitbucket workspace ID (required)
   */
  inWorkspace(workspaceId: string): this {
    return this.setParam('workspaceId', workspaceId);
  }

  /**
   * Set the repository name to filter
   */
  withRepositoryName(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketCloudReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    validateRequired(this.params.workspaceId, 'Workspace ID');

    return this.executor(this.params as SearchBitbucketCloudReposRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchBitbucketCloudReposResponse): BitbucketCloudRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching GitLab projects
 */
export class GitLabReposSearchBuilder extends PaginatedBuilder<
  SearchGitLabReposRequest,
  SearchGitLabReposResponse,
  GitLabProject
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    return this.setParam('almSetting', almSetting);
  }

  /**
   * Set the project name to search for
   */
  withProjectName(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the minimum access level (GitLab permission level)
   * 10 = Guest, 20 = Reporter, 30 = Developer, 40 = Maintainer, 50 = Owner
   */
  withMinAccessLevel(minAccessLevel: number): this {
    return this.setParam('minAccessLevel', minAccessLevel);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchGitLabReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');

    return this.executor(this.params as SearchGitLabReposRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: SearchGitLabReposResponse): GitLabProject[] {
    return response.projects;
  }
}
