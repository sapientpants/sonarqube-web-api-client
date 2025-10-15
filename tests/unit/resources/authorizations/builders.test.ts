// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import {
  SearchGroupsV2Builder,
  SearchGroupMembershipsV2Builder,
} from '../../../../src/resources/authorizations/builders';
import type {
  SearchGroupsV2Request,
  SearchGroupsV2Response,
  SearchGroupMembershipsV2Request,
  SearchGroupMembershipsV2Response,
} from '../../../../src/resources/authorizations/types';

describe('Authorizations Builders', () => {
  describe('SearchGroupsV2Builder', () => {
    let builder: SearchGroupsV2Builder;
    let mockExecute: Mock;

    beforeEach(() => {
      mockExecute = vi.fn();
      builder = new SearchGroupsV2Builder(mockExecute);
    });

    describe('fluent interface', () => {
      it('should build search with all parameters', () => {
        builder
          .query('developers')
          .managed(false)
          .includeDefault(true)
          .externalProvider('ldap')
          .includePermissions(true)
          .minMembers(5)
          .maxMembers(50)
          .page(2)
          .pageSize(25);

        expect(builder['params']).toEqual({
          query: 'developers',
          managed: false,
          includeDefault: true,
          externalProvider: 'ldap',
          includePermissions: true,
          minMembers: 5,
          maxMembers: 50,
          page: 2,
          pageSize: 25,
        } as SearchGroupsV2Request);
      });

      it('should allow method chaining', () => {
        const result = builder.query('admin').managed(true).pageSize(50);

        expect(result).toBe(builder);
      });
    });

    describe('execute', () => {
      it('should call executor with params', async () => {
        const mockResponse: SearchGroupsV2Response = {
          groups: [],
          page: { pageIndex: 1, pageSize: 100, total: 0 },
        };
        mockExecute.mockResolvedValue(mockResponse);

        const result = await builder.query('test').managed(false).execute();

        expect(mockExecute).toHaveBeenCalledWith({
          query: 'test',
          managed: false,
        });
        expect(result).toBe(mockResponse);
      });
    });

    describe('pagination', () => {
      it('should extract items correctly', () => {
        const response: SearchGroupsV2Response = {
          groups: [
            {
              id: 'group-1',
              name: 'developers',
              default: false,
              membersCount: 10,
              managed: false,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
              createdBy: 'admin',
              updatedBy: 'admin',
            },
          ],
          page: { pageIndex: 1, pageSize: 100, total: 1 },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(response.groups);
      });

      it('should check for more pages correctly', () => {
        const response: SearchGroupsV2Response = {
          groups: [],
          page: { pageIndex: 2, pageSize: 50, total: 200 },
        };

        // Total 200 items, 50 per page = 4 pages total
        // Current page is 2, so there should be more pages
        const hasMore = builder['hasMorePages'](response, 2);
        expect(hasMore).toBe(true);

        // On page 4, there should be no more pages
        const noMore = builder['hasMorePages'](response, 4);
        expect(noMore).toBe(false);
      });

      it('should support v2 pagination parameters', () => {
        builder.page(3).pageSize(25);

        expect(builder['params']).toMatchObject({
          page: 3,
          pageSize: 25,
        });
      });
    });
  });

  describe('SearchGroupMembershipsV2Builder', () => {
    let builder: SearchGroupMembershipsV2Builder;
    let mockExecute: Mock;

    beforeEach(() => {
      mockExecute = vi.fn();
      builder = new SearchGroupMembershipsV2Builder(mockExecute);
    });

    describe('fluent interface', () => {
      it('should build search with all parameters', () => {
        builder
          .groupIds(['group-1', 'group-2'])
          .userIds(['user-1', 'user-2'])
          .query('john')
          .page(1)
          .pageSize(50);

        expect(builder['params']).toEqual({
          groupIds: ['group-1', 'group-2'],
          userIds: ['user-1', 'user-2'],
          query: 'john',
          page: 1,
          pageSize: 50,
        } as SearchGroupMembershipsV2Request);
      });

      it('should support single ID convenience methods', () => {
        builder.groupId('single-group').userId('single-user');

        expect(builder['params']).toEqual({
          groupIds: ['single-group'],
          userIds: ['single-user'],
        });
      });

      it('should override arrays when using single ID methods', () => {
        builder
          .groupIds(['group-1', 'group-2'])
          .groupId('single-group')
          .userIds(['user-1', 'user-2'])
          .userId('single-user');

        expect(builder['params']).toEqual({
          groupIds: ['single-group'],
          userIds: ['single-user'],
        });
      });
    });

    describe('execute', () => {
      it('should call executor with params', async () => {
        const mockResponse: SearchGroupMembershipsV2Response = {
          memberships: [],
          page: { pageIndex: 1, pageSize: 100, total: 0 },
        };
        mockExecute.mockResolvedValue(mockResponse);

        const result = await builder.groupId('group-1').query('john').execute();

        expect(mockExecute).toHaveBeenCalledWith({
          groupIds: ['group-1'],
          query: 'john',
        });
        expect(result).toBe(mockResponse);
      });
    });

    describe('pagination', () => {
      it('should extract items correctly', () => {
        const response: SearchGroupMembershipsV2Response = {
          memberships: [
            {
              id: 'membership-1',
              groupId: 'group-1',
              groupName: 'developers',
              userId: 'user-1',
              userLogin: 'john.doe',
              createdAt: '2023-01-01T00:00:00Z',
            },
          ],
          page: { pageIndex: 1, pageSize: 100, total: 1 },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(response.memberships);
      });

      it('should check for more pages correctly', () => {
        const response: SearchGroupMembershipsV2Response = {
          memberships: [],
          page: { pageIndex: 3, pageSize: 25, total: 75 },
        };

        // Total 75 items, 25 per page = 3 pages total
        // Current page is 3, so there should be no more pages
        const noMore = builder['hasMorePages'](response, 3);
        expect(noMore).toBe(false);

        // On page 2, there should be more pages
        const hasMore = builder['hasMorePages'](response, 2);
        expect(hasMore).toBe(true);
      });
    });
  });
});
