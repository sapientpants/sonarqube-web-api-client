import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../test-utils/assertions';
import { WebservicesClient } from '../WebservicesClient';
import { AuthorizationError, AuthenticationError } from '../../../errors';
import type { ListWebservicesResponse, ResponseExampleResponse } from '../types';

describe('WebservicesClient', () => {
  let client: WebservicesClient;
  let clientWithEmptyToken: WebservicesClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new WebservicesClient(baseUrl, token);
    clientWithEmptyToken = new WebservicesClient(baseUrl, '');
  });

  describe('list', () => {
    it('should fetch list of available web services', async () => {
      const mockResponse: ListWebservicesResponse = {
        webServices: [
          {
            path: 'api/issues',
            description: 'Read and update issues',
            actions: [
              {
                key: 'search',
                description: 'Search for issues',
                internal: false,
                post: false,
                hasResponseExample: true,
                changelog: [],
                params: [
                  {
                    key: 'componentKeys',
                    description: 'Component keys',
                    required: false,
                    internal: false,
                    exampleValue: 'my_project',
                  },
                ],
              },
              {
                key: 'assign',
                description: 'Assign an issue',
                internal: false,
                post: true,
                hasResponseExample: false,
                changelog: [
                  {
                    version: '5.3',
                    description: 'The response format has been updated',
                  },
                ],
                params: [
                  {
                    key: 'issue',
                    description: 'Issue key',
                    required: true,
                    internal: false,
                    exampleValue: 'ABCD-1234',
                  },
                ],
              },
            ],
          },
          {
            path: 'api/webservices',
            description: 'Get information on the web api supported on this instance.',
            actions: [
              {
                key: 'list',
                description: 'List web services',
                internal: false,
                post: false,
                hasResponseExample: true,
                changelog: [],
              },
              {
                key: 'response_example',
                description: 'Display web service response example',
                internal: false,
                post: false,
                hasResponseExample: true,
                changelog: [],
                params: [
                  {
                    key: 'controller',
                    description: 'Controller of the web service',
                    required: true,
                    internal: false,
                    exampleValue: 'api/issues',
                  },
                  {
                    key: 'action',
                    description: 'Action of the web service',
                    required: true,
                    internal: false,
                    exampleValue: 'search',
                  },
                ],
              },
            ],
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/list`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list();
      expect(result).toEqual(mockResponse);
      expect(result.webServices).toHaveLength(2);
      expect(result.webServices?.[0]?.path).toBe('api/issues');
      expect(result.webServices?.[1]?.path).toBe('api/webservices');
    });

    it('should handle empty web services list', async () => {
      const mockResponse: ListWebservicesResponse = {
        webServices: [],
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/list`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list();
      expect(result.webServices).toEqual([]);
    });

    it('should work without authentication token', async () => {
      const mockResponse: ListWebservicesResponse = {
        webServices: [
          {
            path: 'api/authentication',
            description: 'Authentication endpoints',
            actions: [
              {
                key: 'validate',
                description: 'Check if user is authenticated',
                internal: false,
                post: false,
                hasResponseExample: true,
                changelog: [],
              },
            ],
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/list`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await clientWithEmptyToken.list();
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication error when required', async () => {
      server.use(
        http.get(`${baseUrl}/api/webservices/list`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Authentication required' }],
            },
            {
              status: 401,
              statusText: 'Unauthorized',
            }
          );
        })
      );

      await expect(clientWithEmptyToken.list()).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization error', async () => {
      server.use(
        http.get(`${baseUrl}/api/webservices/list`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Insufficient privileges' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            }
          );
        })
      );

      await expect(client.list()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('responseExample', () => {
    it('should fetch response example for valid controller and action', async () => {
      const mockResponse: ResponseExampleResponse = {
        total: 253,
        p: 1,
        ps: 100,
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 253,
        },
        effortTotal: 890,
        issues: [
          {
            key: 'AU-TpxIBsLrIVqJXJ_HE',
            rule: 'javascript:S1067',
            severity: 'MAJOR',
            component: 'my_project:src/foo/Bar.js',
            componentLongName: 'src/foo/Bar.js',
            project: 'my_project',
            line: 26,
            hash: '5b1e65d9ae27aedd6f8f73e5a063f7b9',
            textRange: {
              startLine: 26,
              endLine: 26,
              startOffset: 6,
              endOffset: 76,
            },
            flows: [],
            status: 'OPEN',
            message: 'Reduce the number of conditional operators (4) used in the expression',
            effort: '5min',
            debt: '5min',
            tags: ['brain-overload'],
            creationDate: '2013-05-13T17:55:39+0200',
            updateDate: '2013-05-13T17:55:39+0200',
            type: 'CODE_SMELL',
          },
        ],
        components: [
          {
            organization: 'my-org-1',
            key: 'my_project',
            uuid: 'AU-Tpxb--RLjMYPCVYZx',
            enabled: true,
            qualifier: 'TRK',
            name: 'My Project',
            longName: 'My Project',
            path: '',
          },
        ],
        organizations: [
          {
            key: 'my-org-1',
            name: 'My Organization',
          },
        ],
        facets: [],
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, ({ request }) => {
          const url = new URL(request.url);
          const controller = url.searchParams.get('controller');
          const action = url.searchParams.get('action');

          expect(controller).toBe('api/issues');
          expect(action).toBe('search');

          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.responseExample({
        controller: 'api/issues',
        action: 'search',
      });

      expect(result).toEqual(mockResponse);
      expect(result.total).toBe(253);
      expect(result.issues).toHaveLength(1);
    });

    it('should handle simple response example', async () => {
      const mockResponse: ResponseExampleResponse = {
        valid: true,
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('controller')).toBe('api/authentication');
          expect(url.searchParams.get('action')).toBe('validate');

          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.responseExample({
        controller: 'api/authentication',
        action: 'validate',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should work without authentication token', async () => {
      const mockResponse: ResponseExampleResponse = {
        pong: 'pong',
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await clientWithEmptyToken.responseExample({
        controller: 'api/system',
        action: 'ping',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle not found error for invalid controller/action', async () => {
      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Controller not found: api/invalid' }],
            },
            {
              status: 404,
              statusText: 'Not Found',
            }
          );
        })
      );

      await expect(
        client.responseExample({
          controller: 'api/invalid',
          action: 'search',
        })
      ).rejects.toThrow();
    });

    it('should handle authentication error when required', async () => {
      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Authentication required' }],
            },
            {
              status: 401,
              statusText: 'Unauthorized',
            }
          );
        })
      );

      await expect(
        clientWithEmptyToken.responseExample({
          controller: 'api/projects',
          action: 'search',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization error', async () => {
      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Insufficient privileges' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            }
          );
        })
      );

      await expect(
        client.responseExample({
          controller: 'api/system',
          action: 'info',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should properly encode special characters in parameters', async () => {
      const mockResponse: ResponseExampleResponse = {
        example: 'data',
      };

      server.use(
        http.get(`${baseUrl}/api/webservices/response_example`, ({ request }) => {
          const url = new URL(request.url);
          const controller = url.searchParams.get('controller');
          const action = url.searchParams.get('action');

          expect(controller).toBe('api/special chars & symbols');
          expect(action).toBe('test action');

          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.responseExample({
        controller: 'api/special chars & symbols',
        action: 'test action',
      });

      expect(result).toEqual(mockResponse);
    });
  });
});
