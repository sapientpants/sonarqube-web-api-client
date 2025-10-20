import { BaseBuilder, ParameterHelpers } from '../../core/builders/index.js';
import type { SearchProjectLinksRequest, SearchProjectLinksResponse } from './types.js';

/**
 * Builder for searching project links.
 */
export class ProjectLinksSearchBuilder extends BaseBuilder<
  SearchProjectLinksRequest,
  SearchProjectLinksResponse
> {
  /**
   * Set the project ID.
   */
  withProjectId = ParameterHelpers.createStringMethod<typeof this>('projectId');

  /**
   * Set the project ID (alias for withProjectId).
   */
  projectId = ParameterHelpers.createStringMethod<typeof this>('projectId');

  /**
   * Set the project key.
   */
  withProjectKey = ParameterHelpers.createStringMethod<typeof this>('projectKey');

  /**
   * Set the project key (alias for withProjectKey).
   */
  projectKey = ParameterHelpers.createStringMethod<typeof this>('projectKey');

  async execute(): Promise<SearchProjectLinksResponse> {
    const finalParams = this.params as SearchProjectLinksRequest;

    if (finalParams.projectId === undefined && finalParams.projectKey === undefined) {
      throw new Error('Either projectId or projectKey must be provided');
    }

    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_links/search';
  }
}
