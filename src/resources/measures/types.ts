import type { PaginatedRequest, PaginatedResponse } from '../../core/builders/index.js';

/**
 * Additional fields that can be requested for measures
 */
export type MeasuresAdditionalField = 'metrics' | 'periods';

/**
 * Component tree search strategy
 */
export type ComponentTreeStrategy = 'children' | 'all' | 'leaves';

/**
 * Component qualifiers for filtering
 */
export type ComponentQualifier =
  | 'TRK' // Project
  | 'DIR' // Directory
  | 'FIL' // File
  | 'UTS' // Unit Test File
  | 'BRC' // Branch
  | 'APP' // Application
  | 'VW' // Portfolio
  | 'SVW' // SubPortfolio
  | 'DEV'; // Developer;

/**
 * Individual measure value
 */
export interface Measure {
  metric: string;
  value?: string;
  bestValue?: boolean;
  period?: {
    index: number;
    value: string;
    bestValue?: boolean;
  };
}

/**
 * Component with measures
 */
export interface ComponentMeasures {
  id: string;
  key: string;
  name: string;
  qualifier: ComponentQualifier;
  path?: string;
  language?: string;
  measures: Measure[];
}

/**
 * Metric definition
 */
export interface Metric {
  id: string;
  key: string;
  type: string;
  name: string;
  description?: string;
  domain?: string;
  direction?: number;
  qualitative?: boolean;
  hidden?: boolean;
  custom?: boolean;
}

/**
 * Period information
 */
export interface Period {
  index: number;
  mode: string;
  date: string;
  parameter?: string;
}

/**
 * Request parameters for component measures
 */
export interface ComponentMeasuresRequest {
  component?: string;
  componentId?: string;
  metricKeys: string[];
  additionalFields?: MeasuresAdditionalField[];
  branch?: string;
  pullRequest?: string;
}

/**
 * Response for component measures
 */
export interface ComponentMeasuresResponse {
  component: ComponentMeasures;
  metrics?: Metric[];
  periods?: Period[];
}

/**
 * Request parameters for component tree search
 */
export interface ComponentTreeRequest extends PaginatedRequest {
  component?: string;
  baseComponentId?: string;
  metricKeys: string[];
  additionalFields?: MeasuresAdditionalField[];
  strategy?: ComponentTreeStrategy;
  qualifiers?: ComponentQualifier[];
  branch?: string;
  pullRequest?: string;
  q?: string; // Query filter
  metricSort?: string;
  metricSortFilter?: 'all' | 'withMeasuresOnly';
  s?: string; // Sort field
  asc?: boolean;
}

/**
 * Response for component tree search
 */
export interface ComponentTreeResponse extends PaginatedResponse {
  baseComponent: ComponentMeasures;
  components: ComponentMeasures[];
  metrics?: Metric[];
  periods?: Period[];
}

/**
 * Historical measure point
 */
export interface HistoricalMeasure {
  date: string;
  value: string;
}

/**
 * Component measures history
 */
export interface ComponentMeasuresHistory {
  metric: string;
  history: HistoricalMeasure[];
}

/**
 * Request parameters for measures history search
 */
export interface MeasuresHistoryRequest extends PaginatedRequest {
  component: string;
  metrics: string[];
  branch?: string;
  pullRequest?: string;
  from?: string; // Date in YYYY-MM-DD format
  to?: string; // Date in YYYY-MM-DD format
}

/**
 * Response for measures history search
 */
export interface MeasuresHistoryResponse extends PaginatedResponse {
  measures: ComponentMeasuresHistory[];
}
