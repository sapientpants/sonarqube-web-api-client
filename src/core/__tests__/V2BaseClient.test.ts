/**
 * Tests for V2BaseClient
 */

import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/msw/server';
import { V2BaseClient } from '../V2BaseClient';
import type { V2PaginatedResponse } from '../types/v2-common';

// Create a test implementation
class TestV2Client extends V2BaseClient {
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token ?? '');
  }

  // Expose protected methods for testing
  async testRequestV2<T>(url: string, options?: RequestInit): Promise<T> {
    return this.requestV2<T>(url, options);
  }

  async *testIterateV2Pages<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    pageSize?: number
  ): AsyncIterableIterator<T> {
    yield* this.iterateV2Pages<T>(endpoint, params, pageSize);
  }

  async testGetAllV2Items<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    maxItems?: number
  ): Promise<T[]> {
    return this.getAllV2Items<T>(endpoint, params, maxItems);
  }

  testBuildV2Query(params: Record<string, unknown>): string {
    return this.buildV2Query(params);
  }
}

describe('V2BaseClient', () => {
  let client: TestV2Client;

  beforeEach(() => {
    client = new TestV2Client('http://localhost:9000', 'test-token');
  });

  describe('buildV2Query', () => {
    it('should build query string with pagination parameters', () => {
      const query = client.testBuildV2Query({
        page: 2,
        pageSize: 50,
        sort: 'name',
        order: 'desc',
      });

      expect(query).toBe('page=2&pageSize=50&sort=name&order=desc');
    });

    it('should handle array parameters as comma-separated values', () => {
      const query = client.testBuildV2Query({
        tags: ['java', 'spring', 'security'],
        status: ['OPEN', 'CONFIRMED'],
      });

      expect(query).toBe('tags=java%2Cspring%2Csecurity&status=OPEN%2CCONFIRMED');
    });

    it('should handle boolean parameters', () => {
      const query = client.testBuildV2Query({
        active: true,
        archived: false,
      });

      expect(query).toBe('active=true&archived=false');
    });

    it('should skip null and undefined values', () => {
      const query = client.testBuildV2Query({
        name: 'test',
        description: null,
        tags: undefined,
        active: true,
      });

      expect(query).toBe('name=test&active=true');
    });

    it('should encode special characters', () => {
      const query = client.testBuildV2Query({
        name: 'test project',
        query: 'status:OPEN & priority:HIGH',
      });

      expect(query).toBe('name=test+project&query=status%3AOPEN+%26+priority%3AHIGH');
    });
  });

  describe('requestV2', () => {
    it('should make successful v2 API request', async () => {
      const responseData = { id: '123', name: 'Test' };

      server.use(
        http.get('http://localhost:9000/api/v2/test', ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');
          expect(request.headers.get('Accept')).toBe('application/json');
          expect(request.headers.get('Content-Type')).toBe('application/json');
          return HttpResponse.json(responseData, { status: 200 });
        })
      );

      const result = await client.testRequestV2<typeof responseData>('/api/v2/test');
      expect(result).toEqual(responseData);
    });

    it('should handle 204 No Content response', async () => {
      server.use(
        http.delete('http://localhost:9000/api/v2/test/123', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const result = await client.testRequestV2('/api/v2/test/123', {
        method: 'DELETE',
      });
      expect(result).toEqual({});
    });

    it('should handle v2 error response format', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/test', () => {
          return HttpResponse.json(
            {
              status: 400,
              error: {
                message: 'Invalid request parameters',
                code: 'INVALID_PARAMS',
                validations: [
                  {
                    field: 'projectKey',
                    message: 'Project key is required',
                    code: 'REQUIRED',
                  },
                ],
              },
            },
            { status: 400 }
          );
        })
      );

      await expect(client.testRequestV2('/api/v2/test')).rejects.toThrow(
        'Invalid request parameters'
      );
    });

    it('should merge custom headers', async () => {
      server.use(
        http.post('http://localhost:9000/api/v2/test', ({ request }) => {
          expect(request.headers.get('X-Custom-Header')).toBe('custom-value');
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');
          return HttpResponse.json({ created: true }, { status: 201 });
        })
      );

      await client.testRequestV2('/api/v2/test', {
        method: 'POST',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });
    });
  });

  describe('iterateV2Pages', () => {
    it('should iterate through paginated results', async () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
        { id: '4', name: 'Item 4' },
        { id: '5', name: 'Item 5' },
      ];

      server.use(
        http.get('http://localhost:9000/api/v2/items', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') ?? '1');
          const pageSize = parseInt(url.searchParams.get('pageSize') ?? '2');

          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const pageItems = items.slice(startIndex, endIndex);

          const response: V2PaginatedResponse<(typeof items)[0]> = {
            data: pageItems,
            page: {
              pageIndex: page,
              pageSize,
              total: items.length,
            },
          };

          return HttpResponse.json(response, { status: 200 });
        })
      );

      const results: Array<(typeof items)[0]> = [];
      for await (const item of client.testIterateV2Pages<(typeof items)[0]>(
        '/api/v2/items',
        {},
        2
      )) {
        results.push(item);
      }

      expect(results).toHaveLength(5);
      expect(results).toEqual(items);
    });

    it('should handle empty results', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/items', () => {
          const response: V2PaginatedResponse<{ id: string }> = {
            data: [],
            page: {
              pageIndex: 1,
              pageSize: 100,
              total: 0,
            },
          };
          return HttpResponse.json(response, { status: 200 });
        })
      );

      const results: Array<{ id: string }> = [];
      for await (const item of client.testIterateV2Pages<{ id: string }>('/api/v2/items')) {
        results.push(item);
      }

      expect(results).toHaveLength(0);
    });

    it('should pass query parameters correctly', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/items', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('filter')).toBe('active');
          expect(url.searchParams.get('sort')).toBe('name');

          const response: V2PaginatedResponse<{ id: string }> = {
            data: [{ id: '1' }],
            page: {
              pageIndex: 1,
              pageSize: 100,
              total: 1,
            },
          };
          return HttpResponse.json(response, { status: 200 });
        })
      );

      const results: Array<{ id: string }> = [];
      for await (const item of client.testIterateV2Pages<{ id: string }>('/api/v2/items', {
        filter: 'active',
        sort: 'name',
      })) {
        results.push(item);
      }

      expect(results).toHaveLength(1);
    });
  });

  describe('getAllV2Items', () => {
    it('should get all items from paginated endpoint', async () => {
      const allItems = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${String(i + 1)}`,
      }));

      server.use(
        http.get('http://localhost:9000/api/v2/items', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') ?? '1');
          const pageSize = parseInt(url.searchParams.get('pageSize') ?? '100');

          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const pageItems = allItems.slice(startIndex, endIndex);

          const response: V2PaginatedResponse<(typeof allItems)[0]> = {
            data: pageItems,
            page: {
              pageIndex: page,
              pageSize,
              total: allItems.length,
            },
          };

          return HttpResponse.json(response, { status: 200 });
        })
      );

      const results = await client.testGetAllV2Items<(typeof allItems)[0]>('/api/v2/items');
      expect(results).toHaveLength(25);
      expect(results).toEqual(allItems);
    });

    it('should respect maxItems limit', async () => {
      const allItems = Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));

      server.use(
        http.get('http://localhost:9000/api/v2/items', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') ?? '1');
          const pageSize = parseInt(url.searchParams.get('pageSize') ?? '100');

          const response: V2PaginatedResponse<(typeof allItems)[0]> = {
            data: allItems.slice((page - 1) * pageSize, page * pageSize),
            page: {
              pageIndex: page,
              pageSize,
              total: allItems.length,
            },
          };

          return HttpResponse.json(response, { status: 200 });
        })
      );

      const results = await client.testGetAllV2Items<(typeof allItems)[0]>('/api/v2/items', {}, 10);
      expect(results).toHaveLength(10);
    });
  });

  describe('download functionality (inherited from mixin)', () => {
    it('should have download methods available', () => {
      expect(typeof client.downloadWithProgress).toBe('function');
      expect(typeof client.requestText).toBe('function');
    });

    it('should download files with progress', async () => {
      const binaryData = new Uint8Array([0x50, 0x44, 0x46]); // PDF header

      server.use(
        http.get('http://localhost:9000/api/v2/download/file', () => {
          return HttpResponse.arrayBuffer(binaryData, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Length': '3',
            },
          });
        })
      );

      const progressUpdates: number[] = [];
      const result = await client.downloadWithProgress('/api/v2/download/file', {
        onProgress: (progress) => {
          progressUpdates.push(progress.percentage);
        },
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(3);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });
});
