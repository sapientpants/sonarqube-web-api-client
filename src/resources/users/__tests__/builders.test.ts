/* eslint-disable @typescript-eslint/no-deprecated, @typescript-eslint/restrict-template-expressions */
import { SearchUsersBuilder, GetUserGroupsBuilder } from '../builders';
import { ValidationError } from '../../../errors';

describe('Users Builders', () => {
  describe('SearchUsersBuilder', () => {
    let mockExecutor: jest.Mock;
    let builder: SearchUsersBuilder;

    beforeEach(() => {
      mockExecutor = jest.fn();
      builder = new SearchUsersBuilder(mockExecutor);
    });

    describe('fluent interface', () => {
      it('should set IDs parameter', () => {
        const testIds = ['uuid-1', 'uuid-2', 'uuid-3'];
        const result = builder.ids(testIds);
        expect(result).toBe(builder);
        expect(builder['params'].ids).toEqual(testIds);
      });

      it('should set query parameter', () => {
        const result = builder.query('john');
        expect(result).toBe(builder);
        expect(builder['params'].q).toBe('john');
      });

      it('should set pagination parameters', () => {
        builder.page(2).pageSize(25);
        expect(builder['params'].p).toBe(2);
        expect(builder['params'].ps).toBe(25);
      });

      it('should support method chaining', () => {
        const result = builder.ids(['uuid-1', 'uuid-2']).query('search-term').page(1).pageSize(50);

        expect(result).toBe(builder);
        expect(builder['params'].ids).toEqual(['uuid-1', 'uuid-2']);
        expect(builder['params'].q).toBe('search-term');
        expect(builder['params'].p).toBe(1);
        expect(builder['params'].ps).toBe(50);
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        const mockResponse = {
          users: [{ login: 'test', name: 'Test User', active: true }],
          paging: { pageIndex: 1, pageSize: 50, total: 1 },
        };
        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.query('test').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          q: 'test',
        });
        expect(result).toBe(mockResponse);
      });

      it('should execute with all parameters', async () => {
        const mockResponse = {
          users: [],
          paging: { pageIndex: 2, pageSize: 25, total: 0 },
        };
        mockExecutor.mockResolvedValue(mockResponse);

        await builder.ids(['uuid-1', 'uuid-2']).query('search').page(2).pageSize(25).execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          ids: ['uuid-1', 'uuid-2'],
          q: 'search',
          p: 2,
          ps: 25,
        });
      });

      it('should validate IDs array length', async () => {
        const tooManyIds = Array.from({ length: 31 }, (_, i) => `uuid-${i}`);
        builder.ids(tooManyIds);

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('Maximum 30 user IDs allowed');
      });

      it('should validate IDs string length', async () => {
        // Create IDs that will exceed 1110 character limit when joined
        const longIds = Array.from({ length: 30 }, () => 'a'.repeat(40)); // 30 * 40 + 29 commas = 1229 chars
        builder.ids(longIds);

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow(
          'IDs string exceeds maximum length of 1110 characters'
        );
      });

      it('should allow maximum valid IDs', async () => {
        // Create exactly 30 IDs that stay under 1110 character limit
        const validIds = Array.from(
          { length: 30 },
          (_, i) => `uuid-${i.toString().padStart(2, '0')}`
        );
        builder.ids(validIds);
        mockExecutor.mockResolvedValue({
          users: [],
          paging: { pageIndex: 1, pageSize: 50, total: 0 },
        });

        await expect(builder.execute()).resolves.toBeDefined();
      });

      it('should validate query minimum length', async () => {
        builder.query('a'); // Single character

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('Query must be at least 2 characters long');
      });

      it('should allow valid query length', async () => {
        builder.query('ab'); // Two characters - minimum valid
        mockExecutor.mockResolvedValue({
          users: [],
          paging: { pageIndex: 1, pageSize: 50, total: 0 },
        });

        await expect(builder.execute()).resolves.toBeDefined();
      });

      it('should execute without parameters', async () => {
        mockExecutor.mockResolvedValue({
          users: [],
          paging: { pageIndex: 1, pageSize: 50, total: 0 },
        });

        await builder.execute();

        expect(mockExecutor).toHaveBeenCalledWith({});
      });
    });

    describe('pagination', () => {
      it('should extract items from response', () => {
        const mockResponse = {
          users: [
            { login: 'user1', name: 'User 1', active: true },
            { login: 'user2', name: 'User 2', active: true },
          ],
          paging: { pageIndex: 1, pageSize: 50, total: 2 },
        };

        const items = builder['getItems'](mockResponse);
        expect(items).toHaveLength(2);
        expect(items[0].login).toBe('user1');
        expect(items[1].login).toBe('user2');
      });

      it('should support async iteration', async () => {
        const page1Response = {
          users: [
            { login: 'user1', name: 'User 1', active: true },
            { login: 'user2', name: 'User 2', active: true },
          ],
          paging: { pageIndex: 1, pageSize: 2, total: 3 },
        };

        const page2Response = {
          users: [{ login: 'user3', name: 'User 3', active: true }],
          paging: { pageIndex: 2, pageSize: 2, total: 3 },
        };

        mockExecutor.mockResolvedValueOnce(page1Response).mockResolvedValueOnce(page2Response);

        const users = [];
        for await (const user of builder.all()) {
          users.push(user);
        }

        expect(users).toHaveLength(3);
        expect(users[0].login).toBe('user1');
        expect(users[1].login).toBe('user2');
        expect(users[2].login).toBe('user3');
      });
    });
  });

  describe('GetUserGroupsBuilder', () => {
    let mockExecutor: jest.Mock;
    let builder: GetUserGroupsBuilder;

    beforeEach(() => {
      mockExecutor = jest.fn();
      builder = new GetUserGroupsBuilder(mockExecutor);
    });

    describe('fluent interface', () => {
      it('should set login parameter', () => {
        const result = builder.login('john.doe');
        expect(result).toBe(builder);
        expect(builder['params'].login).toBe('john.doe');
      });

      it('should set organization parameter', () => {
        const result = builder.organization('my-org');
        expect(result).toBe(builder);
        expect(builder['params'].organization).toBe('my-org');
      });

      it('should set query parameter', () => {
        const result = builder.query('admin');
        expect(result).toBe(builder);
        expect(builder['params'].q).toBe('admin');
      });

      it('should set selected parameter', () => {
        const result = builder.selected('all');
        expect(result).toBe(builder);
        expect(builder['params'].selected).toBe('all');
      });

      it('should set selected to deselected', () => {
        builder.selected('deselected');
        expect(builder['params'].selected).toBe('deselected');
      });

      it('should set selected to selected', () => {
        builder.selected('selected');
        expect(builder['params'].selected).toBe('selected');
      });

      it('should set pagination parameters', () => {
        builder.page(3).pageSize(10);
        expect(builder['params'].p).toBe(3);
        expect(builder['params'].ps).toBe(10);
      });

      it('should support method chaining', () => {
        const result = builder
          .login('john.doe')
          .organization('my-org')
          .query('dev')
          .selected('all')
          .page(1)
          .pageSize(25);

        expect(result).toBe(builder);
        expect(builder['params'].login).toBe('john.doe');
        expect(builder['params'].organization).toBe('my-org');
        expect(builder['params'].q).toBe('dev');
        expect(builder['params'].selected).toBe('all');
        expect(builder['params'].p).toBe(1);
        expect(builder['params'].ps).toBe(25);
      });
    });

    describe('execute', () => {
      it('should execute with required parameters', async () => {
        const mockResponse = {
          groups: [{ name: 'developers', description: 'Dev team' }],
          paging: { pageIndex: 1, pageSize: 25, total: 1 },
        };
        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.login('john.doe').organization('my-org').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          login: 'john.doe',
          organization: 'my-org',
        });
        expect(result).toBe(mockResponse);
      });

      it('should execute with all parameters', async () => {
        const mockResponse = {
          groups: [],
          paging: { pageIndex: 2, pageSize: 10, total: 0 },
        };
        mockExecutor.mockResolvedValue(mockResponse);

        await builder
          .login('john.doe')
          .organization('my-org')
          .query('admin')
          .selected('deselected')
          .page(2)
          .pageSize(10)
          .execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          login: 'john.doe',
          organization: 'my-org',
          q: 'admin',
          selected: 'deselected',
          p: 2,
          ps: 10,
        });
      });

      it('should throw ValidationError when login is missing', async () => {
        builder.organization('my-org');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('login is required');
      });

      it('should throw ValidationError when login is empty', async () => {
        builder.login('').organization('my-org');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('login is required');
      });

      it('should throw ValidationError when organization is missing', async () => {
        builder.login('john.doe');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('organization is required');
      });

      it('should throw ValidationError when organization is empty', async () => {
        builder.login('john.doe').organization('');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('organization is required');
      });

      it('should throw ValidationError when both required parameters are missing', async () => {
        await expect(builder.execute()).rejects.toThrow(ValidationError);
        // Should throw for the first missing parameter (login)
        await expect(builder.execute()).rejects.toThrow('login is required');
      });
    });

    describe('pagination', () => {
      it('should extract items from response', () => {
        const mockResponse = {
          groups: [
            { name: 'group1', description: 'Group 1' },
            { name: 'group2', description: 'Group 2' },
          ],
          paging: { pageIndex: 1, pageSize: 25, total: 2 },
        };

        const items = builder['getItems'](mockResponse);
        expect(items).toHaveLength(2);
        expect(items[0].name).toBe('group1');
        expect(items[1].name).toBe('group2');
      });

      it('should support async iteration', async () => {
        const page1Response = {
          groups: [
            { name: 'group1', description: 'Group 1' },
            { name: 'group2', description: 'Group 2' },
          ],
          paging: { pageIndex: 1, pageSize: 2, total: 3 },
        };

        const page2Response = {
          groups: [{ name: 'group3', description: 'Group 3' }],
          paging: { pageIndex: 2, pageSize: 2, total: 3 },
        };

        mockExecutor.mockResolvedValueOnce(page1Response).mockResolvedValueOnce(page2Response);

        builder.login('john.doe').organization('my-org');

        const groups = [];
        for await (const group of builder.all()) {
          groups.push(group);
        }

        expect(groups).toHaveLength(3);
        expect(groups[0].name).toBe('group1');
        expect(groups[1].name).toBe('group2');
        expect(groups[2].name).toBe('group3');
      });

      it('should handle empty results in async iteration', async () => {
        const emptyResponse = {
          groups: [],
          paging: { pageIndex: 1, pageSize: 25, total: 0 },
        };

        mockExecutor.mockResolvedValue(emptyResponse);
        builder.login('john.doe').organization('my-org');

        const groups = [];
        for await (const group of builder.all()) {
          groups.push(group);
        }

        expect(groups).toHaveLength(0);
      });
    });

    describe('parameter validation edge cases', () => {
      it('should handle whitespace-only login', async () => {
        builder.login('   ').organization('my-org');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('login is required');
      });

      it('should handle whitespace-only organization', async () => {
        builder.login('john.doe').organization('   ');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow('organization is required');
      });

      it('should accept valid trimmed parameters', async () => {
        mockExecutor.mockResolvedValue({
          groups: [],
          paging: { pageIndex: 1, pageSize: 25, total: 0 },
        });

        await builder.login('john.doe').organization('my-org').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          login: 'john.doe',
          organization: 'my-org',
        });
      });
    });

    describe('complex parameter combinations', () => {
      it('should handle query with special characters', async () => {
        mockExecutor.mockResolvedValue({
          groups: [],
          paging: { pageIndex: 1, pageSize: 25, total: 0 },
        });

        await builder.login('john.doe').organization('my-org').query('admin@company.com').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          login: 'john.doe',
          organization: 'my-org',
          q: 'admin@company.com',
        });
      });

      it('should handle all selection filter options', async () => {
        mockExecutor.mockResolvedValue({
          groups: [],
          paging: { pageIndex: 1, pageSize: 25, total: 0 },
        });

        // Test each valid selection filter value
        const filters: Array<'all' | 'deselected' | 'selected'> = ['all', 'deselected', 'selected'];

        for (const filter of filters) {
          await builder.login('john.doe').organization('my-org').selected(filter).execute();

          expect(mockExecutor).toHaveBeenLastCalledWith({
            login: 'john.doe',
            organization: 'my-org',
            selected: filter,
          });
        }
      });
    });
  });
});
