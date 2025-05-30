import { http, HttpResponse } from 'msw';
import { AuthorizationsClient } from '../AuthorizationsClient';
import { setupServer } from 'msw/node';
import type {
  GroupV2,
  SearchGroupsV2Response,
  GroupMembershipV2,
  SearchGroupMembershipsV2Response,
} from '../types';

const server = setupServer();

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

describe('AuthorizationsClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: AuthorizationsClient;

  beforeEach(() => {
    client = new AuthorizationsClient(baseUrl, token);
  });

  describe('Group Management', () => {
    describe('searchGroupsV2', () => {
      it('should search groups with basic parameters', async () => {
        const mockResponse: SearchGroupsV2Response = {
          groups: [
            {
              id: 'group-1',
              name: 'developers',
              description: 'Development team',
              default: false,
              membersCount: 10,
              permissionsCount: 5,
              managed: false,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
              createdBy: 'admin',
              updatedBy: 'admin',
            },
          ],
          page: {
            pageIndex: 1,
            pageSize: 100,
            total: 1,
          },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/groups`, ({ request }) => {
            const url = new URL(request.url);
            expect(request.headers.get('authorization')).toBe(`Bearer ${token}`);
            expect(url.searchParams.get('query')).toBe('dev');
            expect(url.searchParams.get('pageSize')).toBe('50');
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.searchGroupsV2().query('dev').pageSize(50).execute();

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].name).toBe('developers');
        expect(result.page.total).toBe(1);
      });

      it('should handle managed groups filter', async () => {
        const mockResponse: SearchGroupsV2Response = {
          groups: [],
          page: { pageIndex: 1, pageSize: 100, total: 0 },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/groups`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('managed')).toBe('true');
            expect(url.searchParams.get('externalProvider')).toBe('ldap');
            return HttpResponse.json(mockResponse);
          })
        );

        await client.searchGroupsV2().managed(true).externalProvider('ldap').execute();
      });

      it('should iterate through all groups using pagination', async () => {
        const page1: SearchGroupsV2Response = {
          groups: [
            {
              id: 'group-1',
              name: 'group1',
              default: false,
              membersCount: 5,
              managed: false,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
              createdBy: 'admin',
              updatedBy: 'admin',
            },
          ],
          page: { pageIndex: 1, pageSize: 1, total: 2 },
        };

        const page2: SearchGroupsV2Response = {
          groups: [
            {
              id: 'group-2',
              name: 'group2',
              default: false,
              membersCount: 3,
              managed: false,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
              createdBy: 'admin',
              updatedBy: 'admin',
            },
          ],
          page: { pageIndex: 2, pageSize: 1, total: 2 },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/groups`, ({ request }) => {
            const url = new URL(request.url);
            const page = url.searchParams.get('page');
            return HttpResponse.json(page === '2' ? page2 : page1);
          })
        );

        const groups: GroupV2[] = [];
        for await (const group of client.searchGroupsV2().pageSize(1).all()) {
          groups.push(group);
        }

        expect(groups).toHaveLength(2);
        expect(groups[0].name).toBe('group1');
        expect(groups[1].name).toBe('group2');
      });
    });

    describe('createGroupV2', () => {
      it('should create a new group', async () => {
        const newGroup: GroupV2 = {
          id: 'new-group-id',
          name: 'new-group',
          description: 'New group description',
          default: false,
          membersCount: 0,
          managed: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        };

        server.use(
          http.post(`${baseUrl}/api/v2/authorizations/groups`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              name: 'new-group',
              description: 'New group description',
              default: false,
            });
            return HttpResponse.json(newGroup);
          })
        );

        const result = await client.createGroupV2({
          name: 'new-group',
          description: 'New group description',
          default: false,
        });

        expect(result.id).toBe('new-group-id');
        expect(result.name).toBe('new-group');
      });
    });

    describe('getGroupV2', () => {
      it('should get a single group by ID', async () => {
        const group: GroupV2 = {
          id: 'group-id',
          name: 'developers',
          description: 'Development team',
          default: false,
          membersCount: 10,
          managed: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/groups/group-id`, () => {
            return HttpResponse.json(group);
          })
        );

        const result = await client.getGroupV2('group-id');
        expect(result.name).toBe('developers');
      });
    });

    describe('updateGroupV2', () => {
      it('should update a group', async () => {
        const updatedGroup: GroupV2 = {
          id: 'group-id',
          name: 'senior-developers',
          description: 'Senior development team',
          default: false,
          membersCount: 10,
          managed: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        };

        server.use(
          http.patch(`${baseUrl}/api/v2/authorizations/groups/group-id`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              name: 'senior-developers',
              description: 'Senior development team',
            });
            return HttpResponse.json(updatedGroup);
          })
        );

        const result = await client.updateGroupV2('group-id', {
          name: 'senior-developers',
          description: 'Senior development team',
        });

        expect(result.name).toBe('senior-developers');
      });
    });

    describe('deleteGroupV2', () => {
      it('should delete a group', async () => {
        server.use(
          http.delete(`${baseUrl}/api/v2/authorizations/groups/group-id`, () => {
            return new HttpResponse(null, { status: 204 });
          })
        );

        await expect(client.deleteGroupV2('group-id')).resolves.toBeUndefined();
      });
    });
  });

  describe('Group Membership Management', () => {
    describe('searchGroupMembershipsV2', () => {
      it('should search group memberships by group ID', async () => {
        const mockResponse: SearchGroupMembershipsV2Response = {
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
          page: {
            pageIndex: 1,
            pageSize: 100,
            total: 1,
          },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/group-memberships`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('groupIds')).toBe('group-1');
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.searchGroupMembershipsV2().groupId('group-1').execute();

        expect(result.memberships).toHaveLength(1);
        expect(result.memberships[0].groupName).toBe('developers');
      });

      it('should search group memberships by user ID', async () => {
        const mockResponse: SearchGroupMembershipsV2Response = {
          memberships: [
            {
              id: 'membership-1',
              groupId: 'group-1',
              groupName: 'developers',
              userId: 'user-1',
              userLogin: 'john.doe',
              createdAt: '2023-01-01T00:00:00Z',
            },
            {
              id: 'membership-2',
              groupId: 'group-2',
              groupName: 'administrators',
              userId: 'user-1',
              userLogin: 'john.doe',
              createdAt: '2023-01-01T00:00:00Z',
            },
          ],
          page: {
            pageIndex: 1,
            pageSize: 100,
            total: 2,
          },
        };

        server.use(
          http.get(`${baseUrl}/api/v2/authorizations/group-memberships`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('userIds')).toBe('user-1');
            return HttpResponse.json(mockResponse);
          })
        );

        const result = await client.searchGroupMembershipsV2().userId('user-1').execute();

        expect(result.memberships).toHaveLength(2);
      });
    });

    describe('addGroupMembershipV2', () => {
      it('should add a user to a group', async () => {
        const newMembership: GroupMembershipV2 = {
          id: 'new-membership-id',
          groupId: 'group-1',
          groupName: 'developers',
          userId: 'user-1',
          userLogin: 'john.doe',
          createdAt: '2023-01-01T00:00:00Z',
        };

        server.use(
          http.post(`${baseUrl}/api/v2/authorizations/group-memberships`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              groupId: 'group-1',
              userId: 'user-1',
            });
            return HttpResponse.json(newMembership);
          })
        );

        const result = await client.addGroupMembershipV2({
          groupId: 'group-1',
          userId: 'user-1',
        });

        expect(result.id).toBe('new-membership-id');
      });
    });

    describe('removeGroupMembershipV2', () => {
      it('should remove a group membership', async () => {
        server.use(
          http.delete(`${baseUrl}/api/v2/authorizations/group-memberships/membership-id`, () => {
            return new HttpResponse(null, { status: 204 });
          })
        );

        await expect(client.removeGroupMembershipV2('membership-id')).resolves.toBeUndefined();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/v2/authorizations/groups`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Unauthorized',
                code: 'unauthorized',
              },
            },
            { status: 401 }
          );
        })
      );

      await expect(client.searchGroupsV2().execute()).rejects.toThrow();
    });

    it('should handle validation errors for managed groups', async () => {
      server.use(
        http.patch(`${baseUrl}/api/v2/authorizations/groups/managed-group`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Cannot update managed group',
                code: 'validation_error',
              },
            },
            { status: 400 }
          );
        })
      );

      await expect(client.updateGroupV2('managed-group', { name: 'new-name' })).rejects.toThrow();
    });
  });
});
