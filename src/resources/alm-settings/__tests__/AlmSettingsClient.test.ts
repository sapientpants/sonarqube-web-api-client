import { http, HttpResponse } from 'msw';
import { AlmSettingsClient } from '../AlmSettingsClient';
import { AuthenticationError } from '../../../errors';
import { server } from '../../../test-utils/msw/server';

describe('AlmSettingsClient', () => {
  let client: AlmSettingsClient;

  beforeEach(() => {
    client = new AlmSettingsClient('https://sonarqube.example.com', 'test-token');
  });

  describe('countBinding', () => {
    it('should count bindings for an ALM setting', async () => {
      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/count_binding', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('almSetting')).toBe('my-github');
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');
          return HttpResponse.json({ projects: 5 });
        })
      );

      const result = await client.countBinding({ almSetting: 'my-github' });
      expect(result).toEqual({ projects: 5 });
    });
  });

  describe('create operations', () => {
    it('should create Azure ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/create_azure',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-azure',
              personalAccessToken: 'token123',
              url: 'https://dev.azure.com/myorg',
            });
            expect(request.headers.get('Authorization')).toBe('Bearer test-token');
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.createAzure({
        key: 'my-azure',
        personalAccessToken: 'token123',
        url: 'https://dev.azure.com/myorg',
      });
    });

    it('should create GitHub ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/create_github',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-github',
              appId: 'app123',
              clientId: 'client123',
              clientSecret: 'secret123',
              privateKey: 'private-key',
              url: 'https://github.com',
              webhookSecret: 'webhook-secret',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.createGitHub({
        key: 'my-github',
        appId: 'app123',
        clientId: 'client123',
        clientSecret: 'secret123',
        privateKey: 'private-key',
        url: 'https://github.com',
        webhookSecret: 'webhook-secret',
      });
    });

    it('should create GitLab ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/create_gitlab',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-gitlab',
              personalAccessToken: 'token123',
              url: 'https://gitlab.com',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.createGitLab({
        key: 'my-gitlab',
        personalAccessToken: 'token123',
        url: 'https://gitlab.com',
      });
    });

    it('should create Bitbucket ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/create_bitbucket',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-bitbucket',
              personalAccessToken: 'token123',
              url: 'https://bitbucket.example.com',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.createBitbucket({
        key: 'my-bitbucket',
        personalAccessToken: 'token123',
        url: 'https://bitbucket.example.com',
      });
    });

    it('should create Bitbucket Cloud ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/create_bitbucketcloud',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-bitbucket-cloud',
              clientId: 'client123',
              clientSecret: 'secret123',
              workspace: 'my-workspace',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.createBitbucketCloud({
        key: 'my-bitbucket-cloud',
        clientId: 'client123',
        clientSecret: 'secret123',
        workspace: 'my-workspace',
      });
    });
  });

  describe('update operations', () => {
    it('should update Azure ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/update_azure',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-azure',
              newKey: 'my-azure-renamed',
              url: 'https://dev.azure.com/neworg',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.updateAzure({
        key: 'my-azure',
        newKey: 'my-azure-renamed',
        url: 'https://dev.azure.com/neworg',
      });
    });

    it('should update GitHub ALM setting', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/update_github',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'my-github',
              appId: 'app456',
              clientId: 'client456',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.updateGitHub({
        key: 'my-github',
        appId: 'app456',
        clientId: 'client456',
      });
    });
  });

  describe('delete', () => {
    it('should delete ALM setting', async () => {
      server.use(
        http.post('https://sonarqube.example.com/api/alm_settings/delete', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ key: 'my-alm' });
          return new HttpResponse(null, { status: 200 });
        })
      );

      await client.delete({ key: 'my-alm' });
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

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/list', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.list();
      expect(result).toEqual(mockResponse);
    });

    it('should list ALM settings for a project', async () => {
      const mockResponse = {
        almSettings: [{ key: 'github1', alm: 'github', url: 'https://github.com' }],
      };

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/list', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.list({ project: 'my-project' });
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

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/list_definitions', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.listDefinitions();
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

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/get_binding', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.getBinding({ project: 'my-project' });
      expect(result).toEqual(mockResponse);
    });

    it('should delete project binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/delete_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({ project: 'my-project' });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.deleteBinding({ project: 'my-project' });
    });

    it('should set Azure binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/set_azure_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              almSetting: 'my-azure',
              project: 'my-project',
              projectName: 'MyProject',
              repositoryName: 'MyRepo',
              monorepo: true,
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.setAzureBinding({
        almSetting: 'my-azure',
        project: 'my-project',
        projectName: 'MyProject',
        repositoryName: 'MyRepo',
        monorepo: true,
      });
    });

    it('should set GitHub binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/set_github_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              almSetting: 'my-github',
              project: 'my-project',
              repository: 'org/repo',
              summaryCommentEnabled: true,
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.setGitHubBinding({
        almSetting: 'my-github',
        project: 'my-project',
        repository: 'org/repo',
        summaryCommentEnabled: true,
      });
    });

    it('should set GitLab binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/set_gitlab_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              almSetting: 'my-gitlab',
              project: 'my-project',
              repository: '123',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.setGitLabBinding({
        almSetting: 'my-gitlab',
        project: 'my-project',
        repository: '123',
      });
    });

    it('should set Bitbucket binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/set_bitbucket_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              almSetting: 'my-bitbucket',
              project: 'my-project',
              repository: 'repo',
              slug: 'proj',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.setBitbucketBinding({
        almSetting: 'my-bitbucket',
        project: 'my-project',
        repository: 'repo',
        slug: 'proj',
      });
    });

    it('should set Bitbucket Cloud binding', async () => {
      server.use(
        http.post(
          'https://sonarqube.example.com/api/alm_settings/set_bitbucketcloud_binding',
          async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              almSetting: 'my-bitbucket-cloud',
              project: 'my-project',
              repository: 'repo-slug',
            });
            return new HttpResponse(null, { status: 200 });
          }
        )
      );

      await client.setBitbucketCloudBinding({
        almSetting: 'my-bitbucket-cloud',
        project: 'my-project',
        repository: 'repo-slug',
      });
    });
  });

  describe('validate', () => {
    it('should validate ALM setting', async () => {
      const mockResponse = {
        validationStatus: 'success',
        errors: [],
      };

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/validate', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe('my-alm');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.validate({ key: 'my-alm' });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation errors', async () => {
      const mockResponse = {
        validationStatus: 'failure',
        errors: [{ message: 'Authentication failed', details: 'Invalid token' }],
      };

      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/validate', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.validate({ key: 'my-alm' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error on non-ok response', async () => {
      server.use(
        http.get('https://sonarqube.example.com/api/alm_settings/list', () => {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized',
          });
        })
      );

      await expect(client.list()).rejects.toThrow(AuthenticationError);
    });
  });
});
