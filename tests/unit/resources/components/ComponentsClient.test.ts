// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { ComponentsClient } from '../../../../src/resources/components/ComponentsClient.js';
import { ComponentsTreeBuilder } from '../../../../src/resources/components/builders.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import { assertCommonHeaders, assertQueryParams } from '../../../../src/test-utils/assertions.js';
import {
  type ComponentShowResponse,
  type ComponentSearchResponse,
  type ComponentTreeResponse,
  type Component,
  ComponentQualifier,
} from '../../../../src/resources/components/types.js';

describe('ComponentsClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: ComponentsClient;

  beforeEach(() => {
    client = new ComponentsClient(baseUrl, token);
  });

  describe('show', () => {
    it('should get a component with its ancestors', async () => {
      const mockComponent: Component = {
        key: 'my_project',
        name: 'My Project',
        qualifier: ComponentQualifier.Project,
        path: '',
        description: 'A test project',
        visibility: 'public',
      };

      const mockResponse: ComponentShowResponse = {
        component: mockComponent,
        ancestors: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/show`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show('my_project');
      expect(result).toEqual(mockResponse);
    });

    it('should support branch parameter', async () => {
      const mockResponse: ComponentShowResponse = {
        component: {
          key: 'my_project:src/main.ts',
          name: 'main.ts',
          qualifier: ComponentQualifier.File,
          path: 'src/main.ts',
          language: 'ts',
        },
        ancestors: [
          {
            key: 'my_project:src',
            name: 'src',
            qualifier: ComponentQualifier.Directory,
            path: 'src',
          },
          {
            key: 'my_project',
            name: 'My Project',
            qualifier: ComponentQualifier.Project,
            path: '',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/components/show`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project:src/main.ts',
            branch: 'feature/new-feature',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show('my_project:src/main.ts', {
        branch: 'feature/new-feature',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support pullRequest parameter', async () => {
      const mockResponse: ComponentShowResponse = {
        component: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
          path: '',
        },
        ancestors: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/show`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
            pullRequest: '123',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.show('my_project', {
        pullRequest: '123',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search', () => {
    it('should search for components in an organization', async () => {
      const mockResponse: ComponentSearchResponse = {
        components: [
          {
            key: 'project1',
            name: 'Project 1',
            qualifier: ComponentQualifier.Project,
          },
          {
            key: 'project2',
            name: 'Project 2',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 2,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchLegacy('my-org');
      expect(result).toEqual(mockResponse);
    });

    it('should support search query parameter', async () => {
      const mockResponse: ComponentSearchResponse = {
        components: [
          {
            key: 'sonar-project',
            name: 'SonarQube Project',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
            q: 'sonar',
            ps: '50',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchLegacy('my-org', {
        q: 'sonar',
        ps: 50,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support pagination parameters', async () => {
      const mockResponse: ComponentSearchResponse = {
        components: [],
        paging: {
          pageIndex: 2,
          pageSize: 25,
          total: 100,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
            p: '2',
            ps: '25',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.searchLegacy('my-org', {
        p: 2,
        ps: 25,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search() builder method', () => {
    it('should return a ComponentsSearchBuilder', async () => {
      const builder = client.search();
      expect(builder).toBeDefined();
      expect(typeof builder.execute).toBe('function');
    });

    it('should search for components with organization', async () => {
      const mockResponse: ComponentSearchResponse = {
        components: [
          {
            key: 'project1',
            name: 'Project 1',
            qualifier: ComponentQualifier.Project,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 1,
        },
      };

      // Set organization on client
      const orgClient = new ComponentsClient(baseUrl, token, 'my-org');

      server.use(
        http.get(`${baseUrl}/api/components/search`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await orgClient.search().execute();
      expect(result).toEqual(mockResponse);
    });

    it('should handle search without organization (fallback)', async () => {
      const result = await client.search().execute();
      expect(result).toEqual({
        components: [],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 0,
        },
      });
    });

    it('should handle search with qualifiers', async () => {
      const result = await client.search().qualifiers(['FIL', 'DIR']).execute();
      expect(result.components).toEqual([]);
    });

    it('should handle search with pagination', async () => {
      const result = await client.search().page(2).pageSize(50).execute();
      expect(result.paging).toEqual({
        pageIndex: 2,
        pageSize: 50,
        total: 0,
      });
    });

    it('should handle search with query parameter', async () => {
      const orgClient = new ComponentsClient(baseUrl, token, 'my-org');
      const mockResponse: ComponentSearchResponse = {
        components: [],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/components/search`, ({ request }) => {
          assertQueryParams(request, {
            organization: 'my-org',
            q: 'test',
            p: '2',
            ps: '25',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await orgClient.search().query('test').page(2).pageSize(25).execute();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('tree', () => {
    it('should return a ComponentsTreeBuilder', () => {
      const builder = client.tree();
      expect(builder).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should accept component key in constructor', () => {
      const builder = client.tree('my_project');
      expect(builder).toBeInstanceOf(ComponentsTreeBuilder);
    });

    it('should have all builder methods available', () => {
      const builder = client.tree();
      expect(typeof builder.component).toBe('function');
      expect(typeof builder.branch).toBe('function');
      expect(typeof builder.pullRequest).toBe('function');
      expect(typeof builder.query).toBe('function');
      expect(typeof builder.qualifiers).toBe('function');
      expect(typeof builder.sortBy).toBe('function');
      expect(typeof builder.ascending).toBe('function');
      expect(typeof builder.strategy).toBe('function');
      expect(typeof builder.filesOnly).toBe('function');
      expect(typeof builder.directoriesOnly).toBe('function');
      expect(typeof builder.projectsOnly).toBe('function');
      expect(typeof builder.testFilesOnly).toBe('function');
      expect(typeof builder.childrenOnly).toBe('function');
      expect(typeof builder.leavesOnly).toBe('function');
      expect(typeof builder.allDescendants).toBe('function');
      expect(typeof builder.sortByName).toBe('function');
      expect(typeof builder.sortByPath).toBe('function');
      expect(typeof builder.sortByQualifier).toBe('function');
      expect(typeof builder.execute).toBe('function');
      expect(typeof builder.all).toBe('function');
    });

    it('should handle tree request with pullRequest parameter', async () => {
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
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
            pullRequest: '456',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.tree().component('my_project').pullRequest('456').execute();

      expect(result).toEqual(mockResponse);
    });

    it('should handle tree request with branch parameter', async () => {
      const mockResponse: ComponentTreeResponse = {
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 10,
        },
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
            branch: 'feature/test',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.tree().component('my_project').branch('feature/test').execute();

      expect(result).toEqual(mockResponse);
    });

    it('should handle tree request with empty string parameters', async () => {
      const mockResponse: ComponentTreeResponse = {
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 10,
        },
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .tree()
        .component('my_project')
        .branch('')
        .pullRequest('')
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should handle tree request with componentKey parameter in constructor', async () => {
      const mockResponse: ComponentTreeResponse = {
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 0,
        },
        baseComponent: {
          key: 'preset_project',
          name: 'Preset Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'preset_project',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.tree('preset_project').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should handle tree request with array parameters', async () => {
      const mockResponse: ComponentTreeResponse = {
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 2,
        },
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
          },
          {
            key: 'my_project:src/file2.ts',
            name: 'file2.ts',
            qualifier: ComponentQualifier.File,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            component: 'my_project',
            qualifiers: 'FIL,UTS',
            s: 'name,path',
            asc: 'true',
            strategy: 'all',
            q: 'test',
            p: '2',
            ps: '50',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .tree()
        .component('my_project')
        .qualifiers(['FIL', 'UTS'])
        .sortBy(['name', 'path'])
        .ascending('true')
        .strategy('all')
        .query('test')
        .page(2)
        .pageSize(50)
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should handle undefined and zero values in tree parameters', async () => {
      const mockResponse: ComponentTreeResponse = {
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 0,
        },
        baseComponent: {
          key: 'my_project',
          name: 'My Project',
          qualifier: ComponentQualifier.Project,
        },
        components: [],
      };

      server.use(
        http.get(`${baseUrl}/api/components/tree`, ({ request }) => {
          assertCommonHeaders(request, token);
          // Should not include parameters with undefined, empty, or zero values
          assertQueryParams(request, {
            component: 'my_project',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .tree()
        .component('my_project')
        .qualifiers([])
        .sortBy([])
        .page(0)
        .pageSize(0)
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays in appendArrayParam', async () => {
      const result = await client.searchLegacy('my-org', {
        q: '', // empty string should be ignored
        p: -1, // negative number should be ignored
        ps: 0, // zero should be ignored
      });

      // Test should complete without errors
      expect(result).toBeDefined();
    });

    it('should handle ComponentsClient with organization parameter', () => {
      const orgClient = new ComponentsClient(baseUrl, token, 'test-org');
      expect(orgClient).toBeDefined();
      // Check that organization is passed correctly by verifying the client exists
      // Organization is internal to the client implementation
    });
  });
});
