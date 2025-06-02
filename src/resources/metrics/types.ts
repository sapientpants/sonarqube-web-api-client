/**
 * SonarQube metric domain values
 */
export type MetricDomain =
  | 'Complexity'
  | 'Coverage'
  | 'Documentation'
  | 'Duplications'
  | 'General'
  | 'Issues'
  | 'Maintainability'
  | 'Releasability'
  | 'Reliability'
  | 'SCM'
  | 'Security'
  | 'SecurityReview'
  | 'Size';

/**
 * SonarQube metric types
 */
export type MetricType =
  | 'INT'
  | 'FLOAT'
  | 'PERCENT'
  | 'BOOL'
  | 'STRING'
  | 'MILLISEC'
  | 'DATA'
  | 'LEVEL'
  | 'DISTRIB'
  | 'RATING'
  | 'WORK_DUR';

/**
 * SonarQube metric value types
 */
export type MetricValueType =
  | 'INT'
  | 'FLOAT'
  | 'PERCENT'
  | 'BOOL'
  | 'STRING'
  | 'LEVEL'
  | 'DATA'
  | 'DISTRIB'
  | 'RATING'
  | 'WORK_DUR';

/**
 * SonarQube metric direction
 */
export type MetricDirection = -1 | 0 | 1;

/**
 * Represents a SonarQube metric
 */
export interface Metric {
  /**
   * Metric ID
   */
  id: string;

  /**
   * Metric key
   */
  key: string;

  /**
   * Metric name
   */
  name: string;

  /**
   * Metric type
   */
  type: MetricType;

  /**
   * Metric description
   */
  description?: string;

  /**
   * Metric domain
   */
  domain?: MetricDomain;

  /**
   * Direction: -1 for decreasing, 0 for none, 1 for increasing
   */
  direction?: MetricDirection;

  /**
   * Whether the metric is qualitative
   */
  qualitative?: boolean;

  /**
   * Whether the metric is hidden
   */
  hidden?: boolean;

  /**
   * Whether the metric is custom
   */
  custom?: boolean;

  /**
   * Decimal scale for the metric
   */
  decimalScale?: number;
}

/**
 * Parameters for searching metrics
 */
export interface SearchMetricsParams {
  /**
   * Comma-separated list of the fields to be returned in response.
   * All the fields are returned by default.
   * Can be a string (comma-separated) or an array of strings.
   */
  f?: string[] | string;

  /**
   * Filter on custom metrics or not
   */
  isCustom?: boolean;

  /**
   * 1-based page number
   */
  p?: number;

  /**
   * Page size. Must be greater than 0 and less or equal than 500
   */
  ps?: number;
}

/**
 * Response from the metrics search endpoint
 */
export interface SearchMetricsResponse {
  /**
   * List of metrics
   */
  metrics: Metric[];

  /**
   * Total number of metrics
   */
  total: number;

  /**
   * Current page number (1-based)
   */
  p: number;

  /**
   * Page size
   */
  ps: number;
}

/**
 * Response from the metrics types endpoint
 */
export interface MetricTypesResponse {
  /**
   * List of available metric types
   */
  types: MetricValueType[];
}

/**
 * Response from the metrics domains endpoint
 * @deprecated since 7.7
 */
export interface MetricDomainsResponse {
  /**
   * List of metric domains
   */
  domains: string[];
}
