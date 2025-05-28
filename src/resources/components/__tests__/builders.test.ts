import { ComponentsClient } from '../ComponentsClient';
import { ComponentsTreeBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import { ValidationError } from '../../../errors';
import {
  type ComponentTreeResponse,
  type Component,
  ComponentQualifier,
  ComponentTreeStrategy,
  ComponentSortField,
} from '../types';

describe('ComponentsTreeBuilder', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: ComponentsClient;
  let builder: ComponentsTreeBuilder;

  beforeEach(() => {
    client = new ComponentsClient(baseUrl, token);
    builder = client.tree();
  });

  describe('fluent interface', () => {
    it('should build component filters', () => {
      const result = builder
        .component('my_project')
        .branch('feature/new-feature')
        .pullRequest('123');

      expect(result).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should build query filters', () => {
      const result = builder
        .component('my_project')
        .query('Controller')
        .qualifiers([ComponentQualifier.File, ComponentQualifier.Directory]);

      expect(result).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should build sorting options', () => {
      const result = builder
        .component('my_project')
        .sortBy([ComponentSortField.Name, ComponentSortField.Path])
        .ascending(false);

      expect(result).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should build strategy options', () => {
      const result = builder.component('my_project').strategy(ComponentTreeStrategy.Children);

      expect(result).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should provide convenience methods for qualifiers', () => {
      const filesOnly = builder.component('my_project').filesOnly();
      const directoriesOnly = builder.component('my_project').directoriesOnly();
      const projectsOnly = builder.component('my_project').projectsOnly();
      const testFilesOnly = builder.component('my_project').testFilesOnly();

      expect(filesOnly).toBeInstanceOf(ComponentsTreeBuilder);
      expect(directoriesOnly).toBeInstanceOf(ComponentsTreeBuilder);
      expect(projectsOnly).toBeInstanceOf(ComponentsTreeBuilder);
      expect(testFilesOnly).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should provide convenience methods for strategies', () => {
      const childrenOnly = builder.component('my_project').childrenOnly();
      const leavesOnly = builder.component('my_project').leavesOnly();
      const allDescendants = builder.component('my_project').allDescendants();

      expect(childrenOnly).toBeInstanceOf(ComponentsTreeBuilder);
      expect(leavesOnly).toBeInstanceOf(ComponentsTreeBuilder);
      expect(allDescendants).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should provide convenience methods for sorting', () => {
      const sortByName = builder.component('my_project').sortByName();
      const sortByPath = builder.component('my_project').sortByPath();
      const sortByQualifier = builder.component('my_project').sortByQualifier();

      expect(sortByName).toBeInstanceOf(ComponentsTreeBuilder);
      expect(sortByPath).toBeInstanceOf(ComponentsTreeBuilder);
      expect(sortByQualifier).toBeInstanceOf(ComponentsTreeBuilder);
    });
  });

  describe('validation', () => {
    it('should validate query minimum length', () => {
      expect(() => {
        builder.component('my_project').query('ab');
      }).toThrow(ValidationError);
    });

    it('should accept valid query length', () => {
      expect(() => {
        builder.component('my_project').query('abc');
      }).not.toThrow();
    });

    it('should require component parameter', async () => {
      await expect(builder.execute()).rejects.toThrow(ValidationError);
    });

    it('should not throw when component is provided', async () => {
      const mockResponse: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(builder.component('my_project').execute()).resolves.toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute tree search and return results', async () => {
      const mockResponse: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [
          {
            key: 'my_project:src',
            name: 'src',
            qualifier: ComponentQualifier.Directory,
            path: 'src',
          },
          {
            key: 'my_project:src/main.ts',
            name: 'main.ts',
            qualifier: ComponentQualifier.File,
            path: 'src/main.ts',
            language: 'ts',
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my_project');
          return HttpResponse.json(mockResponse);
        })
      );

      const response = await builder.component('my_project').execute();

      expect(response.baseComponent).toBeDefined();
      expect(response.components).toHaveLength(2);
      expect(response.paging).toBeDefined();
      expect(response.paging.pageIndex).toBe(1);
      expect(response.paging.pageSize).toBe(100);
    });

    it('should handle pagination parameters', async () => {
      const mockResponse: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
        paging: {
          pageIndex: 2,
          pageSize: 50,
          total: 150,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('p')).toBe('2');
          expect(url.searchParams.get('ps')).toBe('50');
          return HttpResponse.json(mockResponse);
        })
      );

      const response = await builder.component('my_project').page(2).pageSize(50).execute();

      expect(response.paging.pageIndex).toBe(2);
      expect(response.paging.pageSize).toBe(50);
    });

    it('should handle complex filters', async () => {
      const mockResponse: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [
          {
            key: 'my_project:src/UserController.ts',
            name: 'UserController.ts',
            qualifier: ComponentQualifier.File,
            path: 'src/UserController.ts',
            language: 'ts',
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my_project');
          expect(url.searchParams.get('branch')).toBe('feature/new-feature');
          expect(url.searchParams.get('q')).toBe('Controller');
          expect(url.searchParams.get('qualifiers')).toBe('FIL');
          expect(url.searchParams.get('strategy')).toBe('all');
          expect(url.searchParams.get('s')).toBe('name');
          expect(url.searchParams.get('asc')).toBe('false');
          return HttpResponse.json(mockResponse);
        })
      );

      const response = await builder
        .component('my_project')
        .branch('feature/new-feature')
        .query('Controller')
        .filesOnly()
        .allDescendants()
        .sortByName()
        .ascending(false)
        .execute();

      expect(response.components).toHaveLength(1);
      expect(response.components[0].name).toBe('UserController.ts');
    });
  });

  describe('pagination with all()', () => {
    it('should iterate through all pages', async () => {
      const page1Response: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [
          {
            key: 'my_project:src/file1.ts',
            name: 'file1.ts',
            qualifier: ComponentQualifier.File,
            path: 'src/file1.ts',
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 1,
          total: 2,
        },
      };

      const page2Response: ComponentTreeResponse = {
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [
          {
            key: 'my_project:src/file2.ts',
            name: 'file2.ts',
            qualifier: ComponentQualifier.File,
            path: 'src/file2.ts',
          },
        ],
        paging: {
          pageIndex: 2,
          pageSize: 1,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('p') ?? '1';
          return HttpResponse.json(page === '1' ? page1Response : page2Response);
        })
      );

      const components: Component[] = [];
      for await (const component of builder.component('my_project').pageSize(1).all()) {
        components.push(component);
      }

      expect(components).toHaveLength(2);
      expect(components[0].name).toBe('file1.ts');
      expect(components[1].name).toBe('file2.ts');
    });
  });
});
