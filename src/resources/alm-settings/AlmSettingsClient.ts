import { BaseClient } from '../../core/BaseClient';
import type {
  CountBindingRequest,
  CountBindingResponse,
  CreateAzureRequest,
  CreateBitbucketRequest,
  CreateBitbucketCloudRequest,
  CreateGitHubRequest,
  CreateGitLabRequest,
  UpdateAzureRequest,
  UpdateBitbucketRequest,
  UpdateBitbucketCloudRequest,
  UpdateGitHubRequest,
  UpdateGitLabRequest,
  DeleteAlmSettingRequest,
  ListAlmSettingsRequest,
  ListAlmSettingsResponse,
  ListDefinitionsResponse,
  GetBindingRequest,
  ProjectBinding,
  DeleteBindingRequest,
  SetAzureBindingRequest,
  SetBitbucketBindingRequest,
  SetBitbucketCloudBindingRequest,
  SetGitHubBindingRequest,
  SetGitLabBindingRequest,
  ValidateAlmSettingRequest,
  ValidateAlmSettingResponse,
} from './types';

/**
 * Client for managing DevOps Platform Settings (ALM Settings)
 */
export class AlmSettingsClient extends BaseClient {
  /**
   * Count number of projects bound to a DevOps Platform setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async countBinding(params: CountBindingRequest): Promise<CountBindingResponse> {
    const query = new URLSearchParams({
      almSetting: params.almSetting,
    });
    return this.request(`/api/alm_settings/count_binding?${query.toString()}`);
  }

  /**
   * Create Azure DevOps instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async createAzure(params: CreateAzureRequest): Promise<void> {
    await this.request('/api/alm_settings/create_azure', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create Bitbucket Server instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async createBitbucket(params: CreateBitbucketRequest): Promise<void> {
    await this.request('/api/alm_settings/create_bitbucket', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create Bitbucket Cloud instance setting
   * Requires the 'Administer System' permission
   * @since 8.7
   */
  async createBitbucketCloud(params: CreateBitbucketCloudRequest): Promise<void> {
    await this.request('/api/alm_settings/create_bitbucketcloud', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create GitHub instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async createGitHub(params: CreateGitHubRequest): Promise<void> {
    await this.request('/api/alm_settings/create_github', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create GitLab instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async createGitLab(params: CreateGitLabRequest): Promise<void> {
    await this.request('/api/alm_settings/create_gitlab', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update Azure DevOps instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async updateAzure(params: UpdateAzureRequest): Promise<void> {
    await this.request('/api/alm_settings/update_azure', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update Bitbucket Server instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async updateBitbucket(params: UpdateBitbucketRequest): Promise<void> {
    await this.request('/api/alm_settings/update_bitbucket', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update Bitbucket Cloud instance setting
   * Requires the 'Administer System' permission
   * @since 8.7
   */
  async updateBitbucketCloud(params: UpdateBitbucketCloudRequest): Promise<void> {
    await this.request('/api/alm_settings/update_bitbucketcloud', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update GitHub instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async updateGitHub(params: UpdateGitHubRequest): Promise<void> {
    await this.request('/api/alm_settings/update_github', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update GitLab instance setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async updateGitLab(params: UpdateGitLabRequest): Promise<void> {
    await this.request('/api/alm_settings/update_gitlab', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a DevOps Platform setting
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async delete(params: DeleteAlmSettingRequest): Promise<void> {
    await this.request('/api/alm_settings/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * List DevOps Platform settings available for a given project
   * Requires the 'Administer project' permission if project parameter is provided,
   * requires the 'Create Projects' permission otherwise
   * @since 8.1
   */
  async list(params?: ListAlmSettingsRequest): Promise<ListAlmSettingsResponse> {
    const query = new URLSearchParams();
    if (params?.project !== undefined) {
      query.append('project', params.project);
    }
    const queryString = query.toString();
    return this.request(`/api/alm_settings/list${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * List all DevOps Platform settings definitions
   * Requires the 'Administer System' permission
   * @since 8.1
   */
  async listDefinitions(): Promise<ListDefinitionsResponse> {
    return this.request('/api/alm_settings/list_definitions');
  }

  /**
   * Get DevOps Platform binding of a given project
   * Requires the 'Browse' permission on the project
   * @since 8.1
   */
  async getBinding(params: GetBindingRequest): Promise<ProjectBinding> {
    const query = new URLSearchParams({
      project: params.project,
    });
    return this.request(`/api/alm_settings/get_binding?${query.toString()}`);
  }

  /**
   * Delete the DevOps Platform binding of a project
   * Requires the 'Administer' permission on the project
   * @since 8.1
   */
  async deleteBinding(params: DeleteBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/delete_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bind an Azure DevOps instance to a project
   * Requires the 'Administer' permission on the project
   * @since 8.1
   */
  async setAzureBinding(params: SetAzureBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/set_azure_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bind a Bitbucket Server instance to a project
   * Requires the 'Administer' permission on the project
   * @since 8.1
   */
  async setBitbucketBinding(params: SetBitbucketBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/set_bitbucket_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bind a Bitbucket Cloud instance to a project
   * Requires the 'Administer' permission on the project
   * @since 8.7
   */
  async setBitbucketCloudBinding(params: SetBitbucketCloudBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/set_bitbucketcloud_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bind a GitHub instance to a project
   * Requires the 'Administer' permission on the project
   * @since 8.1
   */
  async setGitHubBinding(params: SetGitHubBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/set_github_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bind a GitLab instance to a project
   * Requires the 'Administer' permission on the project
   * @since 8.1
   */
  async setGitLabBinding(params: SetGitLabBindingRequest): Promise<void> {
    await this.request('/api/alm_settings/set_gitlab_binding', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Validate a DevOps Platform setting by checking connectivity and permissions
   * Requires the 'Administer System' permission
   * @since 8.6
   */
  async validate(params: ValidateAlmSettingRequest): Promise<ValidateAlmSettingResponse> {
    const query = new URLSearchParams({
      key: params.key,
    });
    return this.request(`/api/alm_settings/validate?${query.toString()}`);
  }
}
