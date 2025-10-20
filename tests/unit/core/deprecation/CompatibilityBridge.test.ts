// @ts-nocheck
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { CompatibilityBridge } from '../../../../src/core/deprecation/CompatibilityBridge.js';
import { DeprecationManager } from '../../../../src/core/deprecation/DeprecationManager.js';

describe('CompatibilityBridge', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    DeprecationManager.clearWarnings();
    DeprecationManager.configure({ suppressDeprecationWarnings: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('withCompatibility', () => {
    it('should handle nested API mappings', () => {
      const client = {
        users: {
          search: vi.fn().mockReturnValue({ users: [] }),
          searchV2: vi.fn().mockReturnValue({ users: [], total: 0 }),
        },
        projects: {
          list: vi.fn().mockReturnValue({ projects: [] }),
        },
      };

      const mappings = [
        {
          oldApi: 'users.search',
          newApi: 'users.searchV2',
          transformer: (params: any) => ({
            ...params,
            pageSize: params.ps,
            page: params.p,
          }),
        },
      ];

      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);

      // Call old API
      wrapped.users.search({ ps: 10, p: 1 });

      expect(client.users.searchV2).toHaveBeenCalledWith({
        ps: 10,
        p: 1,
        pageSize: 10,
        page: 1,
      });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('users.search'));
    });

    it('should handle result transformation', async () => {
      const client = {
        users: {
          search: vi.fn(), // Add the old method that will be replaced
          searchV2: vi.fn().mockReturnValue({
            users: [{ id: 1, name: 'User' }],
            total: 1,
          }),
        },
      };

      const mappings = [
        {
          oldApi: 'users.search',
          newApi: 'users.searchV2',
          resultTransformer: (result: any) => ({
            ...result,
            items: result.users,
          }),
        },
      ];

      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);

      const result = await wrapped.users.search();

      expect(result).toEqual({
        users: [{ id: 1, name: 'User' }],
        total: 1,
        items: [{ id: 1, name: 'User' }],
      });
    });

    it('should handle APIs without transformers', () => {
      const client = {
        api: {
          oldMethod: vi.fn(),
          newMethod: vi.fn().mockReturnValue('result'),
        },
      };

      const mappings = [
        {
          oldApi: 'api.oldMethod',
          newApi: 'api.newMethod',
        },
      ];

      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);
      const result = wrapped.api.oldMethod('arg1', 'arg2');

      expect(client.api.newMethod).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
    });

    it('should handle direct method calls on root object', () => {
      const client = {
        oldMethod: vi.fn(),
        newMethod: vi.fn().mockReturnValue('result'),
      };

      const mappings = [
        {
          oldApi: 'oldMethod',
          newApi: 'newMethod',
        },
      ];

      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);
      const result = wrapped.oldMethod('arg');

      expect(client.newMethod).toHaveBeenCalledWith('arg');
      expect(result).toBe('result');
    });

    it('should preserve non-mapped properties', () => {
      const client = {
        users: {
          create: vi.fn().mockReturnValue({ id: 1 }),
          update: vi.fn(),
        },
      };

      const mappings: any[] = [];
      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);

      wrapped.users.create({ name: 'Test' });
      expect(client.users.create).toHaveBeenCalledWith({ name: 'Test' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle deeply nested APIs', () => {
      const client = {
        api: {
          v1: {
            users: {
              search: vi.fn(),
            },
          },
          v2: {
            users: {
              search: vi.fn().mockReturnValue('v2 result'),
            },
          },
        },
      };

      const mappings = [
        {
          oldApi: 'api.v1.users.search',
          newApi: 'api.v2.users.search',
        },
      ];

      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);
      const result = wrapped.api.v1.users.search();

      expect(client.api.v2.users.search).toHaveBeenCalled();
      expect(result).toBe('v2 result');
    });

    it('should handle null and undefined values in objects', () => {
      const client = {
        api: {
          nullValue: null,
          undefinedValue: undefined,
          method: vi.fn(),
        },
      };

      const mappings: any[] = [];
      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);

      expect(wrapped.api.nullValue).toBeNull();
      expect(wrapped.api.undefinedValue).toBeUndefined();
      wrapped.api.method();
      expect(client.api.method).toHaveBeenCalled();
    });

    it('should handle array properties', () => {
      const client = {
        api: {
          items: [1, 2, 3],
          method: vi.fn(),
        },
      };

      const mappings: any[] = [];
      const wrapped = CompatibilityBridge.withCompatibility(client, mappings);

      expect(wrapped.api.items).toEqual([1, 2, 3]);
      expect(Array.isArray(wrapped.api.items)).toBe(true);
    });

    it('should handle built-in mappings', async () => {
      const client = {
        users: {
          search: vi.fn(),
          searchV2: vi.fn().mockReturnValue({
            users: [{ id: 1 }],
            total: 1,
          }),
        },
      };

      const wrapped = CompatibilityBridge.withCompatibility(client);

      const result = await wrapped.users.search({ ps: 10, p: 1 });

      expect(client.users.searchV2).toHaveBeenCalledWith({
        pageSize: 10,
        page: 1,
      });
      expect(result).toHaveProperty('items');
    });
  });

  describe('register', () => {
    it('should register new mappings', () => {
      const mapping = {
        oldApi: 'custom.old',
        newApi: 'custom.new',
      };

      CompatibilityBridge.register(mapping);

      const client = {
        custom: {
          old: vi.fn(),
          new: vi.fn().mockReturnValue('new result'),
        },
      };

      const wrapped = CompatibilityBridge.withCompatibility(client);
      const result = wrapped.custom.old();

      expect(client.custom.new).toHaveBeenCalled();
      expect(result).toBe('new result');
    });
  });
});
