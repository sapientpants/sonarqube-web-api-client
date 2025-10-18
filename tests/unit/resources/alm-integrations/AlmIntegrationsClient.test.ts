// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertQueryParams,
} from '../../../../src/test-utils/assertions';
import { AlmIntegrationsClient } from '../../../../src/resources/alm-integrations/AlmIntegrationsClient';
import { AuthenticationError } from '../../../../src/errors';
import type {
  ListAzureProjectsResponse,
  SearchAzureReposResponse,
  ListBitbucketServerProjectsResponse,
  SearchBitbucketServerReposResponse,
  SearchBitbucketCloudReposResponse,
  SearchGitLabReposResponse,
} from '../../../../src/resources/alm-integrations/types';

describe('AlmIntegrationsClient', () => {
  let client: AlmIntegrationsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AlmIntegrationsClient(baseUrl, token);
  });

  describe('setPat', () => {
    it('should set personal access token', async () => {
      server.use(
        http.post(`${baseUrl}/api/alm_integrations/set_pat`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.setPat({
        almSetting: 'my-github',
        pat: 'ghp_xxxxxxxxxxxx',
      });
    });

    it('should include username for Bitbucket Cloud', async () => {
      server.use(
        http.post(`${baseUrl}/api/alm_integrations/set_pat`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            almSetting: 'bitbucket-cloud',
            pat: 'app-password',
            username: 'john.doe',
          });
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await client.setPat({
        almSetting: 'bitbucket-cloud',
        pat: 'app-password',
        username: 'john.doe',
      });
    });

    it('should throw error on failure', async () => {
      server.use(
        http.post(`${baseUrl}/api/alm_integrations/set_pat`, () => {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized',
          });
        }),
      );

      await expect(
        client.setPat({
          almSetting: 'my-github',
          pat: 'invalid-token',
        }),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('listAzureProjects', () => {
    const mockProjects: ListAzureProjectsResponse = {
      projects: [
        { key: 'proj1', name: 'Project 1' },
        { key: 'proj2', name: 'Project 2', description: 'Second project' },
      ],
      paging: { pageIndex: 1, pageSize: 10, total: 2 },
    };

    it('should list Azure projects', async () => {
      server.use(
        http.get(`${baseUrl}/api/alm_integrations/list_azure_projects`, ({ request }) => {
          assertQueryParams(request, { almSetting: 'azure-devops' });
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockProjects);
        }),
      );

      const result = await client.listAzureProjects({
        almSetting: 'azure-devops',
      });

      expect(result).toEqual(mockProjects);
    });

    it('should handle pagination parameters', async () => {
      const paginatedResponse: ListAzureProjectsResponse = {
        projects: [],
        paging: { pageIndex: 2, pageSize: 50, total: 100 },
      };

      server.use(
        http.get(`${baseUrl}/api/alm_integrations/list_azure_projects`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('almSetting')).toBe('azure-devops');
          expect(url.searchParams.get('p')).toBe('2');
          expect(url.searchParams.get('ps')).toBe('50');
          return HttpResponse.json(paginatedResponse);
        }),
      );

      await client.listAzureProjects({
        almSetting: 'azure-devops',
        p: 2,
        ps: 50,
      });
    });
  });

  describe('Azure Repos', () => {
    const mockAzureRepos: SearchAzureReposResponse = {
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

    describe('searchAzureRepos', () => {
      it('should search Azure repositories', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_azure_repos`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('almSetting')).toBe('azure-devops');
            expect(url.searchParams.get('projectName')).toBe('Project 1');
            expect(url.searchParams.get('searchQuery')).toBe('repo');
            return HttpResponse.json(mockAzureRepos);
          }),
        );

        const result = await client.searchAzureRepos({
          almSetting: 'azure-devops',
          projectName: 'Project 1',
          searchQuery: 'repo',
        });

        expect(result).toEqual(mockAzureRepos);
      });
    });

    describe('searchAzureReposBuilder', () => {
      it('should create a builder for Azure repository search', async () => {
        const builderResponse: SearchAzureReposResponse = {
          repositories: [
            { id: '1', name: 'Repo 1', project: 'Proj 1' },
            { id: '2', name: 'Repo 2', project: 'Proj 1' },
          ],
          paging: { pageIndex: 1, pageSize: 10, total: 2 },
        };

        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_azure_repos`, () => {
            return HttpResponse.json(builderResponse);
          }),
        );

        const result = await client
          .searchAzureReposBuilder()
          .withAlmSetting('azure-devops')
          .inProject('Proj 1')
          .withQuery('Repo')
          .pageSize(20)
          .execute();

        expect(result).toEqual(builderResponse);
      });

      it('should iterate through all repositories', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_azure_repos`, ({ request }) => {
            const url = new URL(request.url);
            const page = url.searchParams.get('p') ?? '1';

            if (page === '1') {
              return HttpResponse.json({
                repositories: [
                  { id: '1', name: 'Repo 1', project: 'Proj 1' },
                  { id: '2', name: 'Repo 2', project: 'Proj 1' },
                ],
                paging: { pageIndex: 1, pageSize: 2, total: 3 },
              });
            } else {
              return HttpResponse.json({
                repositories: [{ id: '3', name: 'Repo 3', project: 'Proj 1' }],
                paging: { pageIndex: 2, pageSize: 2, total: 3 },
              });
            }
          }),
        );

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
  });

  describe('Bitbucket Server', () => {
    const mockBitbucketProjects: ListBitbucketServerProjectsResponse = {
      projects: [
        { key: 'PROJ1', name: 'Project 1', id: 1 },
        { key: 'PROJ2', name: 'Project 2', id: 2 },
      ],
      isLastPage: true,
    };

    const mockBitbucketRepos: SearchBitbucketServerReposResponse = {
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

    describe('listBitbucketServerProjects', () => {
      it('should list Bitbucket Server projects', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/list_bitbucketserver_projects`, () => {
            return HttpResponse.json(mockBitbucketProjects);
          }),
        );

        const result = await client.listBitbucketServerProjects({
          almSetting: 'bitbucket-server',
        });

        expect(result).toEqual(mockBitbucketProjects);
      });
    });

    describe('searchBitbucketServerRepos', () => {
      it('should search Bitbucket Server repositories', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_bitbucketserver_repos`, () => {
            return HttpResponse.json(mockBitbucketRepos);
          }),
        );

        const result = await client.searchBitbucketServerRepos({
          almSetting: 'bitbucket-server',
          projectKey: 'PROJ1',
          repositoryName: 'repo',
        });

        expect(result).toEqual(mockBitbucketRepos);
      });
    });

    describe('searchBitbucketServerReposBuilder', () => {
      it('should create a builder for Bitbucket Server repository search', async () => {
        const builderResponse: SearchBitbucketServerReposResponse = {
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

        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_bitbucketserver_repos`, () => {
            return HttpResponse.json(builderResponse);
          }),
        );

        const result = await client
          .searchBitbucketServerReposBuilder()
          .withAlmSetting('bitbucket-server')
          .inProject('PROJ1')
          .withRepoSlug('repo')
          .pageSize(20)
          .execute();

        expect(result).toEqual(builderResponse);
      });
    });
  });

  describe('Bitbucket Cloud', () => {
    const mockBitbucketCloudRepos: SearchBitbucketCloudReposResponse = {
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

    describe('searchBitbucketCloudRepos', () => {
      it('should search Bitbucket Cloud repositories', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_bitbucketcloud_repos`, () => {
            return HttpResponse.json(mockBitbucketCloudRepos);
          }),
        );

        const result = await client.searchBitbucketCloudRepos({
          almSetting: 'bitbucket-cloud',
          workspaceId: 'my-workspace',
        });

        expect(result).toEqual(mockBitbucketCloudRepos);
      });
    });

    describe('searchBitbucketCloudReposBuilder', () => {
      it('should create a builder for Bitbucket Cloud repository search', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_bitbucketcloud_repos`, () => {
            return HttpResponse.json(mockBitbucketCloudRepos);
          }),
        );

        const result = await client
          .searchBitbucketCloudReposBuilder()
          .withAlmSetting('bitbucket-cloud')
          .inWorkspace('my-workspace')
          .withRepoSlug('repo')
          .execute();

        expect(result).toEqual(mockBitbucketCloudRepos);
      });
    });
  });

  describe('GitLab', () => {
    const mockGitLabProjects: SearchGitLabReposResponse = {
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

    describe('searchGitLabRepos', () => {
      it('should search GitLab projects', async () => {
        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_gitlab_repos`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('almSetting')).toBe('gitlab');
            expect(url.searchParams.get('projectName')).toBe('project');
            expect(url.searchParams.get('minAccessLevel')).toBe('30');
            return HttpResponse.json(mockGitLabProjects);
          }),
        );

        const result = await client.searchGitLabRepos({
          almSetting: 'gitlab',
          projectName: 'project',
          minAccessLevel: 30,
        });

        expect(result).toEqual(mockGitLabProjects);
      });
    });

    describe('searchGitLabReposBuilder', () => {
      it('should create a builder for GitLab project search', async () => {
        const builderResponse: SearchGitLabReposResponse = {
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

        server.use(
          http.get(`${baseUrl}/api/alm_integrations/search_gitlab_repos`, () => {
            return HttpResponse.json(builderResponse);
          }),
        );

        const result = await client
          .searchGitLabReposBuilder()
          .withAlmSetting('gitlab')
          .withProjectName('project')
          .withMinAccessLevel(30)
          .pageSize(50)
          .execute();

        expect(result).toEqual(builderResponse);
      });
    });
  });
});
