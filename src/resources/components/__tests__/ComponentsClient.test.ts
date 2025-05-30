import { http, HttpResponse } from 'msw';
import { ComponentsClient } from '../ComponentsClient';
import { ComponentsTreeBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { assertCommonHeaders, assertQueryParams } from '../../../test-utils/assertions';
import {
  type ComponentShowResponse,
  type ComponentSearchResponse,
  type ComponentTreeResponse,
  type Component,
  ComponentQualifier,
} from '../types';

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
        })
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
        })
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
        })
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
        })
      );

      const result = await client.search('my-org');
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
        })
      );

      const result = await client.search('my-org', {
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
        })
      );

      const result = await client.search('my-org', {
        p: 2,
        ps: 25,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('tree', () => {
    it('should return a ComponentsTreeBuilder', () => {
      const builder = client.tree();
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
        })
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
        })
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
        })
      );

      const result = await client
        .tree()
        .component('my_project')
        .branch('')
        .pullRequest('')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });
});
