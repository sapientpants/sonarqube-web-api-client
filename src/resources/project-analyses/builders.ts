import { PaginatedBuilder, ParameterHelpers } from '../../core/builders';
import { ValidationError } from '../../errors';
import type {
  EventCategory,
  ProjectAnalysis,
  SearchAnalysesRequest,
  SearchAnalysesResponse,
} from './types';

/**
 * Builder for constructing paginated project analyses search requests.
 *
 * @example
 * ```typescript
 * // Search for analyses in a project
 * const analyses = await client.projectAnalyses.search()
 *   .project('my-project')
 *   .execute();
 *
 * // Search with filters
 * const analyses = await client.projectAnalyses.search()
 *   .project('my-project')
 *   .branch('main')
 *   .category('VERSION')
 *   .from('2024-01-01')
 *   .to('2024-12-31')
 *   .execute();
 *
 * // Iterate through all analyses
 * for await (const analysis of client.projectAnalyses.search()
 *   .project('my-project')
 *   .all()) {
 *   console.log(analysis.date, analysis.events);
 * }
 * ```
 */
export class SearchProjectAnalysesBuilder extends PaginatedBuilder<
  SearchAnalysesRequest,
  SearchAnalysesResponse,
  ProjectAnalysis
> {
  /**
   * Set the project key (required).
   * @param value - The project key
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Filter by branch key.
   * @param value - The branch key
   */
  branch = ParameterHelpers.createStringMethod<typeof this>('branch');

  /**
   * Filter analyses created after the given date (inclusive).
   * @param value - Date in YYYY-MM-DD format or datetime
   */
  from = ParameterHelpers.createStringMethod<typeof this>('from');

  /**
   * Filter analyses created before the given date (inclusive).
   * @param value - Date in YYYY-MM-DD format or datetime (e.g., 2017-10-19 or 2017-10-19T13:00:00+0200)
   */
  to = ParameterHelpers.createStringMethod<typeof this>('to');

  /**
   * Filter analyses that have at least one event of the specified category.
   * @param value - The event category
   */
  category(value: EventCategory): this {
    this.params.category = value;
    return this;
  }

  async execute(): Promise<SearchAnalysesResponse> {
    const finalParams = this.params as SearchAnalysesRequest;

    // Validate required parameter
    if (!finalParams.project) {
      throw new ValidationError('Project key is required');
    }

    // Validate page size if provided
    if (finalParams.ps !== undefined && (finalParams.ps <= 0 || finalParams.ps > 500)) {
      throw new ValidationError('Page size must be greater than 0 and less than or equal to 500');
    }

    return this.executor(finalParams);
  }

  protected getItems(response: SearchAnalysesResponse): ProjectAnalysis[] {
    return response.analyses;
  }
}
