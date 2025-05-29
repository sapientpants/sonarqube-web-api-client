import { BaseClient } from '../../core/BaseClient';
import type {
  ComponentMeasuresRequest,
  ComponentMeasuresResponse,
  ComponentTreeRequest,
  ComponentTreeResponse,
  MeasuresHistoryRequest,
} from './types';
import { ComponentTreeBuilder, MeasuresHistoryBuilder } from './builders';

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
      metricKeys
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
        const query = new URLSearchParams();

        query.append('component', params.component);
        query.append('metrics', params.metrics.join(','));

        if (params.branch !== undefined) {
          query.append('branch', params.branch);
        }
        if (params.pullRequest !== undefined) {
          query.append('pullRequest', params.pullRequest);
        }
        if (params.from !== undefined) {
          query.append('from', params.from);
        }
        if (params.to !== undefined) {
          query.append('to', params.to);
        }
        if (params.p !== undefined) {
          query.append('p', params.p.toString());
        }
        if (params.ps !== undefined) {
          query.append('ps', params.ps.toString());
        }

        return this.request(`/api/measures/search_history?${query.toString()}`);
      },
      component,
      metrics
    );
  }

  /**
   * Executes component tree request with measures
   * @private
   */
  private async executeComponentTreeRequest(
    params: ComponentTreeRequest
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

    // Required parameters
    this.appendOptionalStringParam(query, 'component', params.component);
    this.appendOptionalStringParam(query, 'baseComponentId', params.baseComponentId);
    query.append('metricKeys', params.metricKeys.join(','));

    // Optional string parameters
    this.appendOptionalStringParam(query, 'strategy', params.strategy);
    this.appendOptionalStringParam(query, 'branch', params.branch);
    this.appendOptionalStringParam(query, 'pullRequest', params.pullRequest);
    this.appendOptionalStringParam(query, 'q', params.q);
    this.appendOptionalStringParam(query, 'metricSort', params.metricSort);
    this.appendOptionalStringParam(query, 'metricSortFilter', params.metricSortFilter);
    this.appendOptionalStringParam(query, 's', params.s);

    // Optional array parameters
    this.appendOptionalArrayParam(query, 'additionalFields', params.additionalFields);
    this.appendOptionalArrayParam(query, 'qualifiers', params.qualifiers);

    // Optional boolean and number parameters
    this.appendOptionalParam(query, 'asc', params.asc);
    this.appendOptionalParam(query, 'p', params.p);
    this.appendOptionalParam(query, 'ps', params.ps);

    return query;
  }

  /**
   * Helper method to append optional string parameters
   * @private
   */
  private appendOptionalStringParam(
    params: URLSearchParams,
    key: string,
    value: string | undefined
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
    value: string[] | undefined
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
    value: boolean | number | undefined
  ): void {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  }
}
