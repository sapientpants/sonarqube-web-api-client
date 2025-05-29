import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { SonarQubeClient } from '../../../index';
import { ValidationError } from '../../../errors';

describe('UserGroupsClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  const organization = 'test-org';
  const client = new SonarQubeClient(baseUrl, token, organization);

  describe('addUser', () => {
    it('should add a user to a group by ID', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/add_user`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.addUser({
          id: '42',
          login: 'john.doe',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should add a user to a group by name', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/add_user`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.addUser({
          name: 'sonar-administrators',
          login: 'jane.smith',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when neither id nor name is provided', async () => {
      await expect(
        client.userGroups.addUser({
          login: 'john.doe',
          organization: 'test-org',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const mockResponse = {
        group: {
          id: '42',
          name: 'developers',
          description: 'All developers',
          membersCount: 0,
          default: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/user_groups/create`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups.create({
        name: 'developers',
        description: 'All developers',
        organization: 'test-org',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete a group by ID', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/delete`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.delete({
          id: '42',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should delete a group by name', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/delete`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.delete({
          name: 'old-team',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when neither id nor name is provided', async () => {
      await expect(
        client.userGroups.delete({
          organization: 'test-org',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeUser', () => {
    it('should remove a user from a group by ID', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/remove_user`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.removeUser({
          id: '42',
          login: 'john.doe',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should remove a user from a group by name', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/remove_user`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.removeUser({
          name: 'sonar-administrators',
          login: 'jane.smith',
          organization: 'test-org',
        })
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when neither id nor name is provided', async () => {
      await expect(
        client.userGroups.removeUser({
          login: 'john.doe',
          organization: 'test-org',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('search', () => {
    it('should search for groups', async () => {
      const mockResponse = {
        groups: [
          {
            id: '1',
            name: 'sonar-administrators',
            description: 'System administrators',
            membersCount: 5,
            default: true,
          },
          {
            id: '2',
            name: 'developers',
            description: 'All developers',
            membersCount: 10,
            default: false,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 50,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('organization')).toBe('test-org');
          expect(url.searchParams.get('q')).toBe('admin');
          expect(url.searchParams.get('ps')).toBe('50');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups
        .search()
        .organization('test-org')
        .query('admin')
        .pageSize(50)
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should search with specific fields', async () => {
      const mockResponse = {
        groups: [
          {
            id: '1',
            name: 'sonar-administrators',
            membersCount: 5,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 50,
          total: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('f')).toBe('name,membersCount');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups
        .search()
        .organization('test-org')
        .fields(['name', 'membersCount'])
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when organization is not provided', async () => {
      await expect(client.userGroups.search().query('admin').execute()).rejects.toThrow(
        'Organization is required for searching user groups'
      );
    });
  });

  describe('searchAll', () => {
    it('should iterate through all groups', async () => {
      const mockResponse = {
        groups: [
          { id: '1', name: 'group1' },
          { id: '2', name: 'group2' },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 50,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const groups = [];
      for await (const group of client.userGroups.searchAll('test-org')) {
        groups.push(group);
      }

      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('group1');
      expect(groups[1].name).toBe('group2');
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/update`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.update({
          id: '42',
          name: 'new-developers',
          description: 'Updated developer group',
        })
      ).resolves.toBeUndefined();
    });

    it('should update only description', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_groups/update`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.userGroups.update({
          id: '42',
          description: 'Senior developers only',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('users', () => {
    it('should get users by group ID', async () => {
      const mockResponse = {
        p: 1,
        ps: 25,
        total: 2,
        users: [
          { login: 'john.doe', name: 'John Doe', selected: true },
          { login: 'jane.smith', name: 'Jane Smith', selected: false },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/users`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('id')).toBe('42');
          expect(url.searchParams.get('organization')).toBe('test-org');
          expect(url.searchParams.get('selected')).toBe('all');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups
        .users()
        .groupId('42')
        .organization('test-org')
        .selected('all')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should get users by group name', async () => {
      const mockResponse = {
        p: 1,
        ps: 25,
        total: 1,
        users: [{ login: 'john.doe', name: 'John Doe', selected: true }],
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/users`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('name')).toBe('developers');
          expect(url.searchParams.get('selected')).toBe('selected');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups
        .users()
        .groupName('developers')
        .selected('selected')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should search for specific users', async () => {
      const mockResponse = {
        p: 1,
        ps: 25,
        total: 1,
        users: [{ login: 'john.doe', name: 'John Doe', selected: true }],
      };

      server.use(
        http.get(`${baseUrl}/api/user_groups/users`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('john');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.userGroups
        .users()
        .group('sonar-administrators')
        .query('john')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should use groupId for numeric strings', async () => {
      server.use(
        http.get(`${baseUrl}/api/user_groups/users`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('id')).toBe('123');
          expect(url.searchParams.get('name')).toBeNull();
          return HttpResponse.json({ p: 1, ps: 25, total: 0, users: [] });
        })
      );

      await client.userGroups.users().group('123').execute();
    });

    it('should use groupName for non-numeric strings', async () => {
      server.use(
        http.get(`${baseUrl}/api/user_groups/users`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('name')).toBe('developers');
          expect(url.searchParams.get('id')).toBeNull();
          return HttpResponse.json({ p: 1, ps: 25, total: 0, users: [] });
        })
      );

      await client.userGroups.users().group('developers').execute();
    });

    it('should throw error when neither id nor name is provided', async () => {
      await expect(client.userGroups.users().query('john').execute()).rejects.toThrow(
        'Either group ID or name must be provided'
      );
    });
  });
});
