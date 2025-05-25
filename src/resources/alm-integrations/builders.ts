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
 * Base builder for search operations
 */
abstract class BaseSearchBuilder<TRequest, TResponse> {
  protected params: Partial<TRequest> = {};

  constructor(protected executor: (params: TRequest) => Promise<TResponse>) {}

  /**
   * Set the page number
   */
  page(pageNumber: number): this {
    const params = this.params as { p?: number };
    params.p = pageNumber;
    return this;
  }

  /**
   * Set the page size
   */
  pageSize(size: number): this {
    const params = this.params as { ps?: number };
    params.ps = size;
    return this;
  }

  /**
   * Execute the search query
   */
  abstract execute(): Promise<TResponse>;
}

/**
 * Builder for searching Azure repositories
 */
export class AzureReposSearchBuilder extends BaseSearchBuilder<
  SearchAzureReposRequest,
  SearchAzureReposResponse
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    this.params.almSetting = almSetting;
    return this;
  }

  /**
   * Set the Azure project name (required)
   */
  inProject(projectName: string): this {
    this.params.projectName = projectName;
    return this;
  }

  /**
   * Set the search query to filter repositories
   */
  withQuery(searchQuery: string): this {
    this.params.searchQuery = searchQuery;
    return this;
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchAzureReposResponse> {
    if (this.params.almSetting === undefined || this.params.almSetting === '') {
      throw new Error('ALM setting is required');
    }
    if (this.params.projectName === undefined || this.params.projectName === '') {
      throw new Error('Project name is required');
    }

    return this.executor(this.params as SearchAzureReposRequest);
  }

  /**
   * Execute and return all repositories using async iteration
   */
  async *all(): AsyncGenerator<AzureRepository> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(page).execute();

      for (const repo of response.repositories) {
        yield repo;
      }

      const totalPages = Math.ceil(response.paging.total / response.paging.pageSize);
      hasMore = page < totalPages;
      page++;
    }
  }
}

/**
 * Builder for searching Bitbucket Server repositories
 */
export class BitbucketServerReposSearchBuilder extends BaseSearchBuilder<
  SearchBitbucketServerReposRequest,
  SearchBitbucketServerReposResponse
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    this.params.almSetting = almSetting;
    return this;
  }

  /**
   * Set the Bitbucket project key (required)
   */
  inProject(projectKey: string): this {
    this.params.projectKey = projectKey;
    return this;
  }

  /**
   * Set the repository name to filter
   */
  withRepositoryName(repositoryName: string): this {
    this.params.repositoryName = repositoryName;
    return this;
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketServerReposResponse> {
    if (this.params.almSetting === undefined || this.params.almSetting === '') {
      throw new Error('ALM setting is required');
    }
    if (this.params.projectKey === undefined || this.params.projectKey === '') {
      throw new Error('Project key is required');
    }

    return this.executor(this.params as SearchBitbucketServerReposRequest);
  }

  /**
   * Execute and return all repositories using async iteration
   */
  async *all(): AsyncGenerator<BitbucketServerRepository> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(page).execute();

      for (const repo of response.repositories) {
        yield repo;
      }

      hasMore = !response.isLastPage;
      page++;
    }
  }
}

/**
 * Builder for searching Bitbucket Cloud repositories
 */
export class BitbucketCloudReposSearchBuilder extends BaseSearchBuilder<
  SearchBitbucketCloudReposRequest,
  SearchBitbucketCloudReposResponse
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    this.params.almSetting = almSetting;
    return this;
  }

  /**
   * Set the Bitbucket workspace ID (required)
   */
  inWorkspace(workspaceId: string): this {
    this.params.workspaceId = workspaceId;
    return this;
  }

  /**
   * Set the repository name to filter
   */
  withRepositoryName(repositoryName: string): this {
    this.params.repositoryName = repositoryName;
    return this;
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchBitbucketCloudReposResponse> {
    if (this.params.almSetting === undefined || this.params.almSetting === '') {
      throw new Error('ALM setting is required');
    }
    if (this.params.workspaceId === undefined || this.params.workspaceId === '') {
      throw new Error('Workspace ID is required');
    }

    return this.executor(this.params as SearchBitbucketCloudReposRequest);
  }

  /**
   * Execute and return all repositories using async iteration
   */
  async *all(): AsyncGenerator<BitbucketCloudRepository> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(page).execute();

      for (const repo of response.repositories) {
        yield repo;
      }

      const totalPages = Math.ceil(response.paging.total / response.paging.pageSize);
      hasMore = page < totalPages;
      page++;
    }
  }
}

/**
 * Builder for searching GitLab projects
 */
export class GitLabReposSearchBuilder extends BaseSearchBuilder<
  SearchGitLabReposRequest,
  SearchGitLabReposResponse
> {
  /**
   * Set the ALM setting key (required)
   */
  withAlmSetting(almSetting: string): this {
    this.params.almSetting = almSetting;
    return this;
  }

  /**
   * Set the project name to search for
   */
  withProjectName(projectName: string): this {
    this.params.projectName = projectName;
    return this;
  }

  /**
   * Set the minimum access level (GitLab permission level)
   * 10 = Guest, 20 = Reporter, 30 = Developer, 40 = Maintainer, 50 = Owner
   */
  withMinAccessLevel(minAccessLevel: number): this {
    this.params.minAccessLevel = minAccessLevel;
    return this;
  }

  /**
   * Execute the search
   */
  async execute(): Promise<SearchGitLabReposResponse> {
    if (this.params.almSetting === undefined || this.params.almSetting === '') {
      throw new Error('ALM setting is required');
    }

    return this.executor(this.params as SearchGitLabReposRequest);
  }

  /**
   * Execute and return all projects using async iteration
   */
  async *all(): AsyncGenerator<GitLabProject> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.page(page).execute();

      for (const project of response.projects) {
        yield project;
      }

      const totalPages = Math.ceil(response.paging.total / response.paging.pageSize);
      hasMore = page < totalPages;
      page++;
    }
  }
}
