import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertCommonHeaders,
  assertRequestBody,
  assertQueryParams,
} from '../../../test-utils/assertions';
import { ApplicationsClient } from '../ApplicationsClient';
import { NotFoundError } from '../../../errors';
import type {
  AddProjectRequest,
  CreateApplicationRequest,
  CreateApplicationResponse,
  CreateBranchRequest,
  DeleteApplicationRequest,
  DeleteBranchRequest,
  RemoveProjectRequest,
  SetTagsRequest,
  ShowApplicationRequest,
  ShowApplicationResponse,
  UpdateApplicationRequest,
  UpdateBranchRequest,
} from '../types';

describe('ApplicationsClient', () => {
  let client: ApplicationsClient;
  const baseUrl = 'http://localhost:9000';
  const token = 'token123';

  beforeEach(() => {
    client = new ApplicationsClient(baseUrl, token);
  });

  describe('addProject', () => {
    it('should add a project to an application', async () => {
      const params: AddProjectRequest = {
        application: 'my-app',
        project: 'my-project',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/add_project`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.addProject(params);
    });
  });

  describe('create', () => {
    it('should create a new application', async () => {
      const response: CreateApplicationResponse = {
        application: {
          key: 'my-app',
          name: 'My Application',
          visibility: 'private',
        },
      };

      const params: CreateApplicationRequest = {
        key: 'my-app',
        name: 'My Application',
        description: 'Test application',
        visibility: 'private',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/create`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.create(params);
      expect(result).toEqual(response);
    });
  });

  describe('createBranch', () => {
    it('should create a branch on an application', async () => {
      const params: CreateBranchRequest = {
        application: 'my-app',
        branch: 'feature',
        project: 'my-project',
        projectBranch: 'feature-branch',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/create_branch`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.createBranch(params);
    });
  });

  describe('delete', () => {
    it('should delete an application', async () => {
      const params: DeleteApplicationRequest = {
        application: 'my-app',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/delete`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.delete(params);
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch from an application', async () => {
      const params: DeleteBranchRequest = {
        application: 'my-app',
        branch: 'feature',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/delete_branch`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.deleteBranch(params);
    });
  });

  describe('removeProject', () => {
    it('should remove a project from an application', async () => {
      const params: RemoveProjectRequest = {
        application: 'my-app',
        project: 'my-project',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/remove_project`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.removeProject(params);
    });
  });

  describe('setTags', () => {
    it('should set tags on an application', async () => {
      const params: SetTagsRequest = {
        application: 'my-app',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      server.use(
        http.post(`${baseUrl}/api/applications/set_tags`, async ({ request }) => {
          await assertRequestBody(request, {
            application: 'my-app',
            tags: 'tag1,tag2,tag3',
          });
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.setTags(params);
    });
  });

  describe('show', () => {
    it('should show application details', async () => {
      const response: ShowApplicationResponse = {
        application: {
          key: 'my-app',
          name: 'My Application',
          visibility: 'private',
          branches: [
            {
              name: 'main',
              isMain: true,
              projects: [
                {
                  key: 'project1',
                  name: 'Project 1',
                  enabled: true,
                },
              ],
            },
          ],
        },
      };

      const params: ShowApplicationRequest = {
        application: 'my-app',
      };

      server.use(
        http.get(`${baseUrl}/api/applications/show`, ({ request }) => {
          assertQueryParams(request, { application: 'my-app' });
          assertCommonHeaders(request, token);

          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.show(params);
      expect(result).toEqual(response);
    });

    it('should show application details with branch', async () => {
      const response: ShowApplicationResponse = {
        application: {
          key: 'my-app',
          name: 'My Application',
          visibility: 'private',
        },
      };

      const params: ShowApplicationRequest = {
        application: 'my-app',
        branch: 'feature',
      };

      server.use(
        http.get(`${baseUrl}/api/applications/show`, ({ request }) => {
          assertQueryParams(request, { application: 'my-app', branch: 'feature' });
          assertCommonHeaders(request, token);

          return HttpResponse.json(response);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.show(params);
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should update an application', async () => {
      const params: UpdateApplicationRequest = {
        application: 'my-app',
        name: 'My Updated Application',
        description: 'Updated description',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/update`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.update(params);
    });
  });

  describe('updateBranch', () => {
    it('should update a branch on an application', async () => {
      const params: UpdateBranchRequest = {
        application: 'my-app',
        branch: 'feature',
        name: 'Updated Feature',
        project: 'my-project',
        projectBranch: 'feature-updated',
      };

      server.use(
        http.post(`${baseUrl}/api/applications/update_branch`, async ({ request }) => {
          await assertRequestBody(request, params);
          assertCommonHeaders(request, token);

          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.updateBranch(params);
    });
  });

  describe('error handling', () => {
    it('should throw error on failed request', async () => {
      server.use(
        http.post(`${baseUrl}/api/applications/delete`, () => {
          return new HttpResponse('Application not found', {
            status: 404,
            statusText: 'Not Found',
          });
        })
      );

      await expect(client.delete({ application: 'non-existent' })).rejects.toThrow(NotFoundError);
    });
  });
});
