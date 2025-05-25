import { AlmSettingsClient } from '../AlmSettingsClient';

describe('AlmSettingsClient', () => {
  let client: AlmSettingsClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    client = new AlmSettingsClient('https://sonarqube.example.com', 'test-token');
  });

  describe('countBinding', () => {
    it('should count bindings for an ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ projects: 5 }),
      });

      const result = await client.countBinding({ almSetting: 'my-github' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/count_binding?almSetting=my-github',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual({ projects: 5 });
    });
  });

  describe('create operations', () => {
    it('should create Azure ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.createAzure({
        key: 'my-azure',
        personalAccessToken: 'token123',
        url: 'https://dev.azure.com/myorg',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/create_azure',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-azure',
            personalAccessToken: 'token123',
            url: 'https://dev.azure.com/myorg',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should create GitHub ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.createGitHub({
        key: 'my-github',
        appId: 'app123',
        clientId: 'client123',
        clientSecret: 'secret123',
        privateKey: 'private-key',
        url: 'https://github.com',
        webhookSecret: 'webhook-secret',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/create_github',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-github',
            appId: 'app123',
            clientId: 'client123',
            clientSecret: 'secret123',
            privateKey: 'private-key',
            url: 'https://github.com',
            webhookSecret: 'webhook-secret',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should create GitLab ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.createGitLab({
        key: 'my-gitlab',
        personalAccessToken: 'token123',
        url: 'https://gitlab.com',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/create_gitlab',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-gitlab',
            personalAccessToken: 'token123',
            url: 'https://gitlab.com',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should create Bitbucket ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.createBitbucket({
        key: 'my-bitbucket',
        personalAccessToken: 'token123',
        url: 'https://bitbucket.example.com',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/create_bitbucket',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-bitbucket',
            personalAccessToken: 'token123',
            url: 'https://bitbucket.example.com',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should create Bitbucket Cloud ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.createBitbucketCloud({
        key: 'my-bitbucket-cloud',
        clientId: 'client123',
        clientSecret: 'secret123',
        workspace: 'my-workspace',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/create_bitbucketcloud',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-bitbucket-cloud',
            clientId: 'client123',
            clientSecret: 'secret123',
            workspace: 'my-workspace',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });
  });

  describe('update operations', () => {
    it('should update Azure ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.updateAzure({
        key: 'my-azure',
        newKey: 'my-azure-renamed',
        url: 'https://dev.azure.com/neworg',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/update_azure',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-azure',
            newKey: 'my-azure-renamed',
            url: 'https://dev.azure.com/neworg',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should update GitHub ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.updateGitHub({
        key: 'my-github',
        appId: 'app456',
        clientId: 'client456',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/update_github',
        {
          method: 'POST',
          body: JSON.stringify({
            key: 'my-github',
            appId: 'app456',
            clientId: 'client456',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });
  });

  describe('delete', () => {
    it('should delete ALM setting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.delete({ key: 'my-alm' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/delete',
        {
          method: 'POST',
          body: JSON.stringify({ key: 'my-alm' }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });
  });

  describe('list operations', () => {
    it('should list ALM settings without project', async () => {
      const mockResponse = {
        almSettings: [
          { key: 'github1', alm: 'github', url: 'https://github.com' },
          { key: 'azure1', alm: 'azure', url: 'https://dev.azure.com' },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.list();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/list',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should list ALM settings for a project', async () => {
      const mockResponse = {
        almSettings: [{ key: 'github1', alm: 'github', url: 'https://github.com' }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.list({ project: 'my-project' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/list?project=my-project',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should list ALM definitions', async () => {
      const mockResponse = {
        azure: [{ key: 'azure1', alm: 'azure', url: 'https://dev.azure.com' }],
        bitbucket: [],
        bitbucketcloud: [],
        github: [{ key: 'github1', alm: 'github', url: 'https://github.com' }],
        gitlab: [{ key: 'gitlab1', alm: 'gitlab', url: 'https://gitlab.com' }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.listDefinitions();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/list_definitions',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('binding operations', () => {
    it('should get project binding', async () => {
      const mockResponse = {
        alm: 'github',
        key: 'my-github',
        repository: 'org/repo',
        url: 'https://github.com',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.getBinding({ project: 'my-project' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/get_binding?project=my-project',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete project binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.deleteBinding({ project: 'my-project' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/delete_binding',
        {
          method: 'POST',
          body: JSON.stringify({ project: 'my-project' }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should set Azure binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.setAzureBinding({
        almSetting: 'my-azure',
        project: 'my-project',
        projectName: 'MyProject',
        repositoryName: 'MyRepo',
        monorepo: true,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/set_azure_binding',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-azure',
            project: 'my-project',
            projectName: 'MyProject',
            repositoryName: 'MyRepo',
            monorepo: true,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should set GitHub binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.setGitHubBinding({
        almSetting: 'my-github',
        project: 'my-project',
        repository: 'org/repo',
        summaryCommentEnabled: true,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/set_github_binding',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-github',
            project: 'my-project',
            repository: 'org/repo',
            summaryCommentEnabled: true,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should set GitLab binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.setGitLabBinding({
        almSetting: 'my-gitlab',
        project: 'my-project',
        repository: '123',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/set_gitlab_binding',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-gitlab',
            project: 'my-project',
            repository: '123',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should set Bitbucket binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.setBitbucketBinding({
        almSetting: 'my-bitbucket',
        project: 'my-project',
        repository: 'repo',
        slug: 'proj',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/set_bitbucket_binding',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-bitbucket',
            project: 'my-project',
            repository: 'repo',
            slug: 'proj',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should set Bitbucket Cloud binding', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await client.setBitbucketCloudBinding({
        almSetting: 'my-bitbucket-cloud',
        project: 'my-project',
        repository: 'repo-slug',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/set_bitbucketcloud_binding',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-bitbucket-cloud',
            project: 'my-project',
            repository: 'repo-slug',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });
  });

  describe('validate', () => {
    it('should validate ALM setting', async () => {
      const mockResponse = {
        validationStatus: 'success',
        errors: [],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.validate({ key: 'my-alm' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_settings/validate?key=my-alm',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return validation errors', async () => {
      const mockResponse = {
        validationStatus: 'failure',
        errors: [{ message: 'Authentication failed', details: 'Invalid token' }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await client.validate({ key: 'my-alm' });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.list()).rejects.toThrow('SonarQube API error: 401 Unauthorized');
    });
  });
});
