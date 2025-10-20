import { http, HttpResponse } from 'msw';
import {
  SAMPLE_METRICS,
  createMetricsSearchResponse,
  createMetricTypesResponse,
  createMetricDomainsResponse,
  createHotspot,
  createHotspotDetails,
  createHotspotsResponse,
} from './factories.js';

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
        },
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
        },
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
        projectKeys.split(',').includes(issue.project),
      );
    }

    // Apply component filter if provided
    if (componentKeys !== null) {
      filteredIssues = filteredIssues.filter((issue) =>
        componentKeys.split(',').some((key) => issue.component.includes(key)),
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

  http.get('*/api/issues/authors', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    const allAuthors = ['john.doe', 'john.smith', 'jane.doe', 'alice.developer', 'bob.tester'];

    let filteredAuthors = allAuthors;
    if (query !== null && query !== '') {
      filteredAuthors = allAuthors.filter((author) =>
        author.toLowerCase().includes(query.toLowerCase()),
      );
    }

    return HttpResponse.json({
      authors: filteredAuthors,
    });
  }),

  http.post('*/api/issues/bulk_change', async ({ request }) => {
    const body = await request.formData();
    const issuesParam = body.get('issues');
    const issues = typeof issuesParam === 'string' ? issuesParam.split(',') : [];

    const updatedIssues = issues.map((issueKey, index) => {
      const setSeverityParam = body.get('set_severity');
      const setTypeParam = body.get('set_type');
      const addTagsParam = body.get('add_tags');
      const assignParam = body.get('assign');

      return {
        key: issueKey,
        rule: 'typescript:S1234',
        severity: typeof setSeverityParam === 'string' ? setSeverityParam : 'MAJOR',
        component: `project:src/file${String(index + 1)}.ts`,
        project: 'project',
        line: 42 + index,
        message: `Updated issue ${String(index + 1)}`,
        type: typeof setTypeParam === 'string' ? setTypeParam : 'BUG',
        status: 'OPEN',
        tags: typeof addTagsParam === 'string' ? addTagsParam.split(',') : [],
        assignee: typeof assignParam === 'string' ? assignParam : undefined,
        creationDate: '2024-01-01T00:00:00+0000',
        updateDate: new Date().toISOString(),
        transitions: ['confirm', 'resolve', 'falsepositive', 'wontfix'],
        actions: ['assign', 'set_tags', 'comment'],
      };
    });

    return HttpResponse.json({
      total: issues.length,
      success: issues.length,
      ignored: 0,
      failures: 0,
      issues: updatedIssues,
    });
  }),

  http.get('*/api/issues/changelog', ({ request }) => {
    const url = new URL(request.url);
    const _issueKey = url.searchParams.get('issue');

    return HttpResponse.json({
      changelog: [
        {
          user: 'john.doe',
          userName: 'John Doe',
          creationDate: '2024-01-01T00:00:00+0000',
          diffs: [
            {
              key: 'status',
              oldValue: 'OPEN',
              newValue: 'CONFIRMED',
            },
            {
              key: 'assignee',
              oldValue: '',
              newValue: 'john.doe',
            },
          ],
        },
        {
          user: 'jane.doe',
          userName: 'Jane Doe',
          creationDate: '2024-01-02T00:00:00+0000',
          diffs: [
            {
              key: 'tags',
              oldValue: '',
              newValue: 'security',
            },
          ],
        },
      ],
    });
  }),

  http.post('*/api/issues/delete_comment', async ({ request }) => {
    const _body = (await request.json()) as { comment: string };

    const issue = {
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
      comments: [], // Comment has been deleted
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

  http.post('*/api/issues/edit_comment', async ({ request }) => {
    const body = (await request.json()) as { comment: string; text: string };

    const issue = {
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
      comments: [
        {
          key: body.comment,
          login: 'john.doe',
          htmlText: body.text,
          markdown: body.text,
          updatable: true,
          createdAt: '2024-01-01T00:00:00+0000',
        },
      ],
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

  http.get('*/api/issues/gitlab_sast_export', ({ request }) => {
    const url = new URL(request.url);
    const _project = url.searchParams.get('project');

    return HttpResponse.json({
      version: '15.0.0',
      vulnerabilities: [
        {
          id: 'issue-1',
          category: 'sast',
          name: 'Security vulnerability',
          message: 'Potential security issue found',
          description: 'This is a detailed description of the security vulnerability',
          cve: 'CVE-2024-1234',
          severity: 'High',
          confidence: 'Medium',
          solution: 'Apply the recommended fix',
          scanner: {
            id: 'sonarqube',
            name: 'SonarQube',
          },
          location: {
            file: 'src/file.ts',
            start_line: 42,
            end_line: 42,
          },
          identifiers: [
            {
              type: 'sonarqube_rule',
              name: 'typescript:S1234',
              value: 'typescript:S1234',
              url: 'https://rules.sonarsource.com/typescript/RSPEC-1234',
            },
          ],
        },
      ],
    });
  }),

  http.post('*/api/issues/reindex', async ({ request }) => {
    const _body = (await request.json()) as { project: string };

    return HttpResponse.json({
      message: 'Issues reindexed successfully',
    });
  }),

  http.post('*/api/issues/set_severity', async ({ request }) => {
    const body = (await request.json()) as { issue: string; severity: string };

    const issue = {
      key: body.issue,
      rule: 'typescript:S1234',
      severity: body.severity,
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
    };

    return HttpResponse.json({
      issue,
      users: [],
      components: [{ key: 'project:src/file.ts', name: 'file.ts', qualifier: 'FIL' }],
      rules: [{ key: 'typescript:S1234', name: 'Bug Rule', status: 'READY' }],
    });
  }),

  http.get('*/api/issues/tags', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    const allTags = ['security', 'secure-coding', 'performance', 'maintainability', 'reliability'];

    let filteredTags = allTags;
    if (query !== null && query !== '') {
      filteredTags = allTags.filter((tag) => tag.toLowerCase().includes(query.toLowerCase()));
    }

    return HttpResponse.json({
      tags: filteredTags,
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
      createMetricsSearchResponse([SAMPLE_METRICS.coverage, SAMPLE_METRICS.lines]),
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
          comp.key.toLowerCase().includes(q.toLowerCase()),
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
          comp.key.toLowerCase().includes(q.toLowerCase()),
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

  // Hotspots endpoints
  http.get('*/api/hotspots/search', ({ request }) => {
    const url = new URL(request.url);
    const projectKey = url.searchParams.get('projectKey');
    const hotspots = url.searchParams.get('hotspots');
    const status = url.searchParams.get('status');
    const resolution = url.searchParams.get('resolution');
    const onlyMine = url.searchParams.get('onlyMine');
    const sinceLeakPeriod = url.searchParams.get('sinceLeakPeriod');
    const files = url.searchParams.get('files');
    const fileUuids = url.searchParams.get('fileUuids');
    const pageSize = Number(url.searchParams.get('ps')) || 100;
    const page = Number(url.searchParams.get('p')) || 1;

    // Simulate some default hotspots for testing
    const allHotspots = [
      createHotspot({
        key: 'hotspot-1',
        status: 'TO_REVIEW',
        component: 'project:src/main/java/App.java',
        message: 'Make sure this SQL query is safe',
        securityCategory: 'sql-injection',
        vulnerabilityProbability: 'HIGH',
        assignee: 'john.doe',
        creationDate: '2024-01-15T00:00:00+0000',
      }),
      createHotspot({
        key: 'hotspot-2',
        status: 'REVIEWED',
        resolution: 'FIXED',
        component: 'project:src/main/java/Security.java',
        message: 'Ensure proper authentication',
        securityCategory: 'auth',
        vulnerabilityProbability: 'MEDIUM',
        assignee: 'jane.smith',
        creationDate: '2023-12-15T00:00:00+0000',
      }),
      createHotspot({
        key: 'hotspot-3',
        status: 'REVIEWED',
        resolution: 'SAFE',
        component: 'project:src/main/java/Utils.java',
        message: 'Check cryptographic usage',
        securityCategory: 'cryptography',
        vulnerabilityProbability: 'LOW',
        assignee: 'john.doe',
        creationDate: '2024-02-01T00:00:00+0000',
      }),
    ];

    let filteredHotspots = [...allHotspots];

    // Apply filters
    if (projectKey !== null) {
      filteredHotspots = filteredHotspots.filter((h) => h.project === projectKey);
    }

    if (hotspots !== null) {
      const hotspotKeys = hotspots.split(',');
      filteredHotspots = filteredHotspots.filter((h) => hotspotKeys.includes(h.key));
    }

    if (status !== null) {
      filteredHotspots = filteredHotspots.filter((h) => h.status === status);
    }

    if (resolution !== null) {
      filteredHotspots = filteredHotspots.filter((h) => h.resolution === resolution);
    }

    if (onlyMine !== null && onlyMine === 'true') {
      // In a real implementation, this would filter by the current user
      // For testing, we'll filter by hotspots assigned to a test user
      filteredHotspots = filteredHotspots.filter((h) => h.assignee === 'john.doe');
    }

    if (sinceLeakPeriod !== null && sinceLeakPeriod === 'true') {
      // In a real implementation, this would filter by the leak period
      // For testing, we'll filter by hotspots created after a certain date
      const leakPeriodDate = new Date('2024-01-01T00:00:00+0000');
      filteredHotspots = filteredHotspots.filter((h) => new Date(h.creationDate) > leakPeriodDate);
    }

    if (files !== null) {
      const fileList = files.split(',');
      filteredHotspots = filteredHotspots.filter((h) =>
        fileList.some((file) => h.component.includes(file)),
      );
    }

    if (fileUuids !== null) {
      const uuidList = fileUuids.split(',');
      // For testing, we'll just filter by the hash field
      filteredHotspots = filteredHotspots.filter((h) => uuidList.includes(h.hash ?? ''));
    }

    // Handle pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedHotspots = filteredHotspots.slice(startIndex, endIndex);

    return HttpResponse.json(
      createHotspotsResponse(paginatedHotspots, {
        pageIndex: page,
        pageSize,
        total: filteredHotspots.length,
      }),
    );
  }),

  http.get('*/api/hotspots/show', ({ request }) => {
    const url = new URL(request.url);
    const hotspotKey = url.searchParams.get('hotspot');

    if (hotspotKey === null || hotspotKey === '') {
      return new HttpResponse(
        JSON.stringify({ errors: [{ msg: 'The hotspot parameter is missing' }] }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    // Return detailed hotspot information
    const hotspotDetails = createHotspotDetails({
      key: hotspotKey,
      status: 'TO_REVIEW',
      message: 'Make sure this SQL query is not vulnerable to injection attacks.',
      securityCategory: 'sql-injection',
      vulnerabilityProbability: 'HIGH',
    });

    return HttpResponse.json(hotspotDetails);
  }),

  http.post('*/api/hotspots/change_status', async ({ request }) => {
    const body = (await request.json()) as {
      hotspot: string;
      status: string;
      resolution?: string;
      comment?: string;
    };

    if (body.hotspot === '' || body.status === '') {
      return new HttpResponse(
        JSON.stringify({ errors: [{ msg: 'Missing required parameters' }] }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    if (body.status === 'REVIEWED' && (body.resolution === undefined || body.resolution === '')) {
      return new HttpResponse(
        JSON.stringify({ errors: [{ msg: 'Resolution is required when status is REVIEWED' }] }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    // Return empty response on success (as per API specification)
    return HttpResponse.json({});
  }),

  // Project Tags endpoints
  http.get('*/api/project_tags/search', ({ request }) => {
    const url = new URL(request.url);
    const ps = Number(url.searchParams.get('ps')) || 10;
    const q = url.searchParams.get('q');

    // Mock tags for testing
    const allTags = [
      'finance',
      'offshore',
      'production',
      'test',
      'development',
      'critical',
      'legacy',
    ];

    let filteredTags = [...allTags];

    // Apply query filter if provided
    if (q !== null && q !== '') {
      filteredTags = filteredTags.filter((tag) => tag.toLowerCase().includes(q.toLowerCase()));
    }

    // Apply page size limit
    filteredTags = filteredTags.slice(0, ps);

    return HttpResponse.json({
      tags: filteredTags,
    });
  }),

  http.post('*/api/project_tags/set', async ({ request }) => {
    const body = (await request.json()) as {
      project: string;
      tags: string;
    };

    if (!body.project) {
      return HttpResponse.json(
        { errors: [{ msg: 'The project parameter is missing' }] },
        { status: 400 },
      );
    }

    // Return empty response on success (as per API specification)
    return HttpResponse.json({});
  }),

  // Rules endpoints
  http.get('*/api/rules/repositories', ({ request }) => {
    const url = new URL(request.url);
    const language = url.searchParams.get('language');
    const q = url.searchParams.get('q');

    // Mock repositories for testing
    const allRepositories = [
      { key: 'java', name: 'SonarQube', language: 'java' },
      { key: 'squid', name: 'SonarQube (Squid)', language: 'java' },
      { key: 'javascript', name: 'SonarJS', language: 'js' },
      { key: 'typescript', name: 'SonarTS', language: 'ts' },
    ];

    let filteredRepositories = [...allRepositories];

    // Apply language filter
    if (language !== null) {
      filteredRepositories = filteredRepositories.filter((repo) => repo.language === language);
    }

    // Apply query filter
    if (q !== null && q !== '') {
      filteredRepositories = filteredRepositories.filter(
        (repo) =>
          repo.key.toLowerCase().includes(q.toLowerCase()) ||
          repo.name.toLowerCase().includes(q.toLowerCase()),
      );
    }

    return HttpResponse.json({
      repositories: filteredRepositories,
    });
  }),

  http.get('*/api/rules/search', ({ request }) => {
    const url = new URL(request.url);
    const p = Number(url.searchParams.get('p')) || 1;
    const ps = Number(url.searchParams.get('ps')) || 100;

    // Mock rules for testing
    const rules = [
      {
        key: 'java:S1234',
        repo: 'java',
        name: 'Rule Name',
        severity: 'MAJOR',
        status: 'READY',
        type: 'BUG',
        lang: 'java',
        langName: 'Java',
      },
    ];

    return HttpResponse.json({
      total: rules.length,
      p,
      ps,
      rules,
    });
  }),

  http.get('*/api/rules/show', ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const actives = url.searchParams.get('actives') === 'true';

    if (key === null || key === '') {
      return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Rule key is required' }] }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const response: Record<string, unknown> = {
      rule: {
        key,
        repo: 'java',
        name: 'Rule Name',
        htmlDesc: '<p>Rule description</p>',
        mdDesc: 'Rule description',
        severity: 'MAJOR',
        status: 'READY',
        type: 'BUG',
        tags: ['java8', 'security'],
        sysTags: [],
        lang: 'java',
        langName: 'Java',
      },
    };

    if (actives) {
      response['actives'] = [
        {
          qProfile: 'java-sonar-way-12345',
          inherit: 'NONE',
          severity: 'MAJOR',
          createdAt: '2024-01-01T00:00:00+0000',
        },
      ];
    }

    return HttpResponse.json(response);
  }),

  http.get('*/api/rules/tags', ({ request }) => {
    const url = new URL(request.url);
    const ps = Number(url.searchParams.get('ps')) || 10;
    const q = url.searchParams.get('q');

    // Mock tags for testing
    const allTags = ['security', 'java8', 'performance', 'sql', 'injection'];

    let filteredTags = [...allTags];

    // Apply query filter
    if (q !== null && q !== '') {
      filteredTags = filteredTags.filter((tag) => tag.toLowerCase().includes(q.toLowerCase()));
    }

    // Apply page size limit
    filteredTags = filteredTags.slice(0, ps);

    return HttpResponse.json({
      tags: filteredTags,
    });
  }),

  http.post('*/api/rules/update', async ({ request }) => {
    const body = (await request.json()) as {
      key: string;
      organization: string;
      name?: string;
      severity?: string;
      tags?: string;
      markdown_description?: string;
      markdown_note?: string;
      remediation_fn_type?: string;
      remediation_fn_base_effort?: string;
      remediation_fy_gap_multiplier?: string;
    };

    if (!body.key || !body.organization) {
      return new HttpResponse(
        JSON.stringify({ errors: [{ msg: 'Missing required parameters' }] }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    const rule = {
      key: body.key,
      repo: 'java',
      name: body.name ?? 'Updated Rule Name',
      severity: body.severity ?? 'CRITICAL',
      status: 'READY',
      type: 'BUG',
      tags: body.tags !== undefined && body.tags.length > 0 ? body.tags.split(',') : [],
      mdDesc: body.markdown_description ?? 'Updated description',
      mdNote: body.markdown_note,
      remFn: body.remediation_fn_type,
      remFnBaseEffort: body.remediation_fn_base_effort,
      remFnGapMultiplier: body.remediation_fy_gap_multiplier,
    };

    return HttpResponse.json({ rule });
  }),

  // Clean Code Policy API v2 handlers
  http.post('*/api/v2/clean-code-policy/rules', async ({ request }) => {
    const body = (await request.json()) as {
      key: string;
      templateKey: string;
      name: string;
      markdownDescription: string;
      status?: string;
      parameters?: Array<{ key: string; value: string }>;
    };

    // Simulate different responses based on the rule key for testing
    if (body.key === 'test-error-existing') {
      return HttpResponse.json(
        {
          error: 'Rule key already exists',
          message: `A rule with key "${body.key}" already exists`,
        },
        { status: 400 },
      );
    }

    if (body.templateKey === 'nonexistent:template') {
      return HttpResponse.json(
        {
          error: 'Template not found',
          message: `Template "${body.templateKey}" was not found`,
        },
        { status: 404 },
      );
    }

    // Default successful response
    const response = {
      id: `AY${Math.random().toString(36).substring(2, 11)}`,
      repositoryKey: body.templateKey.split(':')[0],
      key: body.key,
      ruleKey: `${body.templateKey.split(':')[0] ?? ''}:${body.key}`,
      name: body.name,
      htmlDescription: body.markdownDescription,
      markdownDescription: body.markdownDescription,
      severity: 'MAJOR',
      type: 'CODE_SMELL',
      status: body.status ?? 'READY',
      impacts: [
        {
          softwareQuality: 'MAINTAINABILITY',
          severity: 'MEDIUM',
        },
      ],
      cleanCodeAttribute: 'CLEAR',
      cleanCodeAttributeCategory: 'INTENTIONAL',
      language: ((): string => {
        if (body.templateKey.startsWith('javascript')) {
          return 'js';
        }
        if (body.templateKey.startsWith('typescript')) {
          return 'ts';
        }
        if (body.templateKey.startsWith('java')) {
          return 'java';
        }
        if (body.templateKey.startsWith('python')) {
          return 'py';
        }
        return 'unknown';
      })(),
      languageName: ((): string => {
        if (body.templateKey.startsWith('javascript')) {
          return 'JavaScript';
        }
        if (body.templateKey.startsWith('typescript')) {
          return 'TypeScript';
        }
        if (body.templateKey.startsWith('java')) {
          return 'Java';
        }
        if (body.templateKey.startsWith('python')) {
          return 'Python';
        }
        return 'Unknown';
      })(),
      templateKey: body.templateKey,
      parameters:
        body.parameters?.map((p) => ({
          key: p.key,
          name: p.key.charAt(0).toUpperCase() + p.key.slice(1),
          defaultValue: p.value,
          type: 'STRING',
        })) ?? [],
      createdAt: new Date().toISOString(),
      isTemplate: false,
      isExternal: false,
      tags: [],
      systemTags: [],
      scope: 'MAIN',
    };

    return HttpResponse.json(response);
  }),
];
