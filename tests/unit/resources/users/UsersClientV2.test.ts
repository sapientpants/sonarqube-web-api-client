// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Mock, MockInstance } from 'vitest';
import { http, HttpResponse } from 'msw';
import { UsersClient } from '../../../../src/resources/users/UsersClient.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import { DeprecationManager } from '../../../../src/core/deprecation/index.js';
import type { SearchUsersV2Response, UserV2 } from '../../../../src/resources/users/types.js';

describe('UsersClient V2 API', () => {
  let client: UsersClient;
  let consoleSpy: MockInstance;

  beforeEach(() => {
    client = new UsersClient('https://sonarqube.example.com', 'test-token');
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    DeprecationManager.clearWarnings();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('searchV2', () => {
    it('should return a SearchUsersV2Builder instance', () => {
      const builder = client.searchV2();
      expect(builder).toBeDefined();
      expect(typeof builder.query).toBe('function');
      expect(typeof builder.ids).toBe('function');
      expect(typeof builder.active).toBe('function');
      expect(typeof builder.includeExternalProvider).toBe('function');
    });

    it('should execute v2 search with query parameter', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [
          {
            id: '1',
            login: 'john.doe',
            name: 'John Doe',
            email: 'john@example.com',
            active: true,
            local: true,
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          expect(new URL(request.url).searchParams.get('query')).toBe('john');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().query('john').execute();

      expect(result.users).toHaveLength(1);
      expect(result.users[0].login).toBe('john.doe');
      expect(result.users[0].id).toBe('1');
      expect(result.page.totalItems).toBe(1);
    });

    it('should execute v2 search with IDs parameter', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [
          {
            id: 'uuid-1',
            login: 'user1',
            name: 'User One',
            active: true,
            local: true,
          },
          {
            id: 'uuid-2',
            login: 'user2',
            name: 'User Two',
            active: true,
            local: false,
            externalProvider: 'github',
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 2,
          totalPages: 1,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          expect(new URL(request.url).searchParams.get('ids')).toBe('uuid-1,uuid-2');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().ids(['uuid-1', 'uuid-2']).execute();

      expect(result.users).toHaveLength(2);
      expect(result.users[0].id).toBe('uuid-1');
      expect(result.users[1].id).toBe('uuid-2');
    });

    it('should execute v2 search with pagination parameters', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [],
        page: {
          pageIndex: 2,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          expect(new URL(request.url).searchParams.get('page')).toBe('2');
          expect(new URL(request.url).searchParams.get('pageSize')).toBe('10');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().page(2).pageSize(10).execute();

      expect(result.page.pageIndex).toBe(2);
      expect(result.page.pageSize).toBe(10);
      expect(result.page.totalPages).toBe(3);
    });

    it('should execute v2 search with active filter', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [
          {
            id: '1',
            login: 'active.user',
            name: 'Active User',
            active: true,
            local: true,
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          expect(new URL(request.url).searchParams.get('active')).toBe('true');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().active(true).execute();

      expect(result.users[0].active).toBe(true);
    });

    it('should execute v2 search with external provider info', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [
          {
            id: '1',
            login: 'external.user',
            name: 'External User',
            active: true,
            local: false,
            externalProvider: 'github',
            externalIdentity: 'github-user',
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          expect(new URL(request.url).searchParams.get('includeExternalProvider')).toBe('true');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().includeExternalProvider(true).execute();

      expect(result.users[0].externalProvider).toBe('github');
      expect(result.users[0].externalIdentity).toBe('github-user');
    });

    it('should handle empty v2 search results', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().execute();

      expect(result.users).toHaveLength(0);
      expect(result.page.totalItems).toBe(0);
    });

    it('should work without any parameters', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [
          {
            id: '1',
            login: 'default.user',
            name: 'Default User',
            active: true,
            local: true,
          },
        ],
        page: {
          pageIndex: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          // Should not have any query parameters
          expect(new URL(request.url).search).toBe('');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchV2().execute();

      expect(result.users).toHaveLength(1);
    });
  });

  describe('searchAllV2', () => {
    it('should return an async iterator for all v2 users', async () => {
      const mockResponse1: SearchUsersV2Response = {
        users: [{ id: '1', login: 'user1', name: 'User 1', active: true, local: true }],
        page: { pageIndex: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      const mockResponse2: SearchUsersV2Response = {
        users: [{ id: '2', login: 'user2', name: 'User 2', active: true, local: true }],
        page: { pageIndex: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', ({ request }) => {
          const page = new URL(request.url).searchParams.get('page') ?? '1';
          if (page === '1') {
            return HttpResponse.json(mockResponse1);
          } else {
            return HttpResponse.json(mockResponse2);
          }
        }),
      );

      const users: UserV2[] = [];
      for await (const user of client.searchAllV2()) {
        users.push(user);
      }

      expect(users).toHaveLength(2);
      expect(users[0].login).toBe('user1');
      expect(users[1].login).toBe('user2');
    });

    it('should handle empty results', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      };

      server.use(
        http.get('https://sonarqube.example.com/api/v2/users/search', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const users: UserV2[] = [];
      for await (const user of client.searchAllV2()) {
        users.push(user);
      }

      expect(users).toHaveLength(0);
    });
  });

  describe('deprecated methods', () => {
    it('should show deprecation warning for search()', () => {
      client.search();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.search()'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.searchV2()'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('August 13th, 2025'));
    });

    it('should show deprecation warning for searchAll()', () => {
      client.searchAll();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.searchAll()'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.searchV2().all()'));
    });

    it('should not show deprecation warning for v2 methods', () => {
      client.searchV2();
      client.searchAllV2();

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
