import { BaseClient } from '../../core/BaseClient';
import type {
  ComponentMeasuresRequest,
  ComponentMeasuresResponse,
  ComponentTreeRequest,
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
      async (params: ComponentTreeRequest) => {
        const query = new URLSearchParams();

        if (params.component !== undefined) {
          query.append('component', params.component);
        }
        if (params.baseComponentId !== undefined) {
          query.append('baseComponentId', params.baseComponentId);
        }

        query.append('metricKeys', params.metricKeys.join(','));

        if (params.additionalFields !== undefined && params.additionalFields.length > 0) {
          query.append('additionalFields', params.additionalFields.join(','));
        }
        if (params.strategy !== undefined) {
          query.append('strategy', params.strategy);
        }
        if (params.qualifiers !== undefined && params.qualifiers.length > 0) {
          query.append('qualifiers', params.qualifiers.join(','));
        }
        if (params.branch !== undefined) {
          query.append('branch', params.branch);
        }
        if (params.pullRequest !== undefined) {
          query.append('pullRequest', params.pullRequest);
        }
        if (params.q !== undefined) {
          query.append('q', params.q);
        }
        if (params.metricSort !== undefined) {
          query.append('metricSort', params.metricSort);
        }
        if (params.metricSortFilter !== undefined) {
          query.append('metricSortFilter', params.metricSortFilter);
        }
        if (params.s !== undefined) {
          query.append('s', params.s);
        }
        if (params.asc !== undefined) {
          query.append('asc', params.asc.toString());
        }
        if (params.p !== undefined) {
          query.append('p', params.p.toString());
        }
        if (params.ps !== undefined) {
          query.append('ps', params.ps.toString());
        }

        return this.request(`/api/measures/component_tree?${query.toString()}`);
      },
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
}
