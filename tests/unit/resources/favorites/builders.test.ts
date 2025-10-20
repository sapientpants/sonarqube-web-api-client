// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { FavoritesClient } from '../../../../src/resources/favorites/FavoritesClient.js';
import type { SearchFavoritesBuilder } from '../../../../src/resources/favorites/builders.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import { assertCommonHeaders, assertQueryParams } from '../../../../src/test-utils/assertions.js';
import { ComponentQualifier } from '../../../../src/resources/components/types.js';
import type { SearchFavoritesResponse } from '../../../../src/resources/favorites/types.js';

describe('Favorites Builders', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: FavoritesClient;

  beforeEach(() => {
    client = new FavoritesClient(baseUrl, token);
  });

  describe('SearchFavoritesBuilder', () => {
    let builder: SearchFavoritesBuilder;

    beforeEach(() => {
      builder = client.search();
    });

    it('should build request with page number', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [],
        paging: {
          pageIndex: 2,
          pageSize: 100,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            p: '2',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await builder.page(2).execute();
      expect(result).toEqual(mockResponse);
    });

    it('should build request with page size', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [],
        paging: {
          pageIndex: 1,
          pageSize: 50,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            ps: '50',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await builder.pageSize(50).execute();
      expect(result).toEqual(mockResponse);
    });

    it('should build request with both page and page size', async () => {
      const mockResponse: SearchFavoritesResponse = {
        favorites: [],
        paging: {
          pageIndex: 3,
          pageSize: 25,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            p: '3',
            ps: '25',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await builder.page(3).pageSize(25).execute();
      expect(result).toEqual(mockResponse);
    });

    it('should iterate through multiple pages using all()', async () => {
      const page1Response: SearchFavoritesResponse = {
        favorites: [
          { key: 'project-1', name: 'Project 1', qualifier: ComponentQualifier.Project },
          { key: 'project-2', name: 'Project 2', qualifier: ComponentQualifier.Project },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 2,
          total: 3,
        },
      };

      const page2Response: SearchFavoritesResponse = {
        favorites: [{ key: 'project-3', name: 'Project 3', qualifier: ComponentQualifier.Project }],
        paging: {
          pageIndex: 2,
          pageSize: 2,
          total: 3,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/favorites/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          const url = new URL(request.url);
          const page = url.searchParams.get('p') ?? '1';

          if (page === '1') {
            return HttpResponse.json(page1Response);
          } else if (page === '2') {
            return HttpResponse.json(page2Response);
          }

          return HttpResponse.json({
            favorites: [],
            paging: { pageIndex: 3, pageSize: 2, total: 3 },
          });
        }),
      );

      const favorites = [];
      for await (const favorite of builder.pageSize(2).all()) {
        favorites.push(favorite);
      }

      expect(favorites).toHaveLength(3);
      expect(favorites[0].key).toBe('project-1');
      expect(favorites[1].key).toBe('project-2');
      expect(favorites[2].key).toBe('project-3');
    });
  });
});
