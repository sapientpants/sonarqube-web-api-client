import { http, HttpResponse } from 'msw';
import { ProjectTagsClient } from '../ProjectTagsClient';
import { server } from '../../../test-utils/msw/server';
import type { SearchTagsResponse } from '../types';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
} from '../../../errors';
import { createApiError, createErrorResponse } from '../../../test-utils/msw/factories';

const createSearchTagsResponse = (tags: string[]): SearchTagsResponse => ({
  tags,
});

const SAMPLE_TAGS = ['finance', 'offshore', 'production', 'test', 'development'];

describe('ProjectTagsClient', () => {
  let client: ProjectTagsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ProjectTagsClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return tags with default parameters', async () => {
      const mockResponse = createSearchTagsResponse(SAMPLE_TAGS);

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search();

      expect(result).toEqual(mockResponse);
      expect(result.tags).toHaveLength(5);
      expect(result.tags).toContain('finance');
      expect(result.tags).toContain('offshore');
    });

    it('should handle search parameters correctly', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            tags: ['finance', 'offshore'],
          });
        })
      );

      await client.search({
        ps: 20,
        q: 'off',
      });

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params = capturedUrl!.searchParams;
      expect(params.get('ps')).toBe('20');
      expect(params.get('q')).toBe('off');
    });

    it('should handle empty results', async () => {
      const mockResponse = createSearchTagsResponse([]);

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search();

      expect(result.tags).toEqual([]);
    });

    it('should handle query parameter filtering', async () => {
      const mockResponse = createSearchTagsResponse(['finance', 'offshore']);

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q');
          expect(query).toBe('off');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search({ q: 'off' });

      expect(result.tags).toHaveLength(2);
      expect(result.tags).toContain('finance');
      expect(result.tags).toContain('offshore');
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Internal server error')]), {
            status: 500,
          });
        })
      );

      await expect(client.search()).rejects.toThrow(ServerError);
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Rate limit exceeded')]), {
            status: 429,
            headers: { 'Retry-After': '60' },
          });
        })
      );

      try {
        await client.search();
        fail('Expected RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });
  });

  describe('set', () => {
    it('should set tags on a project', async () => {
      let capturedBody: string | null = null;

      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json({});
        })
      );

      await client.set({
        project: 'my_project',
        tags: 'finance, offshore',
      });

      expect(capturedBody).toBeDefined();
      expect(capturedBody).not.toBeNull();
      const parsedBody = JSON.parse(capturedBody as string) as { project: string; tags: string };
      expect(parsedBody.project).toBe('my_project');
      expect(parsedBody.tags).toBe('finance, offshore');
    });

    it('should clear tags when empty string is provided', async () => {
      let capturedBody: string | null = null;

      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json({});
        })
      );

      await client.set({
        project: 'my_project',
        tags: '',
      });

      expect(capturedBody).toBeDefined();
      const parsedBody = JSON.parse(capturedBody as string) as { project: string; tags: string };
      expect(parsedBody.tags).toBe('');
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(
            createErrorResponse([createApiError('Authentication required')]),
            { status: 401 }
          );
        })
      );

      await expect(
        client.set({
          project: 'my_project',
          tags: 'finance',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(
            createErrorResponse([createApiError('Insufficient privileges')]),
            { status: 403 }
          );
        })
      );

      await expect(
        client.set({
          project: 'my_project',
          tags: 'finance',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should handle not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Project not found')]), {
            status: 404,
          });
        })
      );

      await expect(
        client.set({
          project: 'non_existent_project',
          tags: 'finance',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Internal server error')]), {
            status: 500,
          });
        })
      );

      await expect(
        client.set({
          project: 'my_project',
          tags: 'finance',
        })
      ).rejects.toThrow(ServerError);
    });

    it('should handle missing project parameter', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'The project parameter is missing' }] },
            { status: 400 }
          );
        })
      );

      await expect(
        client.set({
          project: '',
          tags: 'finance',
        })
      ).rejects.toThrow('The project parameter is missing');
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Rate limit exceeded')]), {
            status: 429,
            headers: { 'Retry-After': '60' },
          });
        })
      );

      try {
        await client.set({
          project: 'my_project',
          tags: 'finance',
        });
        fail('Expected RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        client.set({
          project: 'my_project',
          tags: 'finance',
        })
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('edge cases', () => {
    it('should handle search with only ps parameter', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ tags: ['tag1', 'tag2'] });
        })
      );

      await client.search({ ps: 5 });

      expect(capturedUrl).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params1 = capturedUrl!.searchParams;
      expect(params1.get('ps')).toBe('5');
      expect(params1.get('q')).toBeNull();
    });

    it('should handle search with only q parameter', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ tags: ['finance'] });
        })
      );

      await client.search({ q: 'finance' });

      expect(capturedUrl).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params2 = capturedUrl!.searchParams;
      expect(params2.get('q')).toBe('finance');
      expect(params2.get('ps')).toBeNull();
    });

    it('should handle search with ps = 0', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ tags: [] });
        })
      );

      await client.search({ ps: 0 });

      expect(capturedUrl).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params3 = capturedUrl!.searchParams;
      expect(params3.get('ps')).toBe('0');
    });

    it('should handle search with empty string query', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ tags: SAMPLE_TAGS });
        })
      );

      await client.search({ q: '' });

      expect(capturedUrl).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params4 = capturedUrl!.searchParams;
      expect(params4.get('q')).toBe('');
    });

    it('should construct correct URL when no parameters are provided', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ tags: SAMPLE_TAGS });
        })
      );

      await client.search();

      expect(capturedUrl).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedUrl!.pathname).toBe('/api/project_tags/search');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(capturedUrl!.search).toBe('');
    });

    it('should handle network errors in search', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.search()).rejects.toThrow(NetworkError);
    });

    it('should handle authentication errors in search', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(
            createErrorResponse([createApiError('Authentication required')]),
            { status: 401 }
          );
        })
      );

      await expect(client.search()).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors in search', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(
            createErrorResponse([createApiError('Insufficient privileges')]),
            { status: 403 }
          );
        })
      );

      await expect(client.search()).rejects.toThrow(AuthorizationError);
    });

    it('should handle not found errors in search', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_tags/search`, () => {
          return HttpResponse.json(createErrorResponse([createApiError('Not found')]), {
            status: 404,
          });
        })
      );

      await expect(client.search()).rejects.toThrow(NotFoundError);
    });

    it('should handle special characters in project name for set', async () => {
      let capturedBody: string | null = null;

      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json({});
        })
      );

      await client.set({
        project: 'my-project:with-special-chars',
        tags: 'tag1, tag2',
      });

      expect(capturedBody).toBeDefined();
      const parsedBody = JSON.parse(capturedBody as string) as { project: string; tags: string };
      expect(parsedBody.project).toBe('my-project:with-special-chars');
    });

    it('should handle special characters in tags for set', async () => {
      let capturedBody: string | null = null;

      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json({});
        })
      );

      await client.set({
        project: 'my_project',
        tags: 'tag-with-hyphens, tag_with_underscores, tag.with.dots',
      });

      expect(capturedBody).toBeDefined();
      const parsedBody = JSON.parse(capturedBody as string) as { project: string; tags: string };
      expect(parsedBody.tags).toBe('tag-with-hyphens, tag_with_underscores, tag.with.dots');
    });

    it('should handle long tag lists for set', async () => {
      let capturedBody: string | null = null;

      server.use(
        http.post(`${baseUrl}/api/project_tags/set`, async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json({});
        })
      );

      const longTagList = Array.from({ length: 20 }, (_, i) => `tag-${String(i + 1)}`).join(', ');
      await client.set({
        project: 'my_project',
        tags: longTagList,
      });

      expect(capturedBody).toBeDefined();
      const parsedBody = JSON.parse(capturedBody as string) as { project: string; tags: string };
      expect(parsedBody.tags).toBe(longTagList);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new ProjectTagsClient(baseUrl, token, 'test-org');
      expect(clientWithOrg).toBeInstanceOf(ProjectTagsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new ProjectTagsClient(baseUrl, token);
      expect(clientWithoutOrg).toBeInstanceOf(ProjectTagsClient);
    });
  });
});
