// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../../src/test-utils/assertions';
import { DuplicationsClient } from '../../../../src/resources/duplications/DuplicationsClient';
import {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
} from '../../../../src/errors';
import type { ShowDuplicationsResponse } from '../../../../src/resources/duplications/types';

describe('DuplicationsClient', () => {
  let client: DuplicationsClient;
  let clientWithEmptyToken: DuplicationsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new DuplicationsClient(baseUrl, token);
    clientWithEmptyToken = new DuplicationsClient(baseUrl, '');
  });

  describe('show', () => {
    it('should fetch duplications with basic parameters', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [
          {
            blocks: [
              {
                from: 10,
                to: 25,
                size: 16,
                _ref: '1',
              },
              {
                from: 50,
                to: 65,
                size: 16,
                _ref: '2',
              },
            ],
          },
        ],
        files: [
          {
            key: 'my_project:/src/foo/Bar.php',
            name: 'Bar.php',
            project: 'my_project',
            projectName: 'My Project',
          },
          {
            key: 'my_project:/src/baz/Qux.php',
            name: 'Qux.php',
            project: 'my_project',
            projectName: 'My Project',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my_project:/src/foo/Bar.php');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/Bar.php',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should fetch duplications with branch parameter', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [],
        files: [],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my_project:/src/foo/Bar.php');
          expect(url.searchParams.get('branch')).toBe('feature/my_branch');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/Bar.php',
        branch: 'feature/my_branch',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should fetch duplications with pull request parameter', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [],
        files: [],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my_project:/src/foo/Bar.php');
          expect(url.searchParams.get('pullRequest')).toBe('5461');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/Bar.php',
        pullRequest: '5461',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should fetch duplications with all parameters', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [
          {
            blocks: [
              {
                from: 1,
                to: 10,
                size: 10,
                _ref: '1',
              },
            ],
          },
        ],
        files: [
          {
            key: 'my_project:/src/foo/Bar.php',
            name: 'Bar.php',
            project: 'my_project',
            projectName: 'My Project',
            uuid: '584a89f2-8037-4f7b-b82c-8b45d2d63fb2',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my_project:/src/foo/Bar.php');
          expect(url.searchParams.get('branch')).toBe('feature/my_branch');
          expect(url.searchParams.get('pullRequest')).toBe('5461');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/Bar.php',
        branch: 'feature/my_branch',
        pullRequest: '5461',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle empty duplications response', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [],
        files: [],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/clean/File.php',
      });

      expect(result).toEqual(mockResponse);
      expect(result.duplications).toHaveLength(0);
      expect(result.files).toHaveLength(0);
    });

    it('should handle complex duplication structure', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [
          {
            blocks: [
              {
                from: 5,
                to: 15,
                size: 11,
                _ref: '1',
              },
              {
                from: 20,
                to: 30,
                size: 11,
                _ref: '2',
              },
              {
                from: 100,
                to: 110,
                size: 11,
                _ref: '3',
              },
            ],
          },
          {
            blocks: [
              {
                from: 50,
                to: 55,
                size: 6,
                _ref: '1',
              },
              {
                from: 200,
                to: 205,
                size: 6,
                _ref: '4',
              },
            ],
          },
        ],
        files: [
          {
            key: 'my_project:/src/foo/Bar.php',
            name: 'Bar.php',
            project: 'my_project',
            projectName: 'My Project',
          },
          {
            key: 'my_project:/src/baz/Qux.php',
            name: 'Qux.php',
            project: 'my_project',
            projectName: 'My Project',
          },
          {
            key: 'other_project:/src/Similar.php',
            name: 'Similar.php',
            project: 'other_project',
            projectName: 'Other Project',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/Bar.php',
      });

      expect(result).toEqual(mockResponse);
      expect(result.duplications).toHaveLength(2);
      expect(result.duplications[0].blocks).toHaveLength(3);
      expect(result.duplications[1].blocks).toHaveLength(2);
      expect(result.files).toHaveLength(3);
    });

    it('should encode special characters in parameters', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [],
        files: [],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my_project:/src/foo/File with spaces.php');
          expect(url.searchParams.get('branch')).toBe('feature/branch-with-special-chars');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show({
        key: 'my_project:/src/foo/File with spaces.php',
        branch: 'feature/branch-with-special-chars',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should work without authentication token', async () => {
      const mockResponse: ShowDuplicationsResponse = {
        duplications: [],
        files: [],
      };

      server.use(
        http.get(`${baseUrl}/api/duplications/show`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await clientWithEmptyToken.show({
        key: 'my_project:/src/foo/Bar.php',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Invalid token' }] }, { status: 401 });
        }),
      );

      await expect(client.show({ key: 'my_project:/src/foo/Bar.php' })).rejects.toThrow(
        AuthenticationError,
      );
    });

    it('should handle 403 authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient permissions' }] },
            { status: 403 },
          );
        }),
      );

      await expect(client.show({ key: 'my_project:/src/foo/Bar.php' })).rejects.toThrow(
        AuthorizationError,
      );
    });

    it('should handle 404 not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.json({ errors: [{ msg: 'File not found' }] }, { status: 404 });
        }),
      );

      await expect(client.show({ key: 'non_existent_project:/src/NotFound.php' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/duplications/show`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.show({ key: 'my_project:/src/foo/Bar.php' })).rejects.toThrow(
        NetworkError,
      );
    });
  });
});
