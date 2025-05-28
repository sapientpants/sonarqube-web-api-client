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
  });
});
