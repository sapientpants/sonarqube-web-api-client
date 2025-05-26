import { ApplicationsClient } from '../ApplicationsClient';
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
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    client = new ApplicationsClient('http://localhost:9000', 'token123');
  });

  describe('addProject', () => {
    it('should add a project to an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: AddProjectRequest = {
        application: 'my-app',
        project: 'my-project',
      };

      await client.addProject(params);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9000/api/applications/add_project', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const params: CreateApplicationRequest = {
        key: 'my-app',
        name: 'My Application',
        description: 'Test application',
        visibility: 'private',
      };

      const result = await client.create(params);

      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9000/api/applications/create', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    });
  });

  describe('createBranch', () => {
    it('should create a branch on an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: CreateBranchRequest = {
        application: 'my-app',
        branch: 'feature',
        project: 'my-project',
        projectBranch: 'feature-branch',
      };

      await client.createBranch(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/create_branch',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
    });
  });

  describe('delete', () => {
    it('should delete an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: DeleteApplicationRequest = {
        application: 'my-app',
      };

      await client.delete(params);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9000/api/applications/delete', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch from an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: DeleteBranchRequest = {
        application: 'my-app',
        branch: 'feature',
      };

      await client.deleteBranch(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/delete_branch',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
    });
  });

  describe('removeProject', () => {
    it('should remove a project from an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: RemoveProjectRequest = {
        application: 'my-app',
        project: 'my-project',
      };

      await client.removeProject(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/remove_project',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
    });
  });

  describe('setTags', () => {
    it('should set tags on an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: SetTagsRequest = {
        application: 'my-app',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      await client.setTags(params);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9000/api/applications/set_tags', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application: 'my-app',
          tags: 'tag1,tag2,tag3',
        }),
      });
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const params: ShowApplicationRequest = {
        application: 'my-app',
      };

      const result = await client.show(params);

      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/show?application=my-app',
        {
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should show application details with branch', async () => {
      const response: ShowApplicationResponse = {
        application: {
          key: 'my-app',
          name: 'My Application',
          visibility: 'private',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(response),
      });

      const params: ShowApplicationRequest = {
        application: 'my-app',
        branch: 'feature',
      };

      const result = await client.show(params);

      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/show?application=my-app&branch=feature',
        {
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('update', () => {
    it('should update an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: UpdateApplicationRequest = {
        application: 'my-app',
        name: 'My Updated Application',
        description: 'Updated description',
      };

      await client.update(params);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9000/api/applications/update', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    });
  });

  describe('updateBranch', () => {
    it('should update a branch on an application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const params: UpdateBranchRequest = {
        application: 'my-app',
        branch: 'feature',
        name: 'Updated Feature',
        project: 'my-project',
        projectBranch: 'feature-updated',
      };

      await client.updateBranch(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9000/api/applications/update_branch',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer token123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
    });
  });

  describe('error handling', () => {
    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Application not found',
      });

      await expect(client.delete({ application: 'non-existent' })).rejects.toThrow(
        'SonarQube API error: 404 Not Found'
      );
    });
  });
});
