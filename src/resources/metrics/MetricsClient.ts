import { BaseClient } from '../../core/BaseClient.js';
import { DeprecationManager } from '../../core/deprecation/index.js';
import type {
  SearchMetricsParams,
  SearchMetricsResponse,
  MetricTypesResponse,
  MetricDomainsResponse,
  Metric,
} from './types.js';

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
    this.validatePageSize(params?.ps);
    const searchParams = this.buildSearchParams(params);
    const query = searchParams.toString();
    return await this.request<SearchMetricsResponse>(
      query ? `/api/metrics/search?${query}` : '/api/metrics/search',
    );
  }

  /**
   * Validate page size parameter
   * @private
   */
  private validatePageSize(pageSize: number | undefined): void {
    if (pageSize !== undefined && (pageSize < 1 || pageSize > 500)) {
      throw new Error('Page size must be between 1 and 500');
    }
  }

  /**
   * Build search parameters
   * @private
   */
  private buildSearchParams(params?: SearchMetricsParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    this.appendFieldsParam(searchParams, params?.f);
    this.appendBooleanParam(searchParams, 'isCustom', params?.isCustom);
    this.appendNumberParam(searchParams, 'p', params?.p);
    this.appendNumberParam(searchParams, 'ps', params?.ps);

    return searchParams;
  }

  /**
   * Append fields parameter
   * @private
   */
  private appendFieldsParam(
    searchParams: URLSearchParams,
    fields: string | string[] | undefined,
  ): void {
    if (fields !== undefined) {
      searchParams.append('f', Array.isArray(fields) ? fields.join(',') : fields);
    }
  }

  /**
   * Append boolean parameter
   * @private
   */
  private appendBooleanParam(
    searchParams: URLSearchParams,
    key: string,
    value: boolean | undefined,
  ): void {
    this.appendScalarParam(searchParams, key, value);
  }

  /**
   * Append number parameter
   * @private
   */
  private appendNumberParam(
    searchParams: URLSearchParams,
    key: string,
    value: number | undefined,
  ): void {
    this.appendScalarParam(searchParams, key, value);
  }

  /**
   * Append scalar parameter (number or boolean)
   * @private
   */
  private appendScalarParam(
    searchParams: URLSearchParams,
    key: string,
    value: number | boolean | undefined,
  ): void {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
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
    params?: Omit<SearchMetricsParams, 'p' | 'ps'>,
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

  async domains(): Promise<MetricDomainsResponse> {
    DeprecationManager.warn({
      api: 'metrics.domains()',
      removeVersion: '7.7',
      reason: 'This endpoint has been deprecated and will be removed.',
    });

    return await this.request<MetricDomainsResponse>('/api/metrics/domains');
  }
}
