import { BaseBuilder, ParameterHelpers } from '../../core/builders';
import type { ListBranchesParams, ListBranchesResponse } from './types';

/**
 * Builder for listing project branches.
 */
export class ProjectBranchesListBuilder extends BaseBuilder<
  ListBranchesParams,
  ListBranchesResponse
> {
  /**
   * Set the project key.
   *
   * Required unless branchIds is provided.
   */
  withProject = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the branch IDs to retrieve.
   *
   * List of up to 50 branch IDs - required unless project key is provided.
   */
  withBranchIds = ParameterHelpers.createArrayMethod<typeof this>('branchIds');

  async execute(): Promise<ListBranchesResponse> {
    const finalParams = this.params as ListBranchesParams;
    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_branches/list';
  }
}
