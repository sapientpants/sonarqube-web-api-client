// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
  assertQueryParams,
} from '../../../../src/test-utils/assertions';
import { SourcesClient } from '../../../../src/resources/sources/SourcesClient';
import { AuthorizationError } from '../../../../src/errors';
import type {
  GetScmInfoResponse,
  ShowSourceResponse,
} from '../../../../src/resources/sources/types';

describe('SourcesClient', () => {
  let client: SourcesClient;
  let clientWithEmptyToken: SourcesClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new SourcesClient(baseUrl, token);
    clientWithEmptyToken = new SourcesClient(baseUrl, '');
  });

  describe('raw', () => {
    it('should fetch raw source code with key parameter', async () => {
      const mockSourceCode = `export function hello() {
  console.log('Hello, world!');
}`;

      server.use(
        http.get(`${baseUrl}/api/sources/raw`, ({ request }) => {
          assertQueryParams(request, { key: 'my_project:src/hello.ts' });
          assertAuthorizationHeader(request, token);

          return new HttpResponse(mockSourceCode, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }),
      );

      const result = await client.raw({ key: 'my_project:src/hello.ts' });
      expect(result).toBe(mockSourceCode);
    });

    it('should fetch raw source code with branch parameter', async () => {
      const mockSourceCode = 'const x = 42;';

      server.use(
        http.get(`${baseUrl}/api/sources/raw`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my_project:src/main.ts',
            branch: 'feature/new-feature',
          });

          return new HttpResponse(mockSourceCode, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }),
      );

      const result = await client.raw({
        key: 'my_project:src/main.ts',
        branch: 'feature/new-feature',
      });
      expect(result).toBe(mockSourceCode);
    });

    it('should fetch raw source code with pull request parameter', async () => {
      const mockSourceCode = 'function test() { return true; }';

      server.use(
        http.get(`${baseUrl}/api/sources/raw`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my_project:src/test.ts',
            pullRequest: '123',
          });

          return new HttpResponse(mockSourceCode, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }),
      );

      const result = await client.raw({
        key: 'my_project:src/test.ts',
        pullRequest: '123',
      });
      expect(result).toBe(mockSourceCode);
    });

    it('should handle empty source files', async () => {
      server.use(
        http.get(`${baseUrl}/api/sources/raw`, () => {
          return new HttpResponse('', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }),
      );

      const result = await client.raw({ key: 'my_project:src/empty.ts' });
      expect(result).toBe('');
    });

    it('should work without authentication token', async () => {
      const mockSourceCode = 'public code';

      server.use(
        http.get(`${baseUrl}/api/sources/raw`, ({ request }) => {
          assertNoAuthorizationHeader(request);

          return new HttpResponse(mockSourceCode, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }),
      );

      const result = await clientWithEmptyToken.raw({ key: 'public_project:src/code.ts' });
      expect(result).toBe(mockSourceCode);
    });

    it('should throw error on failed request', async () => {
      server.use(
        http.get(`${baseUrl}/api/sources/raw`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Insufficient privileges' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            },
          );
        }),
      );

      await expect(client.raw({ key: 'my_project:src/secret.ts' })).rejects.toThrow(
        AuthorizationError,
      );
    });
  });

  describe('scm', () => {
    it('should fetch SCM information with key parameter', async () => {
      const mockResponse: GetScmInfoResponse = {
        scm: [
          {
            line: 1,
            author: 'john.doe@example.com',
            date: '2024-01-15T10:30:00+0000',
            revision: 'abc123def456',
          },
          {
            line: 2,
            author: 'jane.smith@example.com',
            date: '2024-01-16T14:20:00+0000',
            revision: 'def456ghi789',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/scm`, ({ request }) => {
          assertQueryParams(request, { key: 'my_project:src/app.ts' });
          assertAuthorizationHeader(request, token);

          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.scm({ key: 'my_project:src/app.ts' });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch SCM information with all parameters', async () => {
      const mockResponse: GetScmInfoResponse = {
        scm: [
          {
            line: 10,
            author: 'developer@example.com',
            date: '2024-03-01T09:00:00+0000',
            revision: 'commit123',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/scm`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my_project:src/component.ts',
            commits_by_line: 'true',
            from: '10',
            to: '20',
          });

          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.scm({
        key: 'my_project:src/component.ts',
        commitsByLine: true,
        from: 10,
        to: 20,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle commits_by_line as false', async () => {
      const mockResponse: GetScmInfoResponse = {
        scm: [
          {
            line: 1,
            author: 'author@example.com',
            date: '2024-01-01T00:00:00+0000',
            revision: 'rev1',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/scm`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my_project:src/file.ts',
            commits_by_line: 'false',
          });

          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.scm({
        key: 'my_project:src/file.ts',
        commitsByLine: false,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty SCM data', async () => {
      const mockResponse: GetScmInfoResponse = {
        scm: [],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/scm`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.scm({ key: 'my_project:src/new-file.ts' });
      expect(result).toEqual(mockResponse);
    });

    it('should encode special characters in parameters', async () => {
      const mockResponse: GetScmInfoResponse = {
        scm: [],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/scm`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my project:src/file with spaces.ts',
          });

          return HttpResponse.json(mockResponse);
        }),
      );

      await client.scm({ key: 'my project:src/file with spaces.ts' });
    });
  });

  describe('show', () => {
    it('should fetch source code with line numbers', async () => {
      const mockResponse: ShowSourceResponse = {
        sources: [
          {
            line: 1,
            code: 'import { Component } from "react";',
          },
          {
            line: 2,
            code: '',
          },
          {
            line: 3,
            code: 'export class MyComponent extends Component {',
          },
          {
            line: 4,
            code: '  render() {',
          },
          {
            line: 5,
            code: '    return <div>Hello</div>;',
          },
          {
            line: 6,
            code: '  }',
          },
          {
            line: 7,
            code: '}',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/show`, ({ request }) => {
          assertQueryParams(request, { key: 'my_project:src/MyComponent.tsx' });
          assertAuthorizationHeader(request, token);

          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({ key: 'my_project:src/MyComponent.tsx' });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch specific line range', async () => {
      const mockResponse: ShowSourceResponse = {
        sources: [
          {
            line: 10,
            code: '  const handleClick = () => {',
          },
          {
            line: 11,
            code: '    console.log("clicked");',
          },
          {
            line: 12,
            code: '  };',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/show`, ({ request }) => {
          assertQueryParams(request, {
            key: 'my_project:src/utils.ts',
            from: '10',
            to: '12',
          });

          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:src/utils.ts',
        from: 10,
        to: 12,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty lines and whitespace', async () => {
      const mockResponse: ShowSourceResponse = {
        sources: [
          {
            line: 1,
            code: '    // Indented comment',
          },
          {
            line: 2,
            code: '',
          },
          {
            line: 3,
            code: '  ',
          },
          {
            line: 4,
            code: '\t\t// Tab-indented',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/show`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({ key: 'my_project:src/whitespace.ts' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle files with no content', async () => {
      const mockResponse: ShowSourceResponse = {
        sources: [],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/show`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({ key: 'my_project:src/empty.ts' });
      expect(result).toEqual(mockResponse);
    });

    it('should work without authentication on public projects', async () => {
      const mockResponse: ShowSourceResponse = {
        sources: [
          {
            line: 1,
            code: 'public content',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/sources/show`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await clientWithEmptyToken.show({ key: 'public_project:src/public.ts' });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when access is denied', async () => {
      server.use(
        http.get(`${baseUrl}/api/sources/show`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'You do not have permission to access this resource' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            },
          );
        }),
      );

      await expect(client.show({ key: 'private_project:src/secret.ts' })).rejects.toThrow(
        AuthorizationError,
      );
    });
  });
});
