import {
  SearchProjectPermissionsBuilder,
  SearchTemplatesBuilder,
  BulkApplyTemplateBuilder,
} from '../builders';
import { ValidationError } from '../../../errors';
import type {
  SearchProjectPermissionsResponse,
  SearchTemplatesResponse,
  UserPermission,
} from '../types';

describe('Permissions Builders', () => {
  // ============================================================================
  // SearchProjectPermissionsBuilder
  // ============================================================================

  describe('SearchProjectPermissionsBuilder', () => {
    let mockExecutor: jest.Mock;
    let builder: SearchProjectPermissionsBuilder;

    beforeEach(() => {
      mockExecutor = jest.fn();
      builder = new SearchProjectPermissionsBuilder(mockExecutor);
    });

    describe('fluent interface', () => {
      it('should set project ID parameter', () => {
        const result = builder.projectId('project-uuid');
        expect(result).toBe(builder);
        expect(builder['params'].projectId).toBe('project-uuid');
      });

      it('should set project key parameter', () => {
        const result = builder.projectKey('my-project');
        expect(result).toBe(builder);
        expect(builder['params'].projectKey).toBe('my-project');
      });

      it('should set organization parameter', () => {
        const result = builder.organization('my-org');
        expect(result).toBe(builder);
        expect(builder['params'].organization).toBe('my-org');
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
        const result = builder
          .projectKey('my-project')
          .organization('my-org')
          .query('search-term')
          .page(1)
          .pageSize(50);

        expect(result).toBe(builder);
        expect(builder['params'].projectKey).toBe('my-project');
        expect(builder['params'].organization).toBe('my-org');
        expect(builder['params'].q).toBe('search-term');
        expect(builder['params'].p).toBe(1);
        expect(builder['params'].ps).toBe(50);
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        const mockResponse: SearchProjectPermissionsResponse = {
          users: [
            {
              login: 'john.doe',
              name: 'John Doe',
              email: 'john@example.com',
              permissions: ['admin', 'codeviewer'],
            },
          ],
          groups: [
            {
              name: 'developers',
              description: 'Development team',
              permissions: ['codeviewer', 'user'],
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 25,
            total: 1,
          },
        };

        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.projectKey('my-project').query('john').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          projectKey: 'my-project',
          q: 'john',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should execute with minimal parameters', async () => {
        const mockResponse: SearchProjectPermissionsResponse = {
          users: [],
          groups: [],
          paging: {
            pageIndex: 1,
            pageSize: 25,
            total: 0,
          },
        };

        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.execute();

        expect(mockExecutor).toHaveBeenCalledWith({});
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getItems', () => {
      it('should extract users from response', () => {
        const users: UserPermission[] = [
          {
            login: 'john.doe',
            name: 'John Doe',
            permissions: ['admin'],
          },
          {
            login: 'jane.doe',
            name: 'Jane Doe',
            permissions: ['codeviewer'],
          },
        ];

        const response: SearchProjectPermissionsResponse = {
          users,
          groups: [],
          paging: {
            pageIndex: 1,
            pageSize: 25,
            total: 2,
          },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(users);
      });

      it('should handle empty users array', () => {
        const response: SearchProjectPermissionsResponse = {
          users: [],
          groups: [],
          paging: {
            pageIndex: 1,
            pageSize: 25,
            total: 0,
          },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual([]);
      });

      it('should handle missing users property', () => {
        const response: SearchProjectPermissionsResponse = {
          groups: [],
          paging: {
            pageIndex: 1,
            pageSize: 25,
            total: 0,
          },
        } as SearchProjectPermissionsResponse;

        const items = builder['getItems'](response);
        expect(items).toEqual([]);
      });
    });
  });

  // ============================================================================
  // SearchTemplatesBuilder
  // ============================================================================

  describe('SearchTemplatesBuilder', () => {
    let mockExecutor: jest.Mock;
    let builder: SearchTemplatesBuilder;

    beforeEach(() => {
      mockExecutor = jest.fn();
      builder = new SearchTemplatesBuilder(mockExecutor);
    });

    describe('fluent interface', () => {
      it('should set query parameter', () => {
        const result = builder.query('mobile');
        expect(result).toBe(builder);
        expect(builder['params'].q).toBe('mobile');
      });

      it('should set organization parameter', () => {
        const result = builder.organization('my-org');
        expect(result).toBe(builder);
        expect(builder['params'].organization).toBe('my-org');
      });

      it('should support method chaining', () => {
        const result = builder.query('mobile').organization('my-org');

        expect(result).toBe(builder);
        expect(builder['params'].q).toBe('mobile');
        expect(builder['params'].organization).toBe('my-org');
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        const mockResponse: SearchTemplatesResponse = {
          permissionTemplates: [
            {
              id: 'template-1',
              name: 'Mobile Template',
              description: 'Template for mobile projects',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
            },
          ],
          defaultTemplates: [
            {
              templateId: 'template-1',
              qualifier: 'TRK',
            },
          ],
        };

        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.query('mobile').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          q: 'mobile',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should execute with no parameters', async () => {
        const mockResponse: SearchTemplatesResponse = {
          permissionTemplates: [],
          defaultTemplates: [],
        };

        mockExecutor.mockResolvedValue(mockResponse);

        const result = await builder.execute();

        expect(mockExecutor).toHaveBeenCalledWith({});
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // BulkApplyTemplateBuilder
  // ============================================================================

  describe('BulkApplyTemplateBuilder', () => {
    let mockExecutor: jest.Mock;
    let builder: BulkApplyTemplateBuilder;

    beforeEach(() => {
      mockExecutor = jest.fn();
      builder = new BulkApplyTemplateBuilder(mockExecutor);
    });

    describe('fluent interface', () => {
      it('should set template ID parameter', () => {
        const result = builder.templateId('template-uuid');
        expect(result).toBe(builder);
        expect(builder['params'].templateId).toBe('template-uuid');
      });

      it('should set template name parameter', () => {
        const result = builder.templateName('Mobile Template');
        expect(result).toBe(builder);
        expect(builder['params'].templateName).toBe('Mobile Template');
      });

      it('should set organization parameter', () => {
        const result = builder.organization('my-org');
        expect(result).toBe(builder);
        expect(builder['params'].organization).toBe('my-org');
      });

      it('should set query parameter', () => {
        const result = builder.query('mobile');
        expect(result).toBe(builder);
        expect(builder['params'].q).toBe('mobile');
      });

      it('should set qualifiers parameter', () => {
        const result = builder.qualifiers('TRK');
        expect(result).toBe(builder);
        expect(builder['params'].qualifiers).toBe('TRK');
      });

      it('should set analyzed before parameter', () => {
        const result = builder.analyzedBefore('2024-01-01');
        expect(result).toBe(builder);
        expect(builder['params'].analyzedBefore).toBe('2024-01-01');
      });

      it('should set onProvisionedOnly parameter with default value', () => {
        const result = builder.onProvisionedOnly();
        expect(result).toBe(builder);
        expect(builder['params'].onProvisionedOnly).toBe(true);
      });

      it('should set onProvisionedOnly parameter with custom value', () => {
        const result = builder.onProvisionedOnly(false);
        expect(result).toBe(builder);
        expect(builder['params'].onProvisionedOnly).toBe(false);
      });

      it('should set projects parameter', () => {
        const projectKeys = ['project1', 'project2', 'project3'];
        const result = builder.projects(projectKeys);
        expect(result).toBe(builder);
        expect(builder['params'].projects).toEqual(projectKeys);
      });

      it('should support method chaining', () => {
        const result = builder
          .templateName('Mobile Template')
          .query('mobile')
          .qualifiers('TRK')
          .onProvisionedOnly(true);

        expect(result).toBe(builder);
        expect(builder['params'].templateName).toBe('Mobile Template');
        expect(builder['params'].q).toBe('mobile');
        expect(builder['params'].qualifiers).toBe('TRK');
        expect(builder['params'].onProvisionedOnly).toBe(true);
      });
    });

    describe('projects validation', () => {
      it('should accept up to 1000 projects', () => {
        const projectKeys = Array.from({ length: 1000 }, (_, i) => `project-${i.toString()}`);
        expect(() => builder.projects(projectKeys)).not.toThrow();
        expect(builder['params'].projects).toEqual(projectKeys);
      });

      it('should throw ValidationError for more than 1000 projects', () => {
        const projectKeys = Array.from({ length: 1001 }, (_, i) => `project-${i.toString()}`);
        expect(() => builder.projects(projectKeys)).toThrow(ValidationError);
        expect(() => builder.projects(projectKeys)).toThrow(
          'Maximum of 1000 projects can be specified'
        );
      });
    });

    describe('execute validation', () => {
      it('should require template ID or name', async () => {
        builder.query('mobile');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow(
          'Either templateId or templateName must be provided'
        );
      });

      it('should require at least one project selection method', async () => {
        builder.templateName('Mobile Template');

        await expect(builder.execute()).rejects.toThrow(ValidationError);
        await expect(builder.execute()).rejects.toThrow(
          'At least one project selection method must be specified'
        );
      });

      it('should execute with valid template ID and projects', async () => {
        mockExecutor.mockResolvedValue(undefined);

        await builder.templateId('template-uuid').projects(['project1', 'project2']).execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateId: 'template-uuid',
          projects: ['project1', 'project2'],
        });
      });

      it('should execute with valid template name and query', async () => {
        mockExecutor.mockResolvedValue(undefined);

        await builder.templateName('Mobile Template').query('mobile').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateName: 'Mobile Template',
          q: 'mobile',
        });
      });

      it('should execute with analyzed before parameter', async () => {
        mockExecutor.mockResolvedValue(undefined);

        await builder.templateId('template-uuid').analyzedBefore('2024-01-01').execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateId: 'template-uuid',
          analyzedBefore: '2024-01-01',
        });
      });

      it('should execute with onProvisionedOnly parameter', async () => {
        mockExecutor.mockResolvedValue(undefined);

        await builder.templateName('Template').onProvisionedOnly(true).execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateName: 'Template',
          onProvisionedOnly: true,
        });
      });
    });

    describe('complex scenarios', () => {
      it('should handle multiple project selection methods', async () => {
        mockExecutor.mockResolvedValue(undefined);

        // This should be valid - multiple selection methods can be combined
        await builder
          .templateId('template-uuid')
          .projects(['project1'])
          .query('mobile')
          .analyzedBefore('2024-01-01')
          .onProvisionedOnly(true)
          .execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateId: 'template-uuid',
          projects: ['project1'],
          q: 'mobile',
          analyzedBefore: '2024-01-01',
          onProvisionedOnly: true,
        });
      });

      it('should handle all parameters', async () => {
        mockExecutor.mockResolvedValue(undefined);

        await builder
          .templateId('template-uuid')
          .organization('my-org')
          .projects(['project1', 'project2'])
          .query('mobile')
          .qualifiers('TRK')
          .analyzedBefore('2024-01-01')
          .onProvisionedOnly(false)
          .execute();

        expect(mockExecutor).toHaveBeenCalledWith({
          templateId: 'template-uuid',
          organization: 'my-org',
          projects: ['project1', 'project2'],
          q: 'mobile',
          qualifiers: 'TRK',
          analyzedBefore: '2024-01-01',
          onProvisionedOnly: false,
        });
      });
    });
  });
});
