import { BaseBuilder, ParameterHelpers } from '../../core/builders/index.js';
import type { ListPullRequestsRequest, ListPullRequestsResponse } from './types.js';

/**
 * Builder for listing project pull requests.
 */
export class ProjectPullRequestsListBuilder extends BaseBuilder<
  ListPullRequestsRequest,
  ListPullRequestsResponse
> {
  /**
   * Set the project key.
   *
   * Required parameter.
   */
  withProject = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the project key (alias for withProject).
   *
   * Required parameter.
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  async execute(): Promise<ListPullRequestsResponse> {
    const finalParams = this.params as ListPullRequestsRequest;
    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_pull_requests/list';
  }
}
