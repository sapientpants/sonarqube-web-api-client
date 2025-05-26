import { http, HttpResponse } from 'msw';

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

  http.get('*/api/issues/search', ({ request }) => {
    const url = new URL(request.url);
    const componentKeys = url.searchParams.get('componentKeys');

    return HttpResponse.json({
      issues: [],
      paging: {
        pageIndex: 1,
        pageSize: 100,
        total: 0,
      },
      components: componentKeys !== null ? [{ key: componentKeys }] : [],
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
    return HttpResponse.json({
      metrics: [
        {
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
        },
        {
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
        },
      ],
      total: 2,
      p: 1,
      ps: 50,
    });
  }),

  http.get('*/api/metrics/types', () => {
    return HttpResponse.json({
      types: [
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
      ],
    });
  }),

  http.get('*/api/metrics/domains', () => {
    return HttpResponse.json({
      domains: [
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
      ],
    });
  }),
];
