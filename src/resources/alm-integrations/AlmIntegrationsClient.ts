import { BaseClient } from '../../core/BaseClient';
import type {
  SetPatRequest,
  ListAzureProjectsRequest,
  ListAzureProjectsResponse,
  SearchAzureReposRequest,
  SearchAzureReposResponse,
  ListBitbucketServerProjectsRequest,
  ListBitbucketServerProjectsResponse,
  SearchBitbucketServerReposRequest,
  SearchBitbucketServerReposResponse,
  SearchBitbucketCloudReposRequest,
  SearchBitbucketCloudReposResponse,
  SearchGitLabReposRequest,
  SearchGitLabReposResponse,
} from './types';

import {
  AzureReposSearchBuilder,
  BitbucketServerReposSearchBuilder,
  BitbucketCloudReposSearchBuilder,
  GitLabReposSearchBuilder,
} from './builders';

export class AlmIntegrationsClient extends BaseClient {
  /**
   * Set a Personal Access Token for the given DevOps Platform setting
   * Requires the 'Create Projects' permission
   * @since 8.2
   */
  async setPat(params: SetPatRequest): Promise<void> {
    await this.request('/api/alm_integrations/set_pat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * List Azure projects
   * Requires the 'Create Projects' permission
   * @since 8.6
   */
  async listAzureProjects(params: ListAzureProjectsRequest): Promise<ListAzureProjectsResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/list_azure_projects?${query.toString()}`);
  }

  /**
   * Search the Azure repositories
   * Requires the 'Create Projects' permission
   * @since 8.6
   */
  async searchAzureRepos(params: SearchAzureReposRequest): Promise<SearchAzureReposResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      projectName: params.projectName,
      ...(params.searchQuery !== undefined &&
        params.searchQuery !== '' && {
          searchQuery: params.searchQuery,
        }),
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/search_azure_repos?${query.toString()}`);
  }

  /**
   * Create a builder for searching Azure repositories with a fluent interface
   * @since 8.6
   */
  searchAzureReposBuilder(): AzureReposSearchBuilder {
    return new AzureReposSearchBuilder(async (params) => {
      return this.searchAzureRepos(params);
    });
  }

  /**
   * List the Bitbucket Server projects
   * Requires the 'Create Projects' permission
   * @since 8.2
   */
  async listBitbucketServerProjects(
    params: ListBitbucketServerProjectsRequest
  ): Promise<ListBitbucketServerProjectsResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/list_bitbucketserver_projects?${query.toString()}`);
  }

  /**
   * Search the Bitbucket Server repositories with REPO_ADMIN access
   * Requires the 'Create Projects' permission
   * @since 8.2
   */
  async searchBitbucketServerRepos(
    params: SearchBitbucketServerReposRequest
  ): Promise<SearchBitbucketServerReposResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      projectKey: params.projectKey,
      ...(params.repositoryName !== undefined &&
        params.repositoryName !== '' && {
          repositoryName: params.repositoryName,
        }),
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/search_bitbucketserver_repos?${query.toString()}`);
  }

  /**
   * Create a builder for searching Bitbucket Server repositories with a fluent interface
   * @since 8.2
   */
  searchBitbucketServerReposBuilder(): BitbucketServerReposSearchBuilder {
    return new BitbucketServerReposSearchBuilder(async (params) => {
      return this.searchBitbucketServerRepos(params);
    });
  }

  /**
   * Search the Bitbucket Cloud repositories
   * Requires the 'Create Projects' permission
   * @since 9.0
   */
  async searchBitbucketCloudRepos(
    params: SearchBitbucketCloudReposRequest
  ): Promise<SearchBitbucketCloudReposResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      workspaceId: params.workspaceId,
      ...(params.repositoryName !== undefined &&
        params.repositoryName !== '' && {
          repositoryName: params.repositoryName,
        }),
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/search_bitbucketcloud_repos?${query.toString()}`);
  }

  /**
   * Create a builder for searching Bitbucket Cloud repositories with a fluent interface
   * @since 9.0
   */
  searchBitbucketCloudReposBuilder(): BitbucketCloudReposSearchBuilder {
    return new BitbucketCloudReposSearchBuilder(async (params) => {
      return this.searchBitbucketCloudRepos(params);
    });
  }

  /**
   * Search the GitLab projects
   * Requires the 'Create Projects' permission
   * @since 8.5
   */
  async searchGitLabRepos(params: SearchGitLabReposRequest): Promise<SearchGitLabReposResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
      ...(params.projectName !== undefined &&
        params.projectName !== '' && {
          projectName: params.projectName,
        }),
      ...(params.minAccessLevel !== undefined && { minAccessLevel: String(params.minAccessLevel) }),
      ...(params.p !== undefined && { p: String(params.p) }),
      ...(params.ps !== undefined && { ps: String(params.ps) }),
    });

    return this.request(`/api/alm_integrations/search_gitlab_repos?${query.toString()}`);
  }

  /**
   * Create a builder for searching GitLab projects with a fluent interface
   * @since 8.5
   */
  searchGitLabReposBuilder(): GitLabReposSearchBuilder {
    return new GitLabReposSearchBuilder(async (params) => {
      return this.searchGitLabRepos(params);
    });
  }
}
