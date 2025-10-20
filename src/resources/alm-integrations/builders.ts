import { RepositorySearchBuilder, validateRequired } from '../../core/builders/index.js';
import { DeprecationManager } from '../../core/deprecation/index.js';
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
} from './types.js';

/**
 * Builder for searching Azure repositories
 */
export class AzureReposSearchBuilder extends RepositorySearchBuilder<
  SearchAzureReposRequest,
  SearchAzureReposResponse,
  AzureRepository
> {
  /**
   * Set the Azure project name (required)
   * @override Uses projectName instead of projectKey
   */
  override inProject(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the search query to filter repositories
   * @override Maps to searchQuery parameter
   */
  override withQuery(searchQuery: string): this {
    return this.setParam('searchQuery', searchQuery);
  }

  /**
   * Execute the search
   */
  override async execute(): Promise<SearchAzureReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    validateRequired(this.params.projectName, 'Azure project name');
    return this.executor(this.params as SearchAzureReposRequest);
  }

  protected override getItems(response: SearchAzureReposResponse): AzureRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching Bitbucket Server repositories
 */
export class BitbucketServerReposSearchBuilder extends RepositorySearchBuilder<
  SearchBitbucketServerReposRequest,
  SearchBitbucketServerReposResponse,
  BitbucketServerRepository
> {
  /**
   * Set the repository name filter
   */
  withRepositoryName(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  /**
   * Set the repository slug filter
   */
  withRepoSlug(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketServerReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    validateRequired(this.params.projectKey, 'Bitbucket project key');
    return this.executor(this.params as SearchBitbucketServerReposRequest);
  }

  protected getItems(response: SearchBitbucketServerReposResponse): BitbucketServerRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching Bitbucket Cloud repositories
 */
export class BitbucketCloudReposSearchBuilder extends RepositorySearchBuilder<
  SearchBitbucketCloudReposRequest,
  SearchBitbucketCloudReposResponse,
  BitbucketCloudRepository
> {
  /**
   * Set the workspace
   */
  inWorkspace(workspace: string): this {
    return this.setParam('workspaceId', workspace);
  }

  /**
   * Set the repository name filter
   * @deprecated Use withRepoSlug instead
   */
  withRepositoryName(repoSlug: string): this {
    DeprecationManager.warn({
      api: 'BitbucketCloudReposSearchBuilder.withRepositoryName()',
      replacement: 'withRepoSlug()',
      reason: 'This method has been deprecated.',
    });
    return this.withRepoSlug(repoSlug);
  }

  /**
   * Set the repository name filter
   */
  withRepoSlug(repoSlug: string): this {
    return this.setParam('repositoryName', repoSlug);
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketCloudReposResponse> {
    validateRequired(this.params.almSetting, 'ALM setting');
    return this.executor(this.params as SearchBitbucketCloudReposRequest);
  }

  protected getItems(response: SearchBitbucketCloudReposResponse): BitbucketCloudRepository[] {
    return response.repositories;
  }
}

/**
 * Builder for searching GitLab projects
 */
export class GitLabReposSearchBuilder extends RepositorySearchBuilder<
  SearchGitLabReposRequest,
  SearchGitLabReposResponse,
  GitLabProject
> {
  /**
   * Set the GitLab project name filter
   */
  withProjectName(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the minimum access level
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

  protected getItems(response: SearchGitLabReposResponse): GitLabProject[] {
    return response.projects;
  }
}
