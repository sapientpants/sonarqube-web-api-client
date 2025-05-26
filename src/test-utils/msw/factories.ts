/**
 * Factory functions for creating consistent mock responses
 * These help maintain realistic API response structures across tests
 */

export interface PagingInfo {
  pageIndex: number;
  pageSize: number;
  total: number;
}

export function createPagingInfo(overrides?: Partial<PagingInfo>): PagingInfo {
  return {
    pageIndex: 1,
    pageSize: 100,
    total: 0,
    ...overrides,
  };
}

export interface Project {
  key: string;
  name: string;
  qualifier?: string;
  visibility?: string;
}

export function createProject(overrides?: Partial<Project>): Project {
  return {
    key: 'default-project',
    name: 'Default Project',
    qualifier: 'TRK',
    visibility: 'public',
    ...overrides,
  };
}

export interface Issue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  type: string;
  status: string;
}

export function createIssue(overrides?: Partial<Issue>): Issue {
  return {
    key: 'issue-1',
    rule: 'typescript:S1234',
    severity: 'MAJOR',
    component: 'project:src/file.ts',
    line: 42,
    message: 'Fix this issue',
    type: 'BUG',
    status: 'OPEN',
    ...overrides,
  };
}

export interface AlmSetting {
  key: string;
  alm: string;
  url?: string;
}

export function createAlmSetting(overrides?: Partial<AlmSetting>): AlmSetting {
  return {
    key: 'github-1',
    alm: 'github',
    url: 'https://github.com',
    ...overrides,
  };
}

export interface ApiError {
  msg: string;
  code?: string;
}

export function createApiError(msg: string, code?: string): ApiError {
  const error: ApiError = { msg };
  if (code !== undefined) {
    error.code = code;
  }
  return error;
}

export function createProjectsResponse(
  projects: Project[],
  paging?: Partial<PagingInfo>
): { components: Project[]; paging: PagingInfo } {
  return {
    components: projects,
    paging: createPagingInfo(paging),
  };
}

export function createIssuesResponse(
  issues: Issue[],
  paging?: Partial<PagingInfo>
): { issues: Issue[]; paging: PagingInfo } {
  return {
    issues,
    paging: createPagingInfo(paging),
  };
}

export function createErrorResponse(errors: ApiError[]): { errors: ApiError[] } {
  return { errors };
}

// Metric-related factories

export interface MetricData {
  id: string;
  key: string;
  name: string;
  type: string;
  domain?: string;
  description?: string;
  direction?: number;
  qualitative?: boolean;
  hidden?: boolean;
  custom?: boolean;
  decimalScale?: number;
}

export function createMetric(overrides?: Partial<MetricData>): MetricData {
  return {
    id: '1',
    key: 'metric-key',
    name: 'Metric Name',
    type: 'INT',
    domain: 'General',
    description: 'Metric description',
    direction: 0,
    qualitative: false,
    hidden: false,
    custom: false,
    ...overrides,
  };
}

export const SAMPLE_METRICS = {
  coverage: createMetric({
    id: '1',
    key: 'coverage',
    name: 'Coverage',
    type: 'PERCENT',
    domain: 'Coverage',
    description: 'Coverage by unit tests',
    direction: 1,
    qualitative: true,
    hidden: false,
    custom: false,
    decimalScale: 1,
  }),
  lines: createMetric({
    id: '2',
    key: 'lines',
    name: 'Lines of Code',
    type: 'INT',
    domain: 'Size',
    description: 'Lines of code',
    direction: -1,
    qualitative: false,
    hidden: false,
    custom: false,
  }),
};

export const METRIC_TYPES = [
  'INT',
  'FLOAT',
  'PERCENT',
  'BOOL',
  'STRING',
  'LEVEL',
  'DATA',
  'DISTRIB',
  'RATING',
  'WORK_DUR',
] as const;

export const METRIC_DOMAINS = [
  'Issues',
  'Maintainability',
  'Reliability',
  'Size',
  'Complexity',
  'Coverage',
  'SCM',
  'Duplications',
  'SecurityReview',
  'Security',
  'General',
  'Documentation',
  'Releasability',
] as const;

export interface MetricsSearchResponse {
  metrics: MetricData[];
  total: number;
  p: number;
  ps: number;
}

export function createMetricsSearchResponse(
  metrics: MetricData[],
  paging?: { p?: number; ps?: number; total?: number }
): MetricsSearchResponse {
  return {
    metrics,
    total: paging?.total ?? metrics.length,
    p: paging?.p ?? 1,
    ps: paging?.ps ?? 50,
  };
}

export function createMetricTypesResponse(): { types: Array<(typeof METRIC_TYPES)[number]> } {
  return { types: [...METRIC_TYPES] };
}

export function createMetricDomainsResponse(): { domains: Array<(typeof METRIC_DOMAINS)[number]> } {
  return { domains: [...METRIC_DOMAINS] };
}
