import { BaseClient } from '../../core/BaseClient.js';
import type {
  ComponentMeasuresRequest,
  ComponentMeasuresResponse,
  ComponentTreeRequest,
  ComponentTreeResponse,
  MeasuresHistoryRequest,
} from './types.js';
import { ComponentTreeBuilder, MeasuresHistoryBuilder } from './builders.js';

/**
 * Client for managing measures and metrics
 */
export class MeasuresClient extends BaseClient {
  /**
   * Get component measures for specified metrics
   * Requires 'Browse' permission on the project
   * @since 5.4
   */
  async component(params: ComponentMeasuresRequest): Promise<ComponentMeasuresResponse> {
    const query = new URLSearchParams();

    if (params.component !== undefined) {
      query.append('component', params.component);
    }
    if (params.componentId !== undefined) {
      query.append('componentId', params.componentId);
    }

    query.append('metricKeys', params.metricKeys.join(','));

    if (params.additionalFields !== undefined && params.additionalFields.length > 0) {
      query.append('additionalFields', params.additionalFields.join(','));
    }
    if (params.branch !== undefined) {
      query.append('branch', params.branch);
    }
    if (params.pullRequest !== undefined) {
      query.append('pullRequest', params.pullRequest);
    }

    return this.request(`/api/measures/component?${query.toString()}`);
  }

  /**
   * Create a builder for component tree search with measures
   * Navigate through components based on chosen strategy with specified measures
   * Requires 'Browse' permission on the project
   * @since 5.4
   */
  componentTree(component: string, metricKeys: string[]): ComponentTreeBuilder {
    return new ComponentTreeBuilder(
      async (params: ComponentTreeRequest) => this.executeComponentTreeRequest(params),
      component,
      metricKeys,
    );
  }

  /**
   * Create a builder for measures history search
   * Search measures history of a component
   * Requires 'Browse' permission on the component
   * @since 6.3
   */
  searchHistory(component: string, metrics: string[]): MeasuresHistoryBuilder {
    return new MeasuresHistoryBuilder(
      async (params: MeasuresHistoryRequest) => {
        const query = this.buildHistoryQuery(params);
        return this.request(`/api/measures/search_history?${query.toString()}`);
      },
      component,
      metrics,
    );
  }

  /**
   * Build query parameters for history request
   * @private
   */
  private buildHistoryQuery(params: MeasuresHistoryRequest): URLSearchParams {
    const query = new URLSearchParams();
    query.append('component', params.component);
    query.append('metrics', params.metrics.join(','));

    this.appendOptionalStringParam(query, 'branch', params.branch);
    this.appendOptionalStringParam(query, 'pullRequest', params.pullRequest);
    this.appendOptionalStringParam(query, 'from', params.from);
    this.appendOptionalStringParam(query, 'to', params.to);
    this.appendOptionalParam(query, 'p', params.p);
    this.appendOptionalParam(query, 'ps', params.ps);

    return query;
  }

  /**
   * Executes component tree request with measures
   * @private
   */
  private async executeComponentTreeRequest(
    params: ComponentTreeRequest,
  ): Promise<ComponentTreeResponse> {
    const query = this.buildComponentTreeParams(params);
    return this.request(`/api/measures/component_tree?${query.toString()}`);
  }

  /**
   * Builds URL parameters for component tree request
   * @private
   */
  private buildComponentTreeParams(params: ComponentTreeRequest): URLSearchParams {
    const query = new URLSearchParams();

    this.addRequiredParams(query, params);
    this.addOptionalStringParams(query, params);
    this.addOptionalArrayParams(query, params);
    this.addOptionalScalarParams(query, params);

    return query;
  }

  /**
   * Add required parameters to query
   * @private
   */
  private addRequiredParams(query: URLSearchParams, params: ComponentTreeRequest): void {
    this.appendOptionalStringParam(query, 'component', params.component);
    this.appendOptionalStringParam(query, 'baseComponentId', params.baseComponentId);
    query.append('metricKeys', params.metricKeys.join(','));
  }

  /**
   * Add optional string parameters to query
   * @private
   */
  private addOptionalStringParams(query: URLSearchParams, params: ComponentTreeRequest): void {
    this.appendOptionalStringParam(query, 'strategy', params.strategy);
    this.appendOptionalStringParam(query, 'branch', params.branch);
    this.appendOptionalStringParam(query, 'pullRequest', params.pullRequest);
    this.appendOptionalStringParam(query, 'q', params.q);
    this.appendOptionalStringParam(query, 'metricSort', params.metricSort);
    this.appendOptionalStringParam(query, 'metricSortFilter', params.metricSortFilter);
    this.appendOptionalStringParam(query, 's', params.s);
  }

  /**
   * Add optional array parameters to query
   * @private
   */
  private addOptionalArrayParams(query: URLSearchParams, params: ComponentTreeRequest): void {
    this.appendOptionalArrayParam(query, 'additionalFields', params.additionalFields);
    this.appendOptionalArrayParam(query, 'qualifiers', params.qualifiers);
  }

  /**
   * Add optional scalar parameters to query
   * @private
   */
  private addOptionalScalarParams(query: URLSearchParams, params: ComponentTreeRequest): void {
    this.appendOptionalParam(query, 'asc', params.asc);
    this.appendOptionalParam(query, 'p', params.p);
    this.appendOptionalParam(query, 'ps', params.ps);
  }

  /**
   * Helper method to append optional string parameters
   * @private
   */
  private appendOptionalStringParam(
    params: URLSearchParams,
    key: string,
    value: string | undefined,
  ): void {
    if (value !== undefined) {
      params.append(key, value);
    }
  }

  /**
   * Helper method to append optional array parameters
   * @private
   */
  private appendOptionalArrayParam(
    params: URLSearchParams,
    key: string,
    value: string[] | undefined,
  ): void {
    if (value !== undefined && value.length > 0) {
      params.append(key, value.join(','));
    }
  }

  /**
   * Helper method to append optional parameters
   * @private
   */
  private appendOptionalParam(
    params: URLSearchParams,
    key: string,
    value: boolean | number | undefined,
  ): void {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  }
}
