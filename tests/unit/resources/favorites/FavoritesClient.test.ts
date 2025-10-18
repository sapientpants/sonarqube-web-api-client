// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { FavoritesClient } from '../../../../src/resources/favorites/FavoritesClient';
import { server } from '../../../../src/test-utils/msw/server';
import {
  assertCommonHeaders,
  assertRequestBody,
  assertQueryParams,
} from '../../../../src/test-utils/assertions';
import { ComponentQualifier } from '../../../../src/resources/components/types';
import type { SearchFavoritesResponse } from '../../../../src/resources/favorites/types';

describe('FavoritesClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: FavoritesClient;

  beforeEach(() => {
    client = new FavoritesClient(baseUrl, token);
  });

  describe('add', () => {
    it('should add a component as favorite', async () => {
      server.use(
        http.post(`${baseUrl}/api/favorites/add`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            component: 'my-project',
          });
          return HttpResponse.json({});
        }),
      );

      await client.add({
        component: 'my-project',
      });
    });
  });

  describe('remove', () => {
    it('should remove a component from favorites', async () => {
      server.use(
        http.post(`${baseUrl}/api/favorites/remove`, async ({ request }) => {
          assertCommonHeaders(request, token);
          await assertRequestBody(request, {
            component: 'my-project',
          });
          return HttpResponse.json({});
        }),
      );

      await client.remove({
        component: 'my-project',
      });
    });
  });

  describe('search', () => {
    it('should create a SearchFavoritesBuilder', () => {
      const builder = client.search();
      expect(builder).toBeDefined();
      expect(typeof builder.page).toBe('function');
      expect(typeof builder.pageSize).toBe('function');
      expect(typeof builder.execute).toBe('function');
      expect(typeof builder.all).toBe('function');
    });

    it('should search favorites without parameters', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [
          {
            key: 'my-project',
            name: 'My Project',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          // No query parameters expected for default search
          expect(new URL(request.url).search).toBe('');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.search().execute();
      expect(result).toEqual(mockResponse);
    });

    it('should search favorites with pagination parameters', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [
          {
            key: 'my-project',
            name: 'My Project',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 2,
          pageSize: 50,
          total: 75,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            p: '2',
            ps: '50',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.search().page(2).pageSize(50).execute();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchAll', () => {
    it('should return an async iterator for all favorites', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [
          {
            key: 'project-1',
            name: 'Project 1',
            qualifier: ComponentQualifier.Project,
          },
          {
            key: 'project-2',
            name: 'Project 2',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            p: '1',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const favorites = [];
      for await (const favorite of client.searchAll()) {
        favorites.push(favorite);
      }

      expect(favorites).toHaveLength(2);
      expect(favorites[0].key).toBe('project-1');
      expect(favorites[1].key).toBe('project-2');
    });
  });
});
