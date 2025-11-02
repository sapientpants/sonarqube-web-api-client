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
  project: string;
  line?: number;
  message: string;
  type: string;
  status: string;
  assignee?: string;
  author?: string;
  tags: string[];
  creationDate: string;
  updateDate: string;
  closeDate?: string;
  resolution?: string;
  transitions?: string[];
  actions?: string[];
  branch?: string;
  pullRequestId?: string;
  comments?: Array<{
    key: string;
    login: string;
    htmlText: string;
    markdown: string;
    updatable: boolean;
    createdAt: string;
  }>;
}

export function createIssue(overrides?: Partial<Issue>): Issue {
  return {
    key: 'issue-1',
    rule: 'typescript:S1234',
    severity: 'MAJOR',
    component: 'project:src/file.ts',
    project: 'project',
    line: 42,
    message: 'Fix this issue',
    type: 'BUG',
    status: 'OPEN',
    tags: [],
    creationDate: '2024-01-01T00:00:00+0000',
    updateDate: '2024-01-01T00:00:00+0000',
    transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
    actions: ['assign', 'set_tags', 'comment'],
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
  paging?: Partial<PagingInfo>,
): { components: Project[]; paging: PagingInfo } {
  return {
    components: projects,
    paging: createPagingInfo(paging),
  };
}

export function createIssuesResponse(
  issues: Issue[],
  paging?: Partial<PagingInfo>,
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

export function createMetricsSearchResponse(
  metrics: MetricData[],
  paging?: Partial<PagingInfo>,
): { metrics: MetricData[]; total: number; p: number; ps: number } {
  const pagingInfo = createPagingInfo(paging);
  return {
    metrics,
    total: pagingInfo.total,
    p: pagingInfo.pageIndex,
    ps: pagingInfo.pageSize,
  };
}

export function createMetricTypesResponse(): { types: string[] } {
  return {
    types: ['INT', 'FLOAT', 'PERCENT', 'BOOL', 'STRING', 'MILLISEC', 'DATA', 'LEVEL', 'DISTRIB'],
  };
}

export function createMetricDomainsResponse(): { domains: string[] } {
  return {
    domains: [
      'Complexity',
      'Coverage',
      'Design',
      'Documentation',
      'Duplications',
      'Issues',
      'Maintainability',
      'Management',
      'Reliability',
      'Security',
      'SecurityReview',
      'Size',
      'Tests',
    ],
  };
}

// Hotspots-related factories

export interface Hotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: string;
  resolution?: string;
  line?: number;
  hash?: string;
  message: string;
  assignee?: string;
  author?: string;
  creationDate: string;
  updateDate: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
  rule?: {
    key: string;
    name: string;
    securityCategory: string;
    vulnerabilityProbability: string;
  };
}

export function createHotspot(overrides?: Partial<Hotspot>): Hotspot {
  return {
    key: 'hotspot-1',
    component: 'project:src/main/java/com/example/App.java',
    project: 'project',
    securityCategory: 'sql-injection',
    vulnerabilityProbability: 'HIGH',
    status: 'TO_REVIEW',
    line: 42,
    hash: 'abc123def456',
    message: 'Make sure that this SQL query is not vulnerable to injection attacks.',
    author: 'john.doe',
    creationDate: '2024-01-01T00:00:00+0000',
    updateDate: '2024-01-01T00:00:00+0000',
    textRange: {
      startLine: 42,
      endLine: 42,
      startOffset: 10,
      endOffset: 50,
    },
    rule: {
      key: 'java:S2077',
      name: 'SQL injection vulnerabilities should not be ignored',
      securityCategory: 'sql-injection',
      vulnerabilityProbability: 'HIGH',
    },
    ...overrides,
  };
}

export interface HotspotDetails {
  key: string;
  component: {
    key: string;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  };
  project: {
    key: string;
    name: string;
    longName: string;
  };
  securityCategory: string;
  vulnerabilityProbability: string;
  status: string;
  resolution?: string;
  line?: number;
  hash?: string;
  message: string;
  creationDate: string;
  updateDate: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
  rule: {
    key: string;
    name: string;
    securityCategory: string;
    vulnerabilityProbability: string;
    riskDescription?: string;
    vulnerabilityDescription?: string;
    fixRecommendations?: string;
  };
  assignee?: {
    login: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  author?: {
    login: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  comment?: Array<{
    key: string;
    login: string;
    htmlText: string;
    markdown: string;
    updatable: boolean;
    createdAt: string;
    updatedAt?: string;
  }>;
}

export function createHotspotDetails(overrides?: Partial<HotspotDetails>): HotspotDetails {
  return {
    key: 'hotspot-1',
    component: {
      key: 'project:src/main/java/com/example/App.java',
      qualifier: 'FIL',
      name: 'App.java',
      longName: 'src/main/java/com/example/App.java',
      path: 'src/main/java/com/example/App.java',
    },
    project: {
      key: 'project',
      name: 'My Project',
      longName: 'My Project',
    },
    securityCategory: 'sql-injection',
    vulnerabilityProbability: 'HIGH',
    status: 'TO_REVIEW',
    line: 42,
    hash: 'abc123def456',
    message: 'Make sure that this SQL query is not vulnerable to injection attacks.',
    creationDate: '2024-01-01T00:00:00+0000',
    updateDate: '2024-01-01T00:00:00+0000',
    textRange: {
      startLine: 42,
      endLine: 42,
      startOffset: 10,
      endOffset: 50,
    },
    rule: {
      key: 'java:S2077',
      name: 'SQL injection vulnerabilities should not be ignored',
      securityCategory: 'sql-injection',
      vulnerabilityProbability: 'HIGH',
      riskDescription:
        'SQL injection is a vulnerability that allows an attacker to alter SQL queries.',
      vulnerabilityDescription:
        'The software constructs all or part of an SQL command using externally-influenced input.',
      fixRecommendations: 'Use parameterized queries to prevent SQL injection.',
    },
    author: {
      login: 'john.doe',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    ...overrides,
  };
}

export function createHotspotsResponse(
  hotspots: Hotspot[],
  paging?: Partial<PagingInfo>,
): {
  hotspots: Hotspot[];
  paging: PagingInfo;
  components?: Array<{
    key: string;
    qualifier: string;
    name: string;
    longName: string;
    path?: string;
  }>;
} {
  return {
    hotspots,
    paging: createPagingInfo(paging),
    components: hotspots.map((h) => ({
      key: h.component,
      qualifier: 'FIL',
      name: h.component.split('/').pop() ?? h.component,
      longName: h.component.replace('project:', ''),
      path: h.component.replace('project:', ''),
    })),
  };
}
