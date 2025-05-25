import { AlmIntegrationsClient } from '../AlmIntegrationsClient';
import type {
  ListAzureProjectsResponse,
  SearchAzureReposResponse,
  ListBitbucketServerProjectsResponse,
  SearchBitbucketServerReposResponse,
  SearchBitbucketCloudReposResponse,
  SearchGitLabReposResponse,
} from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('AlmIntegrationsClient', () => {
  let client: AlmIntegrationsClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AlmIntegrationsClient('https://sonarqube.example.com', 'test-token');
  });

  describe('setPat', () => {
    it('should set personal access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      } as Response);

      await client.setPat({
        almSetting: 'my-github',
        pat: 'ghp_xxxxxxxxxxxx',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_integrations/set_pat',
        {
          method: 'POST',
          body: JSON.stringify({
            almSetting: 'my-github',
            pat: 'ghp_xxxxxxxxxxxx',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should include username for Bitbucket Cloud', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      } as Response);

      await client.setPat({
        almSetting: 'bitbucket-cloud',
        pat: 'app-password',
        username: 'john.doe',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            almSetting: 'bitbucket-cloud',
            pat: 'app-password',
            username: 'john.doe',
          }),
        })
      );
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(
        client.setPat({
          almSetting: 'my-github',
          pat: 'invalid-token',
        })
      ).rejects.toThrow('SonarQube API error: 401 Unauthorized');
    });
  });

  describe('listAzureProjects', () => {
    it('should list Azure projects', async () => {
      const mockResponse: ListAzureProjectsResponse = {
        projects: [
          { key: 'proj1', name: 'Project 1' },
          { key: 'proj2', name: 'Project 2', description: 'Second project' },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.listAzureProjects({
        almSetting: 'azure-devops',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_integrations/list_azure_projects?almSetting=azure-devops',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            projects: [],
            paging: { pageIndex: 2, pageSize: 50, total: 100 },
          }),
      } as Response);

      await client.listAzureProjects({
        almSetting: 'azure-devops',
        p: 2,
        ps: 50,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_integrations/list_azure_projects?almSetting=azure-devops&p=2&ps=50',
        expect.any(Object)
      );
    });
  });

  describe('searchAzureRepos', () => {
    it('should search Azure repositories', async () => {
      const mockResponse: SearchAzureReposResponse = {
        repositories: [
          {
            id: 'repo1',
            name: 'Repository 1',
            project: 'Project 1',
            url: 'https://dev.azure.com/org/proj/_git/repo1',
          },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.searchAzureRepos({
        almSetting: 'azure-devops',
        projectName: 'Project 1',
        searchQuery: 'repo',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_integrations/search_azure_repos?almSetting=azure-devops&projectName=Project+1&searchQuery=repo',
        expect.any(Object)
      );
    });
  });

  describe('searchAzureReposBuilder', () => {
    it('should create a builder for Azure repository search', async () => {
      const mockResponse: SearchAzureReposResponse = {
        repositories: [
          { id: '1', name: 'Repo 1', project: 'Proj 1' },
          { id: '2', name: 'Repo 2', project: 'Proj 1' },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client
        .searchAzureReposBuilder()
        .withAlmSetting('azure-devops')
        .inProject('Proj 1')
        .withQuery('Repo')
        .pageSize(20)
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should iterate through all repositories', async () => {
      // First page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            repositories: [
              { id: '1', name: 'Repo 1', project: 'Proj 1' },
              { id: '2', name: 'Repo 2', project: 'Proj 1' },
            ],
            paging: { pageIndex: 1, pageSize: 2, total: 3 },
          }),
      } as Response);

      // Second page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            repositories: [{ id: '3', name: 'Repo 3', project: 'Proj 1' }],
            paging: { pageIndex: 2, pageSize: 2, total: 3 },
          }),
      } as Response);

      const builder = client
        .searchAzureReposBuilder()
        .withAlmSetting('azure-devops')
        .inProject('Proj 1')
        .pageSize(2);

      const repos = [];
      for await (const repo of builder.all()) {
        repos.push(repo);
      }

      expect(repos).toHaveLength(3);
      expect(repos[0]?.name).toBe('Repo 1');
      expect(repos[2]?.name).toBe('Repo 3');
    });
  });

  describe('listBitbucketServerProjects', () => {
    it('should list Bitbucket Server projects', async () => {
      const mockResponse: ListBitbucketServerProjectsResponse = {
        projects: [
          { key: 'PROJ1', name: 'Project 1', id: 1 },
          { key: 'PROJ2', name: 'Project 2', id: 2 },
        ],
        isLastPage: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.listBitbucketServerProjects({
        almSetting: 'bitbucket-server',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchBitbucketServerReposBuilder', () => {
    it('should create a builder for Bitbucket Server repository search', async () => {
      const mockResponse: SearchBitbucketServerReposResponse = {
        repositories: [
          {
            id: 1,
            name: 'Repository 1',
            slug: 'repo1',
            projectKey: 'PROJ1',
          },
        ],
        isLastPage: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client
        .searchBitbucketServerReposBuilder()
        .withAlmSetting('bitbucket-server')
        .inProject('PROJ1')
        .withRepositoryName('repo')
        .pageSize(20)
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchBitbucketServerRepos', () => {
    it('should search Bitbucket Server repositories', async () => {
      const mockResponse: SearchBitbucketServerReposResponse = {
        repositories: [
          {
            id: 1,
            name: 'Repository 1',
            slug: 'repo1',
            projectKey: 'PROJ1',
            links: {
              clone: [{ href: 'https://bitbucket.example.com/scm/proj1/repo1.git', name: 'http' }],
            },
          },
        ],
        isLastPage: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.searchBitbucketServerRepos({
        almSetting: 'bitbucket-server',
        projectKey: 'PROJ1',
        repositoryName: 'repo',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchBitbucketCloudReposBuilder', () => {
    it('should create a builder for Bitbucket Cloud repository search', async () => {
      const mockResponse: SearchBitbucketCloudReposResponse = {
        repositories: [
          {
            uuid: '{uuid-1}',
            name: 'Repository 1',
            slug: 'repo1',
            projectKey: 'PROJ1',
            workspace: 'my-workspace',
          },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client
        .searchBitbucketCloudReposBuilder()
        .withAlmSetting('bitbucket-cloud')
        .inWorkspace('my-workspace')
        .withRepositoryName('repo')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchBitbucketCloudRepos', () => {
    it('should search Bitbucket Cloud repositories', async () => {
      const mockResponse: SearchBitbucketCloudReposResponse = {
        repositories: [
          {
            uuid: '{uuid-1}',
            name: 'Repository 1',
            slug: 'repo1',
            projectKey: 'PROJ1',
            workspace: 'my-workspace',
          },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.searchBitbucketCloudRepos({
        almSetting: 'bitbucket-cloud',
        workspaceId: 'my-workspace',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchGitLabReposBuilder', () => {
    it('should create a builder for GitLab project search', async () => {
      const mockResponse: SearchGitLabReposResponse = {
        projects: [
          {
            id: '123',
            name: 'Project 1',
            pathName: 'group/project1',
            pathSlug: 'group-project1',
          },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client
        .searchGitLabReposBuilder()
        .withAlmSetting('gitlab')
        .withProjectName('project')
        .withMinAccessLevel(30)
        .pageSize(50)
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchGitLabRepos', () => {
    it('should search GitLab projects', async () => {
      const mockResponse: SearchGitLabReposResponse = {
        projects: [
          {
            id: '123',
            name: 'Project 1',
            pathName: 'group/project1',
            pathSlug: 'group-project1',
            url: 'https://gitlab.com/group/project1',
          },
        ],
        paging: { pageIndex: 1, pageSize: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await client.searchGitLabRepos({
        almSetting: 'gitlab',
        projectName: 'project',
        minAccessLevel: 30,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/alm_integrations/search_gitlab_repos?almSetting=gitlab&projectName=project&minAccessLevel=30',
        expect.any(Object)
      );
    });
  });
});
