import { http, HttpResponse } from 'msw';
import { ProjectsClient } from '../ProjectsClient';
import type { BulkDeleteProjectsBuilder, SearchProjectsBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import {
  assertCommonHeaders,
  assertRequestBody,
  assertQueryParams,
} from '../../../test-utils/assertions';
import type { SearchProjectsResponse } from '../types';

describe('Projects Builders', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: ProjectsClient;

  beforeEach(() => {
    client = new ProjectsClient(baseUrl, token);
  });

  describe('BulkDeleteProjectsBuilder', () => {
    let builder: BulkDeleteProjectsBuilder;

    beforeEach(() => {
      builder = client.bulkDelete();
    });

    it('should build request with analyzed before date', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/bulk_delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            analyzedBefore: '2024-01-01',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(builder.analyzedBefore('2024-01-01').execute()).resolves.toBeUndefined();
    });

    it('should build request with project keys', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/bulk_delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            projects: ['project-1', 'project-2'],
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(builder.projects(['project-1', 'project-2']).execute()).resolves.toBeUndefined();
    });

    it('should build request with query', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/bulk_delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            q: 'deprecated',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(builder.query('deprecated').execute()).resolves.toBeUndefined();
    });

    it('should build request with multiple parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/projects/bulk_delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            q: 'old',
            onProvisionedOnly: true,
            qualifiers: ['TRK', 'APP'],
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        builder.query('old').onProvisionedOnly().qualifiers(['TRK', 'APP']).execute()
      ).resolves.toBeUndefined();
    });

    it('should throw error when no parameters provided', async () => {
      await expect(builder.execute()).rejects.toThrow(
        'At least one parameter is required among analyzedBefore, projects and q'
      );
    });
  });

  describe('SearchProjectsBuilder', () => {
    let builder: SearchProjectsBuilder;

    beforeEach(() => {
      builder = client.search();
    });

    const mockResponse: SearchProjectsResponse = {
      components: [
        {
          key: 'project-1',
          name: 'Project 1',
          qualifier: 'TRK',
          visibility: 'public',
          lastAnalysisDate: '2024-01-01T00:00:00Z',
          managed: false,
        },
        {
          key: 'project-2',
          name: 'Project 2',
          qualifier: 'TRK',
          visibility: 'private',
          managed: true,
          containsAiCode: true,
        },
      ],
      paging: {
        pageIndex: 1,
        pageSize: 20,
        total: 2,
      },
    };

    it('should search with query', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            q: 'frontend',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder.query('frontend').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search with analyzed before date', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            analyzedBefore: '2024-01-01',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder.analyzedBefore('2024-01-01').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search provisioned projects only', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            onProvisionedOnly: 'true',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder.onProvisionedOnly().execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search specific projects', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            projects: 'project-1,project-2',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder.projects(['project-1', 'project-2']).execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search with qualifiers', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            qualifiers: 'TRK,APP',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder.qualifiers(['TRK', 'APP']).execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search with pagination', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            p: '2',
            ps: '50',
          });
          return HttpResponse.json({
            ...mockResponse,
            paging: {
              pageIndex: 2,
              pageSize: 50,
              total: 100,
            },
          });
        })
      );

      const result = await builder.page(2).pageSize(50).execute();
      expect(result.paging.pageIndex).toBe(2);
      expect(result.paging.pageSize).toBe(50);
    });

    it('should iterate through all pages', async () => {
      const page1Response: SearchProjectsResponse = {
        components: [
          {
            key: 'project-1',
            name: 'Project 1',
            qualifier: 'TRK',
            visibility: 'public',
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 1,
          total: 2,
        },
      };

      const page2Response: SearchProjectsResponse = {
        components: [
          {
            key: 'project-2',
            name: 'Project 2',
            qualifier: 'TRK',
            visibility: 'private',
          },
        ],
        paging: {
          pageIndex: 2,
          pageSize: 1,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          const url = new URL(request.url);
          const page = url.searchParams.get('p');

          if (page === '1' || page === null) {
            return HttpResponse.json(page1Response);
          } else if (page === '2') {
            return HttpResponse.json(page2Response);
          }

          return HttpResponse.json({
            components: [],
            paging: { pageIndex: 3, pageSize: 1, total: 2 },
          });
        })
      );

      const projects = [];
      for await (const project of builder.pageSize(1).all()) {
        projects.push(project);
      }

      expect(projects).toHaveLength(2);
      expect(projects[0].key).toBe('project-1');
      expect(projects[1].key).toBe('project-2');
    });

    it('should build complex search request', async () => {
      server.use(
        http.get(`${baseUrl}/api/projects/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            q: 'frontend',
            analyzedBefore: '2024-01-01',
            onProvisionedOnly: 'false',
            qualifiers: 'TRK',
            p: '2',
            ps: '100',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await builder
        .query('frontend')
        .analyzedBefore('2024-01-01')
        .onProvisionedOnly(false)
        .qualifiers(['TRK'])
        .page(2)
        .pageSize(100)
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });
});
