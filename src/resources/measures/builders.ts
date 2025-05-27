import { PaginatedBuilder, validateRequired } from '../../core/builders';
import { ValidationError } from '../../errors';
import type {
  ComponentTreeRequest,
  ComponentTreeResponse,
  ComponentMeasures,
  MeasuresHistoryRequest,
  MeasuresHistoryResponse,
  ComponentMeasuresHistory,
  MeasuresAdditionalField,
  ComponentTreeStrategy,
  ComponentQualifier,
} from './types';

/**
 * Builder for component tree search with measures
 */
export class ComponentTreeBuilder extends PaginatedBuilder<
  ComponentTreeRequest,
  ComponentTreeResponse,
  ComponentMeasures
> {
  constructor(
    executor: (params: ComponentTreeRequest) => Promise<ComponentTreeResponse>,
    component: string,
    metricKeys: string[]
  ) {
    super(executor);
    this.setParam('component', component);
    this.setParam('metricKeys', metricKeys);
  }

  /**
   * Use base component ID instead of component key
   */
  withBaseComponentId(baseComponentId: string): this {
    this.setParam('component', undefined);
    return this.setParam('baseComponentId', baseComponentId);
  }

  /**
   * Add additional fields to the response
   */
  withAdditionalFields(...fields: MeasuresAdditionalField[]): this {
    return this.setParam('additionalFields', fields);
  }

  /**
   * Set the search strategy
   */
  withStrategy(strategy: ComponentTreeStrategy): this {
    return this.setParam('strategy', strategy);
  }

  /**
   * Filter by component qualifiers
   */
  withQualifiers(...qualifiers: ComponentQualifier[]): this {
    return this.setParam('qualifiers', qualifiers);
  }

  /**
   * Set branch for analysis
   */
  withBranch(branch: string): this {
    return this.setParam('branch', branch);
  }

  /**
   * Set pull request for analysis
   */
  withPullRequest(pullRequest: string): this {
    return this.setParam('pullRequest', pullRequest);
  }

  /**
   * Set query filter
   */
  withQuery(query: string): this {
    return this.setParam('q', query);
  }

  /**
   * Sort by metric
   */
  sortByMetric(metricKey: string, filter: 'all' | 'withMeasuresOnly' = 'all'): this {
    this.setParam('metricSort', metricKey);
    return this.setParam('metricSortFilter', filter);
  }

  /**
   * Sort by field
   */
  sortBy(field: string, ascending = true): this {
    this.setParam('s', field);
    return this.setParam('asc', ascending);
  }

  async execute(): Promise<ComponentTreeResponse> {
    if (!this.params.metricKeys || this.params.metricKeys.length === 0) {
      throw new ValidationError('Metric keys is required');
    }

    if (this.params.metricKeys.length > 15) {
      throw new ValidationError('Maximum 15 metric keys allowed');
    }

    if (this.params.component === undefined && this.params.baseComponentId === undefined) {
      throw new ValidationError('Either component or baseComponentId must be provided');
    }

    return this.executor(this.params as ComponentTreeRequest);
  }

  protected getItems(response: ComponentTreeResponse): ComponentMeasures[] {
    return response.components;
  }
}

/**
 * Builder for measures history search
 */
export class MeasuresHistoryBuilder extends PaginatedBuilder<
  MeasuresHistoryRequest,
  MeasuresHistoryResponse,
  ComponentMeasuresHistory
> {
  constructor(
    executor: (params: MeasuresHistoryRequest) => Promise<MeasuresHistoryResponse>,
    component: string,
    metrics: string[]
  ) {
    super(executor);
    this.setParam('component', component);
    this.setParam('metrics', metrics);
  }

  /**
   * Set branch for analysis
   */
  withBranch(branch: string): this {
    return this.setParam('branch', branch);
  }

  /**
   * Set pull request for analysis
   */
  withPullRequest(pullRequest: string): this {
    return this.setParam('pullRequest', pullRequest);
  }

  /**
   * Set start date for history (YYYY-MM-DD format)
   */
  from(date: string): this {
    return this.setParam('from', date);
  }

  /**
   * Set end date for history (YYYY-MM-DD format)
   */
  to(date: string): this {
    return this.setParam('to', date);
  }

  /**
   * Set date range for history
   */
  dateRange(from: string, to: string): this {
    this.setParam('from', from);
    return this.setParam('to', to);
  }

  async execute(): Promise<MeasuresHistoryResponse> {
    validateRequired(this.params.component, 'Component');

    if (!this.params.metrics || this.params.metrics.length === 0) {
      throw new ValidationError('Metrics is required');
    }

    return this.executor(this.params as MeasuresHistoryRequest);
  }

  protected getItems(response: MeasuresHistoryResponse): ComponentMeasuresHistory[] {
    return response.measures;
  }
}
