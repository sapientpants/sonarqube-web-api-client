import { http, HttpResponse } from 'msw';
import { ProjectLinksClient } from '../ProjectLinksClient';
import { server } from '../../../test-utils/msw/server';
import { assertCommonHeaders, assertQueryParams } from '../../../test-utils';

describe('ProjectLinksClient', () => {
  const baseUrl = 'http://localhost';
  const token = 'test-token';
  let client: ProjectLinksClient;

  beforeEach(() => {
    client = new ProjectLinksClient(baseUrl, token);
  });

  describe('create', () => {
    it('should create a project link with project key', async () => {
      const mockResponse = {
        link: {
          id: '1',
          name: 'Documentation',
          type: 'custom',
          url: 'https://docs.example.com',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/project_links/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.json();
          expect(body).toEqual({
            projectKey: 'my-project',
            name: 'Documentation',
            url: 'https://docs.example.com',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.create({
        projectKey: 'my-project',
        name: 'Documentation',
        url: 'https://docs.example.com',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create a project link with project ID', async () => {
      const mockResponse = {
        link: {
          id: '2',
          name: 'Issue Tracker',
          type: 'custom',
          url: 'https://issues.example.com',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/project_links/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.json();
          expect(body).toEqual({
            projectId: 'AU-Tpxb--iU5OvuD2FLy',
            name: 'Issue Tracker',
            url: 'https://issues.example.com',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.create({
        projectId: 'AU-Tpxb--iU5OvuD2FLy',
        name: 'Issue Tracker',
        url: 'https://issues.example.com',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when neither projectId nor projectKey is provided', async () => {
      await expect(
        client.create({
          name: 'Documentation',
          url: 'https://docs.example.com',
        })
      ).rejects.toThrow('Either projectId or projectKey must be provided');
    });
  });

  describe('delete', () => {
    it('should delete a project link', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_links/delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.json();
          expect(body).toEqual({ id: '17' });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.delete({ id: '17' })).resolves.toBeUndefined();
    });
  });

  describe('search', () => {
    it('should search project links by project key', async () => {
      const mockResponse = {
        links: [
          {
            id: '1',
            name: 'Homepage',
            type: 'home',
            url: 'https://example.com',
          },
          {
            id: '2',
            name: 'CI',
            type: 'ci',
            url: 'https://ci.example.com',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/project_links/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            projectKey: 'my-project',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.search({ projectKey: 'my-project' });

      expect(result).toEqual(mockResponse);
    });

    it('should search project links by project ID', async () => {
      const mockResponse = {
        links: [
          {
            id: '3',
            name: 'Issue Tracker',
            type: 'issue',
            url: 'https://issues.example.com',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/project_links/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            projectId: 'AU-Tpxb--iU5OvuD2FLy',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.search({ projectId: 'AU-Tpxb--iU5OvuD2FLy' });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when neither projectId nor projectKey is provided', async () => {
      await expect(client.search({})).rejects.toThrow(
        'Either projectId or projectKey must be provided'
      );
    });
  });
});
