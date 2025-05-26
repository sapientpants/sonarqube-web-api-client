import { BaseClient } from '../../core/BaseClient';
import type {
  SearchMetricsParams,
  SearchMetricsResponse,
  MetricTypesResponse,
  MetricDomainsResponse,
  Metric,
} from './types';

/**
 * Client for interacting with SonarQube metrics endpoints
 * @since 5.2
 */
export class MetricsClient extends BaseClient {
  /**
   * Search for metrics
   * @since 5.2
   * @param params - Search parameters
   * @returns Paginated list of metrics
   *
   * @example
   * ```typescript
   * const client = new MetricsClient(config);
   * const metrics = await client.search({ ps: 50, isCustom: false });
   * ```
   */
  async search(params?: SearchMetricsParams): Promise<SearchMetricsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.f) {
      searchParams.append('f', params.f.join(','));
    }
    if (params?.isCustom !== undefined) {
      searchParams.append('isCustom', String(params.isCustom));
    }
    if (params?.p !== undefined) {
      searchParams.append('p', String(params.p));
    }
    if (params?.ps !== undefined) {
      searchParams.append('ps', String(params.ps));
    }

    const query = searchParams.toString();
    return await this.request<SearchMetricsResponse>(
      query ? `/api/metrics/search?${query}` : '/api/metrics/search'
    );
  }

  /**
   * Search for all metrics using async iteration
   * @since 5.2
   * @param params - Search parameters (page parameters will be handled automatically)
   * @returns Async iterator of metrics
   *
   * @example
   * ```typescript
   * const client = new MetricsClient(config);
   * for await (const metric of client.searchAll({ isCustom: false })) {
   *   console.log(metric.key, metric.name);
   * }
   * ```
   */
  async *searchAll(
    params?: Omit<SearchMetricsParams, 'p' | 'ps'>
  ): AsyncGenerator<Metric, void, unknown> {
    let page = 1;
    const pageSize = 500; // Max allowed page size
    let hasMore = true;

    while (hasMore) {
      const response = await this.search({
        ...params,
        p: page,
        ps: pageSize,
      });

      for (const metric of response.metrics) {
        yield metric;
      }

      // Check if we've fetched all metrics
      hasMore = page * pageSize < response.total;
      page++;
    }
  }

  /**
   * List all available metric types
   * @since 5.2
   * @returns List of metric types
   *
   * @example
   * ```typescript
   * const client = new MetricsClient(config);
   * const types = await client.types();
   * console.log(types.types); // ['INT', 'FLOAT', 'PERCENT', ...]
   * ```
   */
  async types(): Promise<MetricTypesResponse> {
    return await this.request<MetricTypesResponse>('/api/metrics/types');
  }

  /**
   * List all custom metric domains
   * @deprecated since 7.7
   * @returns List of metric domains
   *
   * @example
   * ```typescript
   * const client = new MetricsClient(config);
   * const domains = await client.domains();
   * console.log(domains.domains); // ['Issues', 'Maintainability', ...]
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  async domains(): Promise<MetricDomainsResponse> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return await this.request<MetricDomainsResponse>('/api/metrics/domains');
  }
}
