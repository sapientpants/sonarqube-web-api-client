/* eslint-disable @typescript-eslint/no-unused-vars */
import { UsersClient } from '../UsersClient';
import { SearchUsersBuilder, GetUserGroupsBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
// import { ValidationError } from '../../../errors';

const mockBaseUrl = 'https://sonarqube.example.com';
const mockToken = 'test-token';
const mockOrganization = 'test-org';

describe('UsersClient', () => {
  let client: UsersClient;

  beforeEach(() => {
    client = new UsersClient(mockBaseUrl, mockToken, mockOrganization);
  });

  describe('search', () => {
    it('should return a SearchUsersBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchUsersBuilder);
    });

    it('should execute search with query parameter', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('john');
          return HttpResponse.json({
            users: [
              {
                login: 'john.doe',
                name: 'John Doe',
                active: true,
                avatar: 'avatar-hash',
              },
            ],
            paging: {
              pageIndex: 1,
              pageSize: 50,
              total: 1,
            },
          });
        })
      );

      const result = await client.search().query('john').execute();
      expect(result.users).toHaveLength(1);
      expect(result.users[0].login).toBe('john.doe');
      expect(result.users[0].name).toBe('John Doe');
      expect(result.users[0].active).toBe(true);
    });

    it('should execute search with IDs parameter', async () => {
      const testIds = ['uuid-1', 'uuid-2'];
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('ids')).toBe('uuid-1,uuid-2');
          return HttpResponse.json({
            users: [
              { login: 'user1', name: 'User 1', active: true },
              { login: 'user2', name: 'User 2', active: true },
            ],
            paging: { pageIndex: 1, pageSize: 50, total: 2 },
          });
        })
      );

      const result = await client.search().ids(testIds).execute();
      expect(result.users).toHaveLength(2);
    });

    it('should execute search with pagination parameters', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('p')).toBe('2');
          expect(url.searchParams.get('ps')).toBe('25');
          return HttpResponse.json({
            users: [],
            paging: { pageIndex: 2, pageSize: 25, total: 0 },
          });
        })
      );

      const result = await client.search().page(2).pageSize(25).execute();
      expect(result.paging.pageIndex).toBe(2);
      expect(result.paging.pageSize).toBe(25);
    });

    it('should execute search without parameters', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          const url = new URL(request.url);
          // Should not have any meaningful query parameters (q, ids, p, ps)
          expect(url.searchParams.get('q')).toBeNull();
          expect(url.searchParams.get('ids')).toBeNull();
          expect(url.searchParams.get('p')).toBeNull();
          expect(url.searchParams.get('ps')).toBeNull();
          return HttpResponse.json({
            users: [{ login: 'default', name: 'Default User', active: true }],
            paging: { pageIndex: 1, pageSize: 50, total: 1 },
          });
        })
      );

      const result = await client.search().execute();
      expect(result.users).toHaveLength(1);
    });

    it('should handle search with detailed user information', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          return HttpResponse.json({
            users: [
              {
                login: 'admin',
                name: 'Administrator',
                active: true,
                avatar: 'admin-avatar',
                email: 'admin@example.com',
                externalIdentity: 'external-id',
                externalProvider: 'LDAP',
                groups: ['administrators', 'developers'],
                lastConnectionDate: '2024-01-01T12:00:00Z',
                tokensCount: 3,
              },
            ],
            paging: { pageIndex: 1, pageSize: 50, total: 1 },
          });
        })
      );

      const result = await client.search().execute();
      const user = result.users[0];
      expect(user.email).toBe('admin@example.com');
      expect(user.externalIdentity).toBe('external-id');
      expect(user.externalProvider).toBe('LDAP');
      expect(user.groups).toEqual(['administrators', 'developers']);
      expect(user.lastConnectionDate).toBe('2024-01-01T12:00:00Z');
      expect(user.tokensCount).toBe(3);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          return HttpResponse.json(
            { errors: [{ msg: 'Authentication required' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.search().execute()).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          return HttpResponse.json({ errors: [{ msg: 'Internal server error' }] }, { status: 500 });
        })
      );

      await expect(client.search().execute()).rejects.toThrow();
    });
  });

  describe('searchAll', () => {
    it('should return an async iterator for all users', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('p') ?? '1');
          if (page === 1) {
            return HttpResponse.json({
              users: [
                { login: 'user1', name: 'User 1', active: true },
                { login: 'user2', name: 'User 2', active: true },
              ],
              paging: { pageIndex: 1, pageSize: 2, total: 3 },
            });
          } else if (page === 2) {
            return HttpResponse.json({
              users: [{ login: 'user3', name: 'User 3', active: true }],
              paging: { pageIndex: 2, pageSize: 2, total: 3 },
            });
          }
          return HttpResponse.json({
            users: [],
            paging: { pageIndex: page, pageSize: 2, total: 3 },
          });
        })
      );

      const users = [];
      for await (const user of client.searchAll()) {
        users.push(user);
      }

      expect(users).toHaveLength(3);
      expect(users[0].login).toBe('user1');
      expect(users[1].login).toBe('user2');
      expect(users[2].login).toBe('user3');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/search`, ({ request }) => {
          return HttpResponse.json({
            users: [],
            paging: { pageIndex: 1, pageSize: 50, total: 0 },
          });
        })
      );

      const users = [];
      for await (const user of client.searchAll()) {
        users.push(user);
      }

      expect(users).toHaveLength(0);
    });
  });

  describe('groups', () => {
    it('should return a GetUserGroupsBuilder instance', () => {
      const builder = client.groups();
      expect(builder).toBeInstanceOf(GetUserGroupsBuilder);
    });

    it('should execute groups request with required parameters', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('organization')).toBe('my-org');
          return HttpResponse.json({
            groups: [
              {
                name: 'developers',
                description: 'Development team',
                default: false,
                selected: true,
              },
              {
                name: 'users',
                description: 'All users',
                default: true,
                selected: true,
              },
            ],
            paging: { pageIndex: 1, pageSize: 25, total: 2 },
          });
        })
      );

      const result = await client.groups().login('john.doe').organization('my-org').execute();

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].name).toBe('developers');
      expect(result.groups[0].description).toBe('Development team');
      expect(result.groups[0].default).toBe(false);
      expect(result.groups[0].selected).toBe(true);
      expect(result.groups[1].default).toBe(true);
    });

    it('should execute groups request with query filter', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('admin');
          return HttpResponse.json({
            groups: [
              {
                name: 'administrators',
                description: 'System administrators',
                default: false,
                selected: false,
              },
            ],
            paging: { pageIndex: 1, pageSize: 25, total: 1 },
          });
        })
      );

      const result = await client
        .groups()
        .login('john.doe')
        .organization('my-org')
        .query('admin')
        .execute();

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('administrators');
    });

    it('should execute groups request with selection filter', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('selected')).toBe('all');
          return HttpResponse.json({
            groups: [
              { name: 'group1', selected: true },
              { name: 'group2', selected: false },
            ],
            paging: { pageIndex: 1, pageSize: 25, total: 2 },
          });
        })
      );

      const result = await client
        .groups()
        .login('john.doe')
        .organization('my-org')
        .selected('all')
        .execute();

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].selected).toBe(true);
      expect(result.groups[1].selected).toBe(false);
    });

    it('should execute groups request with pagination parameters', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('p')).toBe('2');
          expect(url.searchParams.get('ps')).toBe('10');
          return HttpResponse.json({
            groups: [],
            paging: { pageIndex: 2, pageSize: 10, total: 15 },
          });
        })
      );

      const result = await client
        .groups()
        .login('john.doe')
        .organization('my-org')
        .page(2)
        .pageSize(10)
        .execute();

      expect(result.paging.pageIndex).toBe(2);
      expect(result.paging.pageSize).toBe(10);
    });

    it('should handle groups with minimal information', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          return HttpResponse.json({
            groups: [
              { name: 'simple-group' }, // Minimal group info
            ],
            paging: { pageIndex: 1, pageSize: 25, total: 1 },
          });
        })
      );

      const result = await client.groups().login('john.doe').organization('my-org').execute();

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('simple-group');
      expect(result.groups[0].description).toBeUndefined();
      expect(result.groups[0].default).toBeUndefined();
      expect(result.groups[0].selected).toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          return HttpResponse.json(
            { errors: [{ msg: 'Authentication required' }] },
            { status: 401 }
          );
        })
      );

      await expect(
        client.groups().login('john.doe').organization('my-org').execute()
      ).rejects.toThrow();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient permissions' }] },
            { status: 403 }
          );
        })
      );

      await expect(
        client.groups().login('john.doe').organization('my-org').execute()
      ).rejects.toThrow();
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          return HttpResponse.json({ errors: [{ msg: 'User not found' }] }, { status: 404 });
        })
      );

      await expect(
        client.groups().login('nonexistent').organization('my-org').execute()
      ).rejects.toThrow();
    });
  });

  describe('groupsAll', () => {
    it('should return an async iterator for all groups', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('p') ?? '1');
          if (page === 1) {
            return HttpResponse.json({
              groups: [
                { name: 'group1', description: 'Group 1' },
                { name: 'group2', description: 'Group 2' },
              ],
              paging: { pageIndex: 1, pageSize: 2, total: 3 },
            });
          } else if (page === 2) {
            return HttpResponse.json({
              groups: [{ name: 'group3', description: 'Group 3' }],
              paging: { pageIndex: 2, pageSize: 2, total: 3 },
            });
          }
          return HttpResponse.json({
            groups: [],
            paging: { pageIndex: page, pageSize: 2, total: 3 },
          });
        })
      );

      const groups = [];
      for await (const group of client.groupsAll('john.doe', 'my-org')) {
        groups.push(group);
      }

      expect(groups).toHaveLength(3);
      expect(groups[0].name).toBe('group1');
      expect(groups[1].name).toBe('group2');
      expect(groups[2].name).toBe('group3');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${mockBaseUrl}/api/users/groups`, ({ request }) => {
          return HttpResponse.json({
            groups: [],
            paging: { pageIndex: 1, pageSize: 25, total: 0 },
          });
        })
      );

      const groups = [];
      for await (const group of client.groupsAll('john.doe', 'my-org')) {
        groups.push(group);
      }

      expect(groups).toHaveLength(0);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new UsersClient(mockBaseUrl, mockToken, mockOrganization);
      expect(clientWithOrg).toBeInstanceOf(UsersClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new UsersClient(mockBaseUrl, mockToken);
      expect(clientWithoutOrg).toBeInstanceOf(UsersClient);
    });
  });
});
