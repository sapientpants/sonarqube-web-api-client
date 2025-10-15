// @ts-nocheck
import { PermissionsClient } from '../../../../src/resources/permissions/PermissionsClient';
import {
  SearchGlobalPermissionsBuilder,
  SearchProjectPermissionsBuilder,
  SearchTemplatesBuilder,
  BulkApplyTemplateBuilder,
} from '../../../../src/resources/permissions/builders';
import { server } from '../../../../src/test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import type {
  CreateTemplateResponse,
  UpdateTemplateResponse,
} from '../../../../src/resources/permissions/types';

const mockBaseUrl = 'https://sonarqube.example.com';
const mockToken = 'test-token';
const mockOrganization = 'test-org';

describe('PermissionsClient', () => {
  let client: PermissionsClient;

  beforeEach(() => {
    client = new PermissionsClient(mockBaseUrl, mockToken, mockOrganization);
  });

  // ============================================================================
  // USER PERMISSION OPERATIONS
  // ============================================================================

  describe('addUserPermission', () => {
    it('should add global permission to user', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_user`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('permission')).toBe('scan');
          expect(url.searchParams.get('organization')).toBe('my-org');
          expect(url.searchParams.get('projectId')).toBeNull();
          expect(url.searchParams.get('projectKey')).toBeNull();
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addUserPermission({
        login: 'john.doe',
        permission: 'scan',
        organization: 'my-org',
      });
    });

    it('should add project permission to user', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_user`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('organization')).toBe('my-org');
          expect(url.searchParams.get('projectKey')).toBe('my-project');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addUserPermission({
        login: 'john.doe',
        permission: 'codeviewer',
        projectKey: 'my-project',
        organization: 'my-org',
      });
    });
  });

  describe('removeUserPermission', () => {
    it('should remove user permission', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/remove_user`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('permission')).toBe('scan');
          expect(url.searchParams.get('organization')).toBe('my-org');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.removeUserPermission({
        login: 'john.doe',
        permission: 'scan',
        organization: 'my-org',
      });
    });
  });

  describe('addUserToTemplate', () => {
    it('should add user to permission template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_user_to_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('templateName')).toBe('Default Template');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addUserToTemplate({
        login: 'john.doe',
        permission: 'codeviewer',
        templateName: 'Default Template',
      });
    });
  });

  describe('removeUserFromTemplate', () => {
    it('should remove user from permission template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/remove_user_from_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('templateId')).toBe('template-uuid');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.removeUserFromTemplate({
        login: 'john.doe',
        permission: 'codeviewer',
        templateId: 'template-uuid',
      });
    });
  });

  // ============================================================================
  // GROUP PERMISSION OPERATIONS
  // ============================================================================

  describe('addGroupPermission', () => {
    it('should add permission to group', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_group`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('developers');
          expect(url.searchParams.get('permission')).toBe('scan');
          expect(url.searchParams.get('organization')).toBe('my-org');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addGroupPermission({
        groupName: 'developers',
        permission: 'scan',
        organization: 'my-org',
      });
    });

    it('should add permission to anyone group', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_group`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('anyone');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('projectKey')).toBe('my-project');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addGroupPermission({
        groupName: 'anyone',
        permission: 'codeviewer',
        projectKey: 'my-project',
      });
    });
  });

  describe('removeGroupPermission', () => {
    it('should remove permission from group', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/remove_group`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('developers');
          expect(url.searchParams.get('permission')).toBe('scan');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.removeGroupPermission({
        groupName: 'developers',
        permission: 'scan',
      });
    });
  });

  describe('addGroupToTemplate', () => {
    it('should add group to permission template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_group_to_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('developers');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('templateName')).toBe('Default Template');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addGroupToTemplate({
        groupName: 'developers',
        permission: 'codeviewer',
        templateName: 'Default Template',
      });
    });
  });

  describe('removeGroupFromTemplate', () => {
    it('should remove group from permission template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/remove_group_from_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('developers');
          expect(url.searchParams.get('permission')).toBe('codeviewer');
          expect(url.searchParams.get('templateId')).toBe('template-uuid');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.removeGroupFromTemplate({
        groupName: 'developers',
        permission: 'codeviewer',
        templateId: 'template-uuid',
      });
    });
  });

  // ============================================================================
  // PROJECT CREATOR OPERATIONS
  // ============================================================================

  describe('addProjectCreatorToTemplate', () => {
    it('should add project creator to template', async () => {
      server.use(
        http.post(
          `${mockBaseUrl}/api/permissions/add_project_creator_to_template`,
          ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('permission')).toBe('admin');
            expect(url.searchParams.get('templateName')).toBe('Default Template');
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      await client.addProjectCreatorToTemplate({
        permission: 'admin',
        templateName: 'Default Template',
      });
    });
  });

  describe('removeProjectCreatorFromTemplate', () => {
    it('should remove project creator from template', async () => {
      server.use(
        http.post(
          `${mockBaseUrl}/api/permissions/remove_project_creator_from_template`,
          ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('permission')).toBe('admin');
            expect(url.searchParams.get('templateId')).toBe('template-uuid');
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      await client.removeProjectCreatorFromTemplate({
        permission: 'admin',
        templateId: 'template-uuid',
      });
    });
  });

  // ============================================================================
  // TEMPLATE MANAGEMENT OPERATIONS
  // ============================================================================

  describe('createTemplate', () => {
    it('should create permission template', async () => {
      const mockResponse: CreateTemplateResponse = {
        permissionTemplate: {
          id: 'template-uuid',
          name: 'Mobile Projects Template',
          description: 'Template for mobile application projects',
          projectKeyPattern: '.*mobile.*',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      server.use(
        http.post(`${mockBaseUrl}/api/permissions/create_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('name')).toBe('Mobile Projects Template');
          expect(url.searchParams.get('description')).toBe(
            'Template for mobile application projects',
          );
          expect(url.searchParams.get('projectKeyPattern')).toBe('.*mobile.*');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.createTemplate({
        name: 'Mobile Projects Template',
        description: 'Template for mobile application projects',
        projectKeyPattern: '.*mobile.*',
      });

      expect(result.permissionTemplate.id).toBe('template-uuid');
      expect(result.permissionTemplate.name).toBe('Mobile Projects Template');
    });
  });

  describe('updateTemplate', () => {
    it('should update permission template', async () => {
      const mockResponse: UpdateTemplateResponse = {
        permissionTemplate: {
          id: 'template-uuid',
          name: 'Updated Template Name',
          description: 'Updated description',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T01:00:00Z',
        },
      };

      server.use(
        http.post(`${mockBaseUrl}/api/permissions/update_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('id')).toBe('template-uuid');
          expect(url.searchParams.get('name')).toBe('Updated Template Name');
          expect(url.searchParams.get('description')).toBe('Updated description');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.updateTemplate({
        id: 'template-uuid',
        name: 'Updated Template Name',
        description: 'Updated description',
      });

      expect(result.permissionTemplate.name).toBe('Updated Template Name');
      expect(result.permissionTemplate.description).toBe('Updated description');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete permission template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/delete_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('templateName')).toBe('Old Template');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.deleteTemplate({
        templateName: 'Old Template',
      });
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to project', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/apply_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('projectKey')).toBe('my-project');
          expect(url.searchParams.get('templateName')).toBe('Mobile Projects Template');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.applyTemplate({
        projectKey: 'my-project',
        templateName: 'Mobile Projects Template',
      });
    });
  });

  describe('setDefaultTemplate', () => {
    it('should set default template', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/set_default_template`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('templateName')).toBe('Default Template');
          expect(url.searchParams.get('qualifier')).toBe('TRK');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.setDefaultTemplate({
        templateName: 'Default Template',
        qualifier: 'TRK',
      });
    });
  });

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  describe('searchGlobalPermissions', () => {
    it('should return a SearchGlobalPermissionsBuilder instance', () => {
      const builder = client.searchGlobalPermissions();
      expect(builder).toBeInstanceOf(SearchGlobalPermissionsBuilder);
    });
  });

  describe('searchProjectPermissions', () => {
    it('should return a SearchProjectPermissionsBuilder instance', () => {
      const builder = client.searchProjectPermissions();
      expect(builder).toBeInstanceOf(SearchProjectPermissionsBuilder);
    });
  });

  describe('searchTemplates', () => {
    it('should return a SearchTemplatesBuilder instance', () => {
      const builder = client.searchTemplates();
      expect(builder).toBeInstanceOf(SearchTemplatesBuilder);
    });
  });

  describe('bulkApplyTemplate', () => {
    it('should return a BulkApplyTemplateBuilder instance', () => {
      const builder = client.bulkApplyTemplate();
      expect(builder).toBeInstanceOf(BulkApplyTemplateBuilder);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const unauthorizedClient = new PermissionsClient(mockBaseUrl, 'invalid-token');

      await expect(
        unauthorizedClient.addUserPermission({
          login: 'john.doe',
          permission: 'scan',
          organization: 'my-org',
        }),
      ).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_user`, () => {
          return new HttpResponse(
            JSON.stringify({
              errors: [{ msg: 'User not found' }],
            }),
            { status: 404 },
          );
        }),
      );

      await expect(
        client.addUserPermission({
          login: 'nonexistent.user',
          permission: 'scan',
          organization: 'my-org',
        }),
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // ORGANIZATION PARAMETER HANDLING
  // ============================================================================

  describe('organization parameter handling', () => {
    it('should use organization from request parameters', async () => {
      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_user`, ({ request }) => {
          const url = new URL(request.url);
          // The organization in the request should be used (not constructor organization)
          expect(url.searchParams.get('organization')).toBe('my-org');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.addUserPermission({
        login: 'john.doe',
        permission: 'scan',
        organization: 'my-org',
      });
    });

    it('should handle missing organization gracefully', async () => {
      const clientWithoutOrg = new PermissionsClient(mockBaseUrl, mockToken);

      server.use(
        http.post(`${mockBaseUrl}/api/permissions/add_group`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('groupName')).toBe('developers');
          expect(url.searchParams.get('permission')).toBe('scan');
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await clientWithoutOrg.addGroupPermission({
        groupName: 'developers',
        permission: 'scan',
      });
    });
  });
});
