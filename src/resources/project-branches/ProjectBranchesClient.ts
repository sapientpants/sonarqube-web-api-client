import { BaseClient } from '../../core/BaseClient.js';
import type { DeleteBranchParams, RenameMainBranchParams } from './types.js';
import { ProjectBranchesListBuilder } from './builders.js';

/**
 * Client for interacting with the SonarQube Project Branches API.
 */
export class ProjectBranchesClient extends BaseClient {
  /**
   * List the branches of a project.
   *
   * Provides a builder for flexible querying.
   *
   * @returns A builder for listing branches
   *
   * @example
   * ```typescript
   * // List branches for a specific project
   * const branches = await client.projectBranches
   *   .list()
   *   .withProject('my-project')
   *   .execute();
   *
   * // List specific branches by IDs
   * const branches = await client.projectBranches
   *   .list()
   *   .withBranchIds(['uuid1', 'uuid2'])
   *   .execute();
   * ```
   */
  list(): ProjectBranchesListBuilder {
    return new ProjectBranchesListBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.project !== undefined) {
        query.append('project', params.project);
      }
      if (params.branchIds) {
        query.append('branchIds', params.branchIds.join(','));
      }
      return this.request(`/api/project_branches/list?${query.toString()}`);
    });
  }

  /**
   * Delete a non-main branch of a project.
   *
   * Requires 'Administer' rights on the specified project.
   *
   * @param params - Parameters for deleting a branch
   * @returns A promise that resolves when the branch is deleted
   *
   * @example
   * ```typescript
   * await client.projectBranches.delete({
   *   project: 'my-project',
   *   branch: 'feature-branch'
   * });
   * ```
   */
  async delete(params: DeleteBranchParams): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('project', params.project);
    formData.append('branch', params.branch);

    await this.request('/api/project_branches/delete', {
      method: 'POST',
      body: formData.toString(),
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Rename the main branch of a project.
   *
   * Requires 'Administer' permission on the specified project.
   *
   * @param params - Parameters for renaming the main branch
   * @returns A promise that resolves when the branch is renamed
   *
   * @example
   * ```typescript
   * await client.projectBranches.rename({
   *   project: 'my-project',
   *   name: 'main'
   * });
   * ```
   */
  async rename(params: RenameMainBranchParams): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('project', params.project);
    formData.append('name', params.name);

    await this.request('/api/project_branches/rename', {
      method: 'POST',
      body: formData.toString(),
      headers: {
        ['Content-Type']: 'application/x-www-form-urlencoded',
      },
    });
  }
}
