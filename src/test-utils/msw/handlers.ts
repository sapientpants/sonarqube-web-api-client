import { http, HttpResponse } from 'msw';
import {
  SAMPLE_METRICS,
  createMetricsSearchResponse,
  createMetricTypesResponse,
  createMetricDomainsResponse,
} from './factories';

/**
 * Default MSW request handlers for common scenarios.
 * These handlers can be overridden in individual tests using server.use()
 *
 * Handler evaluation order:
 * 1. Handlers are evaluated in the order they appear in this array
 * 2. The first handler that returns a response wins
 * 3. Handlers returning undefined pass through to the next handler
 * 4. All http.all handlers for '/api/' routes check specific conditions before responding
 * 5. Specific endpoint handlers (http.get) are placed after conditional handlers
 *
 * This allows tests to simulate various error conditions (auth, rate limit, network)
 * while still providing default responses for common endpoints.
 */
export const handlers = [
  // Authentication error handler - returns 401 for any request with invalid token
  http.all('*/api/*', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer invalid-token') {
      return new HttpResponse(null, {
        status: 401,
        statusText: 'Unauthorized',
      });
    }
    // Let request pass through if not matching invalid token
    return undefined;
  }),

  // Rate limiting handler - returns 429 when specific header is present
  http.all('*/api/*', ({ request }) => {
    if (request.headers.get('X-Test-Rate-Limit') === 'true') {
      return new HttpResponse(
        JSON.stringify({
          errors: [{ msg: 'Rate limit exceeded' }],
        }),
        {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '60',
            'content-type': 'application/json',
          },
        }
      );
    }
    return undefined;
  }),

  // Server error handler - returns 500 when specific header is present
  http.all('*/api/*', ({ request }) => {
    if (request.headers.get('X-Test-Server-Error') === 'true') {
      return new HttpResponse(
        JSON.stringify({
          errors: [{ msg: 'Internal server error' }],
        }),
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }
    return undefined;
  }),

  // Network error handler - simulates network failure
  http.all('*/api/*', ({ request }) => {
    if (request.headers.get('X-Test-Network-Error') === 'true') {
      return HttpResponse.error();
    }
    return undefined;
  }),

  // Default handlers for common endpoints
  http.get('*/api/projects/search', () => {
    return HttpResponse.json({
      components: [],
      paging: {
        pageIndex: 1,
        pageSize: 100,
        total: 0,
      },
    });
  }),

  http.post('*/api/projects/bulk_update_key', async ({ request }) => {
    const body = (await request.json()) as {
      project: string;
      from: string;
      to: string;
      dryRun?: string;
    };
    return HttpResponse.json({
      keys: [
        {
          key: body.project,
          newKey: body.project.replace(body.from, body.to),
          duplicate: false,
        },
      ],
    });
  }),

  // Issues endpoints
  http.get('*/api/issues/search', ({ request }) => {
    const url = new URL(request.url);
    const componentKeys = url.searchParams.get('componentKeys');
    const projectKeys = url.searchParams.get('projects');
    const branch = url.searchParams.get('branch');
    const pullRequest = url.searchParams.get('pullRequest');
    const pageSize = Number(url.searchParams.get('ps')) || 100;
    const page = Number(url.searchParams.get('p')) || 1;

    // Simulate some default issues for testing with branch/PR context
    const allIssues = [
      {
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
        branch: 'main',
      },
      {
        key: 'issue-2',
        rule: 'typescript:S5678',
        severity: 'CRITICAL',
        component: 'project:src/other.ts',
        project: 'project',
        line: 84,
        message: 'Critical security issue',
        type: 'VULNERABILITY',
        status: 'OPEN',
        tags: ['security'],
        assignee: 'john.doe',
        creationDate: '2024-01-02T00:00:00+0000',
        updateDate: '2024-01-02T00:00:00+0000',
        transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
        actions: ['assign', 'set_tags', 'comment'],
        branch: 'feature/new-feature',
      },
      {
        key: 'issue-3',
        rule: 'typescript:S9999',
        severity: 'MINOR',
        component: 'project:src/pr-file.ts',
        project: 'project',
        line: 30,
        message: 'PR-specific issue',
        type: 'CODE_SMELL',
        status: 'OPEN',
        tags: [],
        creationDate: '2024-01-03T00:00:00+0000',
        updateDate: '2024-01-03T00:00:00+0000',
        transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
        actions: ['assign', 'set_tags', 'comment'],
        pullRequestId: '123',
      },
    ];

    // Filter issues based on multiple criteria (all work together with AND logic)
    let filteredIssues = allIssues;

    // Apply project filter if provided
    if (projectKeys !== null) {
      filteredIssues = filteredIssues.filter((issue) =>
        projectKeys.split(',').includes(issue.project)
      );
    }

    // Apply component filter if provided
    if (componentKeys !== null) {
      filteredIssues = filteredIssues.filter((issue) =>
        componentKeys.split(',').some((key) => issue.component.includes(key))
      );
    }

    // Apply branch filter if provided
    if (branch !== null) {
      filteredIssues = filteredIssues.filter((issue) => issue.branch === branch);
    }

    // Apply pull request filter if provided
    if (pullRequest !== null) {
      filteredIssues = filteredIssues.filter((issue) => issue.pullRequestId === pullRequest);
    }

    // Handle pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

    return HttpResponse.json({
      issues: paginatedIssues,
      paging: {
        pageIndex: page,
        pageSize,
        total: filteredIssues.length,
      },
      components: [
        { key: 'project', name: 'Test Project', qualifier: 'TRK' },
        { key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL', path: 'src/file.ts' },
        { key: 'project:src/other.ts', name: 'other.ts', qualifier: 'FIL', path: 'src/other.ts' },
      ],
      rules: [
        {
          key: 'typescript:S1234',
          name: 'Bug Rule',
          status: 'READY',
          lang: 'ts',
          langName: 'TypeScript',
        },
        {
          key: 'typescript:S5678',
          name: 'Security Rule',
          status: 'READY',
          lang: 'ts',
          langName: 'TypeScript',
        },
      ],
      users: [{ login: 'john.doe', name: 'John Doe', active: true }],
    });
  }),

  http.post('*/api/issues/add_comment', async ({ request }) => {
    const body = (await request.json()) as { issue: string; text: string; isFeedback?: boolean };

    const issue = {
      key: body.issue,
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
      updateDate: new Date().toISOString(),
      transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
      actions: ['assign', 'set_tags', 'comment'],
      comments: [
        {
          key: 'comment-1',
          login: 'john.doe',
          htmlText: `<p>${body.text}</p>`,
          markdown: body.text,
          updatable: true,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return HttpResponse.json({
      issue,
      users: [{ login: 'john.doe', name: 'John Doe', active: true }],
      components: [{ key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL' }],
      rules: [{ key: 'typescript:S1234', name: 'Bug Rule', status: 'READY' }],
    });
  }),

  http.post('*/api/issues/assign', async ({ request }) => {
    const body = (await request.json()) as { issue: string; assignee?: string };

    const issue = {
      key: body.issue,
      rule: 'typescript:S1234',
      severity: 'MAJOR',
      component: 'project:src/file.ts',
      project: 'project',
      assignee: body.assignee,
      line: 42,
      message: 'Fix this issue',
      type: 'BUG',
      status: 'OPEN',
      tags: [],
      creationDate: '2024-01-01T00:00:00+0000',
      updateDate: new Date().toISOString(),
      transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
      actions: ['assign', 'set_tags', 'comment'],
    };

    return HttpResponse.json({
      issue,
      users: [{ login: 'john.doe', name: 'John Doe', active: true }],
      components: [{ key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL' }],
      rules: [{ key: 'typescript:S1234', name: 'Bug Rule', status: 'READY' }],
    });
  }),

  http.post('*/api/issues/do_transition', async ({ request }) => {
    const body = (await request.json()) as { issue: string; transition: string };

    const statusMap: Record<string, string> = {
      confirm: 'CONFIRMED',
      resolve: 'RESOLVED',
      reopen: 'REOPENED',
      falsepositive: 'RESOLVED',
      wontfix: 'RESOLVED',
      close: 'CLOSED',
    };

    const resolutionMap: Record<string, string> = {
      falsepositive: 'FALSE-POSITIVE',
      wontfix: 'WONTFIX',
      resolve: 'FIXED',
    };

    const issue = {
      key: body.issue,
      rule: 'typescript:S1234',
      severity: 'MAJOR',
      component: 'project:src/file.ts',
      project: 'project',
      line: 42,
      message: 'Fix this issue',
      type: 'BUG',
      status: statusMap[body.transition] ?? 'OPEN',
      resolution: resolutionMap[body.transition],
      tags: [],
      creationDate: '2024-01-01T00:00:00+0000',
      updateDate: new Date().toISOString(),
      transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
      actions: ['assign', 'set_tags', 'comment'],
    };

    return HttpResponse.json({
      issue,
      users: [],
      components: [{ key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL' }],
      rules: [{ key: 'typescript:S1234', name: 'Bug Rule', status: 'READY' }],
    });
  }),

  http.post('*/api/issues/set_tags', async ({ request }) => {
    const body = (await request.json()) as { issue: string; tags: string };

    const issue = {
      key: body.issue,
      rule: 'typescript:S1234',
      severity: 'MAJOR',
      component: 'project:src/file.ts',
      project: 'project',
      line: 42,
      message: 'Fix this issue',
      type: 'BUG',
      status: 'OPEN',
      tags: body.tags ? body.tags.split(',').map((tag) => tag.trim()) : [],
      creationDate: '2024-01-01T00:00:00+0000',
      updateDate: new Date().toISOString(),
      transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
      actions: ['assign', 'set_tags', 'comment'],
    };

    return HttpResponse.json({
      issue,
      users: [],
      components: [{ key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL' }],
      rules: [{ key: 'typescript:S1234', name: 'Bug Rule', status: 'READY' }],
    });
  }),

  // ALM Integrations endpoints
  http.get('*/api/alm_integrations/list_bitbucketserver_projects', () => {
    return HttpResponse.json({
      projects: [
        { key: 'PROJ1', name: 'Project 1', id: 1 },
        { key: 'PROJ2', name: 'Project 2', id: 2 },
      ],
      isLastPage: true,
    });
  }),

  http.get('*/api/alm_integrations/search_bitbucketserver_repos', () => {
    return HttpResponse.json({
      repositories: [
        {
          id: 1,
          name: 'Repository 1',
          slug: 'repo1',
          projectKey: 'PROJ1',
          links: {
            clone: [{ href: 'https://bitbucket.example.com/scm/proj1/repo1.git', name: 'http' }],
          },
        },
      ],
      isLastPage: true,
    });
  }),

  http.get('*/api/alm_integrations/search_bitbucketcloud_repos', () => {
    return HttpResponse.json({
      repositories: [
        {
          uuid: '{uuid-1}',
          name: 'Repository 1',
          slug: 'repo1',
          projectKey: 'PROJ1',
          workspace: 'my-workspace',
        },
      ],
      paging: { pageIndex: 1, pageSize: 10, total: 1 },
    });
  }),

  // Metrics endpoints
  http.get('*/api/metrics/search', () => {
    return HttpResponse.json(
      createMetricsSearchResponse([SAMPLE_METRICS.coverage, SAMPLE_METRICS.lines])
    );
  }),

  http.get('*/api/metrics/types', () => {
    return HttpResponse.json(createMetricTypesResponse());
  }),

  http.get('*/api/metrics/domains', () => {
    return HttpResponse.json(createMetricDomainsResponse());
  }),

  // Components endpoints
  http.get('*/api/components/show', ({ request }) => {
    const url = new URL(request.url);
    const component = url.searchParams.get('component');
    const _branch = url.searchParams.get('branch');
    const _pullRequest = url.searchParams.get('pullRequest');

    // Return a mock component based on the requested component key
    if (component === 'my_project') {
      return HttpResponse.json({
        component: {
          key: 'my_project',
          name: 'My Project',
          qualifier: 'TRK',
          path: '',
          description: 'A test project',
          visibility: 'public',
        },
        ancestors: [],
      });
    }

    if (component === 'my_project:src/main.ts') {
      return HttpResponse.json({
        component: {
          key: 'my_project:src/main.ts',
          name: 'main.ts',
          qualifier: 'FIL',
          path: 'src/main.ts',
          language: 'ts',
        },
        ancestors: [
          {
            key: 'my_project:src',
            name: 'src',
            qualifier: 'DIR',
            path: 'src',
          },
          {
            key: 'my_project',
            name: 'My Project',
            qualifier: 'TRK',
            path: '',
          },
        ],
      });
    }

    // Default response
    return HttpResponse.json({
      component: {
        key: component ?? 'default_project',
        name: 'Default Project',
        qualifier: 'TRK',
        path: '',
      },
      ancestors: [],
    });
  }),

  http.get('*/api/components/search', ({ request }) => {
    const url = new URL(request.url);
    const _organization = url.searchParams.get('organization');
    const q = url.searchParams.get('q');
    const p = parseInt(url.searchParams.get('p') ?? '1', 10);
    const ps = parseInt(url.searchParams.get('ps') ?? '100', 10);

    // Mock search results
    let components = [
      {
        key: 'project1',
        name: 'Project 1',
        qualifier: 'TRK',
      },
      {
        key: 'project2',
        name: 'Project 2',
        qualifier: 'TRK',
      },
      {
        key: 'sonar-project',
        name: 'SonarQube Project',
        qualifier: 'TRK',
      },
    ];

    // Filter by query if provided
    if (q !== null && q !== '') {
      components = components.filter(
        (comp) =>
          comp.name.toLowerCase().includes(q.toLowerCase()) ||
          comp.key.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Handle pagination
    const startIndex = (p - 1) * ps;
    const endIndex = startIndex + ps;
    const paginatedComponents = components.slice(startIndex, endIndex);

    return HttpResponse.json({
      components: paginatedComponents,
      paging: {
        pageIndex: p,
        pageSize: ps,
        total: components.length,
      },
    });
  }),

  http.get('*/api/components/tree', ({ request }) => {
    const url = new URL(request.url);
    const component = url.searchParams.get('component');
    const _branch = url.searchParams.get('branch');
    const _pullRequest = url.searchParams.get('pullRequest');
    const q = url.searchParams.get('q');
    const qualifiers = url.searchParams.get('qualifiers');
    const _strategy = url.searchParams.get('strategy') ?? 'all';
    const s = url.searchParams.get('s') ?? 'name';
    const asc = url.searchParams.get('asc') !== 'false';
    const p = parseInt(url.searchParams.get('p') ?? '1', 10);
    const ps = parseInt(url.searchParams.get('ps') ?? '100', 10);

    // Mock tree components
    let components = [
      {
        key: 'my_project:src',
        name: 'src',
        qualifier: 'DIR',
        path: 'src',
      },
      {
        key: 'my_project:src/main.ts',
        name: 'main.ts',
        qualifier: 'FIL',
        path: 'src/main.ts',
        language: 'ts',
      },
      {
        key: 'my_project:src/UserController.ts',
        name: 'UserController.ts',
        qualifier: 'FIL',
        path: 'src/UserController.ts',
        language: 'ts',
      },
      {
        key: 'my_project:test',
        name: 'test',
        qualifier: 'DIR',
        path: 'test',
      },
      {
        key: 'my_project:test/main.test.ts',
        name: 'main.test.ts',
        qualifier: 'UTS',
        path: 'test/main.test.ts',
        language: 'ts',
      },
    ];

    // Filter by query if provided
    if (q !== null && q !== '') {
      components = components.filter(
        (comp) =>
          comp.name.toLowerCase().includes(q.toLowerCase()) ||
          comp.key.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Filter by qualifiers if provided
    if (qualifiers !== null && qualifiers !== '') {
      const qualifierList = qualifiers.split(',');
      components = components.filter((comp) => qualifierList.includes(comp.qualifier));
    }

    // Sort components
    components.sort((a, b) => {
      let result = 0;
      if (s === 'name') {
        result = a.name.localeCompare(b.name);
      } else if (s === 'path') {
        result = (a.path || '').localeCompare(b.path || '');
      } else if (s === 'qualifier') {
        result = a.qualifier.localeCompare(b.qualifier);
      }
      return asc ? result : -result;
    });

    // Handle pagination
    const startIndex = (p - 1) * ps;
    const endIndex = startIndex + ps;
    const paginatedComponents = components.slice(startIndex, endIndex);

    return HttpResponse.json({
      baseComponent: {
        key: component ?? 'my_project',
        name: 'My Project',
        qualifier: 'TRK',
        path: '',
      },
      components: paginatedComponents,
      paging: {
        pageIndex: p,
        pageSize: ps,
        total: components.length,
      },
    });
  }),
];
