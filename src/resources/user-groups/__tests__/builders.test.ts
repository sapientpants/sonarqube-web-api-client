import { SearchUserGroupsBuilder, UsersBuilder } from '../builders';
import type { SearchGroupsResponse, UsersResponse } from '../types';

describe('SearchUserGroupsBuilder', () => {
  let executeFn: jest.Mock;
  let builder: SearchUserGroupsBuilder;

  beforeEach(() => {
    executeFn = jest.fn();
    builder = new SearchUserGroupsBuilder(executeFn);
  });

  it('should build request with organization', async () => {
    const mockResponse: SearchGroupsResponse = {
      groups: [],
      paging: { pageIndex: 1, pageSize: 50, total: 0 },
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.organization('my-org');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      organization: 'my-org',
    });
  });

  it('should build request with query', async () => {
    const mockResponse: SearchGroupsResponse = {
      groups: [],
      paging: { pageIndex: 1, pageSize: 50, total: 0 },
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.organization('my-org').query('admin');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      organization: 'my-org',
      q: 'admin',
    });
  });

  it('should build request with fields', async () => {
    const mockResponse: SearchGroupsResponse = {
      groups: [],
      paging: { pageIndex: 1, pageSize: 50, total: 0 },
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.organization('my-org').fields(['name', 'membersCount']);
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      organization: 'my-org',
      f: ['name', 'membersCount'],
    });
  });

  it('should build request with pagination', async () => {
    const mockResponse: SearchGroupsResponse = {
      groups: [],
      paging: { pageIndex: 2, pageSize: 25, total: 0 },
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.organization('my-org').page(2).pageSize(25);
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      organization: 'my-org',
      p: 2,
      ps: 25,
    });
  });

  it('should throw error when organization is not provided', async () => {
    await expect(builder.execute()).rejects.toThrow(
      'Organization is required for searching user groups'
    );
  });

  it('should support async iteration', async () => {
    const mockResponse: SearchGroupsResponse = {
      groups: [
        { id: '1', name: 'group1' },
        { id: '2', name: 'group2' },
      ],
      paging: { pageIndex: 1, pageSize: 50, total: 2 },
    };
    executeFn.mockResolvedValue(mockResponse);

    const groups = [];
    for await (const group of builder.organization('my-org').all()) {
      groups.push(group);
    }

    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('group1');
    expect(groups[1].name).toBe('group2');
  });
});

describe('UsersBuilder', () => {
  let executeFn: jest.Mock;
  let builder: UsersBuilder;

  beforeEach(() => {
    executeFn = jest.fn();
    builder = new UsersBuilder(executeFn);
  });

  it('should build request with group ID', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.groupId('42');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      id: '42',
    });
  });

  it('should build request with group name', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.groupName('developers');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
    });
  });

  it('should use groupId for numeric strings in group method', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('123');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      id: '123',
    });
  });

  it('should use groupName for non-numeric strings in group method', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('developers');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
    });
  });

  it('should override name when id is set', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.groupName('developers').groupId('42');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      id: '42',
    });
  });

  it('should override id when name is set', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.groupId('42').groupName('developers');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
    });
  });

  it('should build request with organization', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('42').organization('my-org');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      id: '42',
      organization: 'my-org',
    });
  });

  it('should build request with query', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('developers').query('john');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
      q: 'john',
    });
  });

  it('should build request with selected filter', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('developers').selected('all');
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
      selected: 'all',
    });
  });

  it('should build request with pagination', async () => {
    const mockResponse: UsersResponse = {
      p: 2,
      ps: 50,
      total: 0,
      users: [],
    };
    executeFn.mockResolvedValue(mockResponse);

    builder.group('developers').page(2).pageSize(50);
    await builder.execute();

    expect(executeFn).toHaveBeenCalledWith({
      name: 'developers',
      p: 2,
      ps: 50,
    });
  });

  it('should throw error when neither id nor name is provided', async () => {
    await expect(builder.execute()).rejects.toThrow('Either group ID or name must be provided');
  });

  it('should support async iteration', async () => {
    const mockResponse: UsersResponse = {
      p: 1,
      ps: 25,
      total: 2,
      users: [
        { login: 'john.doe', name: 'John Doe', selected: true },
        { login: 'jane.smith', name: 'Jane Smith', selected: false },
      ],
    };
    executeFn.mockResolvedValue(mockResponse);

    const users = [];
    for await (const user of builder.group('developers').all()) {
      users.push(user);
    }

    expect(users).toHaveLength(2);
    expect(users[0].login).toBe('john.doe');
    expect(users[1].login).toBe('jane.smith');
  });
});
