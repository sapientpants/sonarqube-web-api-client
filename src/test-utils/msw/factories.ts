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
