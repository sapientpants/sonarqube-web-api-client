import { http, HttpResponse } from 'msw';

/**
 * Default MSW request handlers for common scenarios.
 * These handlers can be overridden in individual tests using server.use()
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'retry-after': '60',
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
  http.get('*/api/alm_integrations/list_bitbucket_server_projects', () => {
    return HttpResponse.json({
      projects: [],
      isLastPage: true,
    });
  }),

  http.get('*/api/alm_integrations/search_bitbucket_server_repos', () => {
    return HttpResponse.json({
      repositories: [],
      isLastPage: true,
    });
  }),

  http.get('*/api/alm_integrations/search_bitbucket_cloud_repos', () => {
    return HttpResponse.json({
      repositories: [],
      paging: { pageIndex: 1, pageSize: 10, total: 0 },
    });
  }),
];
