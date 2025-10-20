// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { SearchUsersV2Builder } from '../../../../src/resources/users/buildersV2.js';
import type {
  SearchUsersV2Request,
  SearchUsersV2Response,
  UserV2,
} from '../../../../src/resources/users/types.js';

describe('SearchUsersV2Builder', () => {
  let mockExecutor: Mock;
  let builder: SearchUsersV2Builder;

  beforeEach(() => {
    mockExecutor = vi.fn();
    builder = new SearchUsersV2Builder(mockExecutor);
  });

  describe('parameter setting methods', () => {
    it('should set ids parameter', () => {
      const result = builder.ids(['uuid-1', 'uuid-2']);
      expect(result).toBe(builder);
      expect(builder['params'].ids).toEqual(['uuid-1', 'uuid-2']);
    });

    it('should set query parameter', () => {
      const result = builder.query('john');
      expect(result).toBe(builder);
      expect(builder['params'].query).toBe('john');
    });

    it('should set active parameter with default value', () => {
      const result = builder.active();
      expect(result).toBe(builder);
      expect(builder['params'].active).toBe(true);
    });

    it('should set active parameter with custom value', () => {
      const result = builder.active(false);
      expect(result).toBe(builder);
      expect(builder['params'].active).toBe(false);
    });

    it('should set includeExternalProvider parameter with default value', () => {
      const result = builder.includeExternalProvider();
      expect(result).toBe(builder);
      expect(builder['params'].includeExternalProvider).toBe(true);
    });

    it('should set includeExternalProvider parameter with custom value', () => {
      const result = builder.includeExternalProvider(false);
      expect(result).toBe(builder);
      expect(builder['params'].includeExternalProvider).toBe(false);
    });

    it('should set page parameter', () => {
      const result = builder.page(2);
      expect(result).toBe(builder);
      expect(builder['params'].page).toBe(2);
    });

    it('should set pageSize parameter', () => {
      const result = builder.pageSize(25);
      expect(result).toBe(builder);
      expect(builder['params'].pageSize).toBe(25);
    });
  });

  describe('method chaining', () => {
    it('should chain multiple parameter methods', () => {
      const result = builder
        .query('john')
        .active(true)
        .page(2)
        .pageSize(10)
        .includeExternalProvider(true)
        .ids(['uuid-1']);

      expect(result).toBe(builder);
      expect(builder['params']).toEqual({
        query: 'john',
        active: true,
        page: 2,
        pageSize: 10,
        includeExternalProvider: true,
        ids: ['uuid-1'],
      });
    });

    it('should override previous values when called multiple times', () => {
      builder.query('john').query('jane').active(true).active(false);

      expect(builder['params'].query).toBe('jane');
      expect(builder['params'].active).toBe(false);
    });
  });

  describe('execute', () => {
    it('should call executor with params', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      };
      mockExecutor.mockResolvedValue(mockResponse);

      const params: SearchUsersV2Request = { query: 'test', page: 1 };
      builder.query('test').page(1);

      const result = await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResponse);
    });
  });

  describe('getItems', () => {
    it('should extract users from response', () => {
      const users: UserV2[] = [
        { id: '1', login: 'user1', name: 'User 1', active: true, local: true },
        { id: '2', login: 'user2', name: 'User 2', active: true, local: false },
      ];

      const response: SearchUsersV2Response = {
        users,
        page: { pageIndex: 1, pageSize: 50, totalItems: 2, totalPages: 1 },
      };

      const result = builder['getItems'](response);
      expect(result).toBe(users);
    });

    it('should handle empty users array', () => {
      const response: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      };

      const result = builder['getItems'](response);
      expect(result).toEqual([]);
    });
  });

  describe('pagination', () => {
    it('should return next page params when more pages available', () => {
      const currentParams: SearchUsersV2Request = { page: 1, pageSize: 10 };
      const response: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 10, totalItems: 25, totalPages: 3 },
      };

      const nextParams = builder['getNextPageParams'](response, currentParams);

      expect(nextParams).toEqual({ page: 2, pageSize: 10 });
    });

    it('should return null when on last page', () => {
      const currentParams: SearchUsersV2Request = { page: 3, pageSize: 10 };
      const response: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 3, pageSize: 10, totalItems: 25, totalPages: 3 },
      };

      const nextParams = builder['getNextPageParams'](response, currentParams);

      expect(nextParams).toBeNull();
    });

    it('should handle default page number', () => {
      const currentParams: SearchUsersV2Request = { pageSize: 10 };
      const response: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 10, totalItems: 25, totalPages: 3 },
      };

      const nextParams = builder['getNextPageParams'](response, currentParams);

      expect(nextParams).toEqual({ page: 2, pageSize: 10 });
    });
  });

  describe('iterator functionality', () => {
    it('should iterate through all users across multiple pages', async () => {
      const mockResponse1: SearchUsersV2Response = {
        users: [{ id: '1', login: 'user1', name: 'User 1', active: true, local: true }],
        page: { pageIndex: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      const mockResponse2: SearchUsersV2Response = {
        users: [{ id: '2', login: 'user2', name: 'User 2', active: true, local: true }],
        page: { pageIndex: 2, pageSize: 1, totalItems: 2, totalPages: 2 },
      };

      mockExecutor.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const users: UserV2[] = [];
      for await (const user of builder.pageSize(1).all()) {
        users.push(user);
      }

      expect(users).toHaveLength(2);
      expect(users[0].login).toBe('user1');
      expect(users[1].login).toBe('user2');
      expect(mockExecutor).toHaveBeenCalledTimes(2);
    });

    it('should handle empty results', async () => {
      const mockResponse: SearchUsersV2Response = {
        users: [],
        page: { pageIndex: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      };

      mockExecutor.mockResolvedValue(mockResponse);

      const users: UserV2[] = [];
      for await (const user of builder.all()) {
        users.push(user);
      }

      expect(users).toHaveLength(0);
      expect(mockExecutor).toHaveBeenCalledTimes(1);
    });
  });
});
