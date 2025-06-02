import { BaseBuilder, ParameterHelpers } from '../../core/builders';
import type { SearchTagsParams, SearchTagsResponse } from './types';

/**
 * Builder for searching project tags.
 */
export class ProjectTagsSearchBuilder extends BaseBuilder<SearchTagsParams, SearchTagsResponse> {
  /**
   * Set the project key.
   */
  withProject = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the project key (alias for withProject).
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the query string to search for tags.
   */
  withQuery = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Set the query string to search for tags (alias for withQuery).
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Set the page size (number of tags to return).
   */
  withPageSize(ps: number): this {
    return this.setParam('ps', ps);
  }

  /**
   * Set the page size (alias for withPageSize).
   */
  pageSize(ps: number): this {
    return this.withPageSize(ps);
  }

  async execute(): Promise<SearchTagsResponse> {
    const finalParams = this.params as SearchTagsParams;
    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_tags/search';
  }
}
