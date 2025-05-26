import { BaseClient } from '../../core/BaseClient';
import type {
  AddProjectRequest,
  CreateApplicationRequest,
  CreateApplicationResponse,
  CreateBranchRequest,
  DeleteApplicationRequest,
  DeleteBranchRequest,
  RemoveProjectRequest,
  SetTagsRequest,
  ShowApplicationRequest,
  ShowApplicationResponse,
  UpdateApplicationRequest,
  UpdateBranchRequest,
} from './types';

/**
 * Client for managing SonarQube applications
 * @since 7.3
 */
export class ApplicationsClient extends BaseClient {
  /**
   * Add a project to an application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the project is added
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application
   */
  async addProject(params: AddProjectRequest): Promise<void> {
    await this.request('/api/applications/add_project', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a new application
   * @since 7.3
   * @param params - Request parameters
   * @returns The created application
   * @throws {Error} If the request fails
   * @requires Administer System permission or Create Applications permission
   */
  async create(params: CreateApplicationRequest): Promise<CreateApplicationResponse> {
    return this.request<CreateApplicationResponse>('/api/applications/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a new branch on a given application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the branch is created
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application and Browse permission on its child projects
   */
  async createBranch(params: CreateBranchRequest): Promise<void> {
    await this.request('/api/applications/create_branch', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete an application definition
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the application is deleted
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application
   */
  async delete(params: DeleteApplicationRequest): Promise<void> {
    await this.request('/api/applications/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a branch on a given application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the branch is deleted
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application
   */
  async deleteBranch(params: DeleteBranchRequest): Promise<void> {
    await this.request('/api/applications/delete_branch', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Remove a project from an application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the project is removed
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application
   */
  async removeProject(params: RemoveProjectRequest): Promise<void> {
    await this.request('/api/applications/remove_project', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Set tags on an application
   * @since 8.3
   * @param params - Request parameters
   * @returns Promise that resolves when tags are set
   * @throws {Error} If the request fails
   * @requires Administrator permission on the specified application
   */
  async setTags(params: SetTagsRequest): Promise<void> {
    await this.request('/api/applications/set_tags', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        tags: params.tags.join(','),
      }),
    });
  }

  /**
   * Returns an application and its associated projects
   * @since 7.3
   * @param params - Request parameters
   * @returns The application details
   * @throws {Error} If the request fails
   * @requires Browse permission on the application and on its child projects
   */
  async show(params: ShowApplicationRequest): Promise<ShowApplicationResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('application', params.application);
    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }

    return this.request<ShowApplicationResponse>(
      `/api/applications/show?${searchParams.toString()}`
    );
  }

  /**
   * Update an application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the application is updated
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application
   */
  async update(params: UpdateApplicationRequest): Promise<void> {
    await this.request('/api/applications/update', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a branch on a given application
   * @since 7.3
   * @param params - Request parameters
   * @returns Promise that resolves when the branch is updated
   * @throws {Error} If the request fails
   * @requires Administrator permission on the application and Browse permission on its child projects
   */
  async updateBranch(params: UpdateBranchRequest): Promise<void> {
    await this.request('/api/applications/update_branch', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
