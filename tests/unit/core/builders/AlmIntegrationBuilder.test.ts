// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import {
  AlmIntegrationBuilder,
  RepositorySearchBuilder,
} from '../../../../src/core/builders/AlmIntegrationBuilder';
import { ValidationError } from '../../../../src/errors';

// Test implementation of AlmIntegrationBuilder
interface TestAlmIntegrationRequest {
  almSetting?: string;
  data?: string;
}

interface TestAlmIntegrationResponse {
  result: string;
}

class TestAlmIntegrationBuilder extends AlmIntegrationBuilder<
  TestAlmIntegrationRequest,
  TestAlmIntegrationResponse
> {
  async execute(): Promise<TestAlmIntegrationResponse> {
    this.validateAlmSetting();
    return this.executor(this.params as TestAlmIntegrationRequest);
  }
}

// Test implementation of RepositorySearchBuilder
interface TestRepository {
  id: string;
  name: string;
}

interface TestRepositorySearchRequest {
  almSetting?: string;
  q?: string;
  projectKey?: string;
  p?: number;
  ps?: number;
}

interface TestRepositorySearchResponse {
  repositories: TestRepository[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

class TestRepositorySearchBuilder extends RepositorySearchBuilder<
  TestRepositorySearchRequest,
  TestRepositorySearchResponse,
  TestRepository
> {
  async execute(): Promise<TestRepositorySearchResponse> {
    this.validateAlmSetting();
    return this.executor(this.params as TestRepositorySearchRequest);
  }

  protected getItems(response: TestRepositorySearchResponse): TestRepository[] {
    return response.repositories;
  }
}

describe('AlmIntegrationBuilder', () => {
  let executor: Mock;
  let builder: TestAlmIntegrationBuilder;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestAlmIntegrationBuilder(executor);
  });

  describe('withAlmSetting', () => {
    it('should set the ALM setting', () => {
      builder.withAlmSetting('my-alm-setting');
      expect(builder['params'].almSetting).toBe('my-alm-setting');
    });

    it('should support method chaining', () => {
      const result = builder.withAlmSetting('my-alm-setting');
      expect(result).toBe(builder);
    });
  });

  describe('validateAlmSetting', () => {
    it('should pass validation when almSetting is set', async () => {
      executor.mockResolvedValue({ result: 'success' });

      const result = await builder.withAlmSetting('my-alm-setting').execute();
      expect(result).toEqual({ result: 'success' });
      expect(executor).toHaveBeenCalledWith({ almSetting: 'my-alm-setting' });
    });

    it('should throw ValidationError when almSetting is not set', async () => {
      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow('almSetting is required');
    });

    it('should throw ValidationError when almSetting is empty string', async () => {
      await expect(builder.withAlmSetting('').execute()).rejects.toThrow(ValidationError);
      await expect(builder.withAlmSetting('').execute()).rejects.toThrow('almSetting is required');
    });

    it('should throw ValidationError when almSetting is whitespace only', async () => {
      await expect(builder.withAlmSetting('   ').execute()).rejects.toThrow(ValidationError);
      await expect(builder.withAlmSetting('   ').execute()).rejects.toThrow(
        'almSetting is required',
      );
    });
  });
});

describe('RepositorySearchBuilder', () => {
  let executor: Mock;
  let builder: TestRepositorySearchBuilder;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestRepositorySearchBuilder(executor);
  });

  describe('withAlmSetting', () => {
    it('should set the ALM setting', () => {
      builder.withAlmSetting('my-alm-setting');
      expect(builder['params'].almSetting).toBe('my-alm-setting');
    });
  });

  describe('withQuery', () => {
    it('should set the search query', () => {
      builder.withQuery('test query');
      expect(builder['params'].q).toBe('test query');
    });

    it('should support method chaining', () => {
      const result = builder.withQuery('test');
      expect(result).toBe(builder);
    });
  });

  describe('inProject', () => {
    it('should set the project key', () => {
      builder.inProject('my-project');
      expect(builder['params'].projectKey).toBe('my-project');
    });

    it('should support method chaining', () => {
      const result = builder.inProject('my-project');
      expect(result).toBe(builder);
    });
  });

  describe('execute', () => {
    it('should execute with all parameters', async () => {
      const mockResponse = {
        repositories: [{ id: '1', name: 'repo1' }],
        paging: { pageIndex: 1, pageSize: 100, total: 1 },
      };
      executor.mockResolvedValue(mockResponse);

      const result = await builder
        .withAlmSetting('my-alm')
        .withQuery('test')
        .inProject('my-project')
        .pageSize(50)
        .page(2)
        .execute();

      expect(result).toEqual(mockResponse);
      expect(executor).toHaveBeenCalledWith({
        almSetting: 'my-alm',
        q: 'test',
        projectKey: 'my-project',
        ps: 50,
        p: 2,
      });
    });

    it('should throw ValidationError when almSetting is not set', async () => {
      await expect(builder.withQuery('test').execute()).rejects.toThrow(ValidationError);
    });
  });

  describe('pagination', () => {
    it('should extract items from response', () => {
      const response = {
        repositories: [
          { id: '1', name: 'repo1' },
          { id: '2', name: 'repo2' },
        ],
        paging: { pageIndex: 1, pageSize: 100, total: 2 },
      };

      const items = builder['getItems'](response);
      expect(items).toEqual(response.repositories);
    });

    it('should support async iteration', async () => {
      const page1 = {
        repositories: [{ id: '1', name: 'repo1' }],
        paging: { pageIndex: 1, pageSize: 1, total: 2 },
      };
      const page2 = {
        repositories: [{ id: '2', name: 'repo2' }],
        paging: { pageIndex: 2, pageSize: 1, total: 2 },
      };

      executor.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

      builder.withAlmSetting('my-alm').pageSize(1);
      const items: TestRepository[] = [];
      // Collect items using async iteration
      for await (const item of builder.all()) {
        items.push(item);
      }

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('repo1');
      expect(items[1].name).toBe('repo2');
    });
  });

  describe('method chaining', () => {
    it('should support fluent interface', () => {
      const result = builder
        .withAlmSetting('my-alm')
        .withQuery('search')
        .inProject('project')
        .pageSize(25)
        .page(3);

      expect(result).toBe(builder);
      expect(builder['params']).toMatchObject({
        almSetting: 'my-alm',
        q: 'search',
        projectKey: 'project',
        ps: 25,
        p: 3,
      });
    });
  });
});
