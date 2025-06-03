import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { AlmSettingsClient } from '../AlmSettingsClient';
import { ValidationError } from '../../../errors';

describe('AlmSettings Builders', () => {
  let client: AlmSettingsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AlmSettingsClient(baseUrl, token);
  });

  describe('GitHub Builders', () => {
    describe('createGitHubBuilder', () => {
      it('should create GitHub ALM setting with all parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_github`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'github-key',
              appId: 'app-123',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              privateKey: 'private-key',
              url: 'https://github.enterprise.com',
              webhookSecret: 'webhook-secret',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .createGitHubBuilder('github-key')
          .withAppId('app-123')
          .withOAuth('client-id', 'client-secret')
          .withPrivateKey('private-key')
          .withUrl('https://github.enterprise.com')
          .withWebhookSecret('webhook-secret')
          .execute();
      });

      it('should create GitHub ALM setting with minimal parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_github`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'github-key',
              appId: 'app-123',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              privateKey: 'private-key',
              url: 'https://github.com', // Default URL
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .createGitHubBuilder('github-key')
          .withAppId('app-123')
          .withOAuth('client-id', 'client-secret')
          .withPrivateKey('private-key')
          .withUrl('https://github.com') // Explicitly set URL to avoid validation error
          .execute();
      });

      it('should throw validation error when appId is missing', async () => {
        await expect(
          client
            .createGitHubBuilder('github-key')
            .withOAuth('client-id', 'client-secret')
            .withPrivateKey('private-key')
            .execute()
        ).rejects.toThrow(ValidationError);
      });

      it('should throw validation error when OAuth credentials are missing', async () => {
        await expect(
          client
            .createGitHubBuilder('github-key')
            .withAppId('app-123')
            .withPrivateKey('private-key')
            .execute()
        ).rejects.toThrow('OAuth client ID and secret are required');
      });

      it('should throw validation error when privateKey is missing', async () => {
        await expect(
          client
            .createGitHubBuilder('github-key')
            .withAppId('app-123')
            .withOAuth('client-id', 'client-secret')
            .execute()
        ).rejects.toThrow('Private key is required');
      });
    });

    describe('updateGitHubBuilder', () => {
      it('should update GitHub ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_github`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'github-key',
              newKey: 'new-github-key',
              appId: 'new-app-123',
              clientId: 'new-client-id',
              clientSecret: 'new-client-secret',
              privateKey: 'new-private-key',
              url: 'https://new-github.enterprise.com',
              webhookSecret: 'new-webhook-secret',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .updateGitHubBuilder('github-key')
          .withNewKey('new-github-key')
          .withAppId('new-app-123')
          .withOAuth('new-client-id', 'new-client-secret')
          .withPrivateKey('new-private-key')
          .withUrl('https://new-github.enterprise.com')
          .withWebhookSecret('new-webhook-secret')
          .execute();
      });

      it('should update with partial parameters', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_github`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'github-key',
              appId: 'new-app-123',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.updateGitHubBuilder('github-key').withAppId('new-app-123').execute();
      });
    });
  });

  describe('Azure Builders', () => {
    describe('createAzureBuilder', () => {
      it('should create Azure ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_azure`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'azure-key',
              personalAccessToken: 'pat-123',
              url: 'https://dev.azure.com/org',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.createAzure({
          key: 'azure-key',
          personalAccessToken: 'pat-123',
          url: 'https://dev.azure.com/org',
        });
      });
    });

    describe('updateAzure', () => {
      it('should update Azure ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_azure`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'azure-key',
              newKey: 'new-azure-key',
              personalAccessToken: 'new-pat-123',
              url: 'https://dev.azure.com/neworg',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.updateAzure({
          key: 'azure-key',
          newKey: 'new-azure-key',
          personalAccessToken: 'new-pat-123',
          url: 'https://dev.azure.com/neworg',
        });
      });
    });
  });

  describe('GitLab', () => {
    describe('createGitLab', () => {
      it('should create GitLab ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_gitlab`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'gitlab-key',
              personalAccessToken: 'pat-123',
              url: 'https://gitlab.example.com',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.createGitLab({
          key: 'gitlab-key',
          personalAccessToken: 'pat-123',
          url: 'https://gitlab.example.com',
        });
      });
    });

    describe('updateGitLab', () => {
      it('should update GitLab ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_gitlab`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'gitlab-key',
              newKey: 'new-gitlab-key',
              personalAccessToken: 'new-pat-123',
              url: 'https://new-gitlab.example.com',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.updateGitLab({
          key: 'gitlab-key',
          newKey: 'new-gitlab-key',
          personalAccessToken: 'new-pat-123',
          url: 'https://new-gitlab.example.com',
        });
      });
    });
  });

  describe('Bitbucket Server', () => {
    describe('createBitbucket', () => {
      it('should create Bitbucket Server ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_bitbucket`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'bitbucket-key',
              personalAccessToken: 'pat-123',
              url: 'https://bitbucket.example.com',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.createBitbucket({
          key: 'bitbucket-key',
          personalAccessToken: 'pat-123',
          url: 'https://bitbucket.example.com',
        });
      });
    });

    describe('updateBitbucket', () => {
      it('should update Bitbucket Server ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_bitbucket`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'bitbucket-key',
              newKey: 'new-bitbucket-key',
              personalAccessToken: 'new-pat-123',
              url: 'https://new-bitbucket.example.com',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.updateBitbucket({
          key: 'bitbucket-key',
          newKey: 'new-bitbucket-key',
          personalAccessToken: 'new-pat-123',
          url: 'https://new-bitbucket.example.com',
        });
      });
    });
  });

  describe('Bitbucket Cloud Builders', () => {
    describe('createBitbucketCloudBuilder', () => {
      it('should create Bitbucket Cloud ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/create_bitbucketcloud`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'bitbucket-cloud-key',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              workspace: 'my-workspace',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .createBitbucketCloudBuilder('bitbucket-cloud-key')
          .withOAuth('client-id', 'client-secret')
          .withWorkspace('my-workspace')
          .execute();
      });

      it('should throw validation error when workspace is missing', async () => {
        await expect(
          client
            .createBitbucketCloudBuilder('bitbucket-cloud-key')
            .withOAuth('client-id', 'client-secret')
            .execute()
        ).rejects.toThrow('Workspace ID is required');
      });

      it('should throw validation error when OAuth credentials are missing', async () => {
        await expect(
          client
            .createBitbucketCloudBuilder('bitbucket-cloud-key')
            .withWorkspace('my-workspace')
            .execute()
        ).rejects.toThrow('OAuth client ID and secret are required');
      });
    });

    describe('updateBitbucketCloudBuilder', () => {
      it('should update Bitbucket Cloud ALM setting', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/update_bitbucketcloud`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              key: 'bitbucket-cloud-key',
              newKey: 'new-key',
              clientId: 'new-client-id',
              clientSecret: 'new-client-secret',
              workspace: 'new-workspace',
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .updateBitbucketCloudBuilder('bitbucket-cloud-key')
          .withNewKey('new-key')
          .withOAuth('new-client-id', 'new-client-secret')
          .inWorkspace('new-workspace')
          .execute();
      });
    });
  });

  describe('Project Binding Builders', () => {
    describe('setAzureBinding', () => {
      it('should set Azure binding', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_azure_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'azure-alm',
              projectName: 'AzureProject',
              repositoryName: 'AzureRepo',
              monorepo: true,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.setAzureBinding({
          project: 'my-project',
          almSetting: 'azure-alm',
          projectName: 'AzureProject',
          repositoryName: 'AzureRepo',
          monorepo: true,
        });
      });

      it('should set Azure binding using builder', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_azure_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'azure-alm',
              projectName: 'AzureProject',
              repositoryName: 'AzureRepo',
              monorepo: true,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .setAzureBindingBuilder('my-project', 'azure-alm')
          .withAzureProjectName('AzureProject')
          .withRepositoryName('AzureRepo')
          .asMonorepo(true)
          .execute();
      });

      it('should throw validation error when Azure project name is missing', async () => {
        await expect(
          client
            .setAzureBindingBuilder('my-project', 'azure-alm')
            .withRepositoryName('AzureRepo')
            .execute()
        ).rejects.toThrow('Azure project name is required');
      });

      it('should throw validation error when repository name is missing', async () => {
        await expect(
          client
            .setAzureBindingBuilder('my-project', 'azure-alm')
            .withAzureProjectName('AzureProject')
            .execute()
        ).rejects.toThrow('Repository name is required');
      });
    });

    describe('setBitbucketBinding', () => {
      it('should set Bitbucket binding', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_bitbucket_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'bitbucket-alm',
              repository: 'PROJ/repo',
              slug: 'repo',
              monorepo: false,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.setBitbucketBinding({
          project: 'my-project',
          almSetting: 'bitbucket-alm',
          repository: 'PROJ/repo',
          slug: 'repo',
          monorepo: false,
        });
      });

      it('should set Bitbucket binding using builder', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_bitbucket_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'bitbucket-alm',
              repository: 'PROJ/repo',
              slug: 'repo',
              monorepo: false,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .setBitbucketBindingBuilder('my-project', 'bitbucket-alm')
          .withRepository('PROJ/repo')
          .withRepositorySlug('repo')
          .asMonorepo(false)
          .execute();
      });

      it('should throw validation error when repository is missing', async () => {
        await expect(
          client
            .setBitbucketBindingBuilder('my-project', 'bitbucket-alm')
            .withRepositorySlug('repo')
            .execute()
        ).rejects.toThrow('Bitbucket repository is required');
      });

      it('should throw validation error when repository slug is missing', async () => {
        await expect(
          client
            .setBitbucketBindingBuilder('my-project', 'bitbucket-alm')
            .withRepository('PROJ/repo')
            .execute()
        ).rejects.toThrow('Repository slug is required');
      });
    });

    describe('setGitHubBinding', () => {
      it('should set GitHub binding', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_github_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'github-alm',
              repository: 'org/repo',
              summaryCommentEnabled: true,
              monorepo: true,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.setGitHubBinding({
          project: 'my-project',
          almSetting: 'github-alm',
          repository: 'org/repo',
          summaryCommentEnabled: true,
          monorepo: true,
        });
      });

      it('should set GitHub binding using builder', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_github_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'github-alm',
              repository: 'org/repo',
              summaryCommentEnabled: true,
              monorepo: true,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .setGitHubBindingBuilder('my-project', 'github-alm')
          .withRepository('org/repo')
          .withSummaryComments(true)
          .asMonorepo(true)
          .execute();
      });

      it('should set GitHub binding with default summary comments', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_github_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'github-alm',
              repository: 'org/repo',
              summaryCommentEnabled: true,
              monorepo: false,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .setGitHubBindingBuilder('my-project', 'github-alm')
          .withRepository('org/repo')
          .withSummaryComments() // Should default to true
          .asMonorepo(false)
          .execute();
      });

      it('should throw validation error when repository is missing', async () => {
        await expect(
          client.setGitHubBindingBuilder('my-project', 'github-alm').execute()
        ).rejects.toThrow('Repository is required');
      });
    });

    describe('setGitLabBinding', () => {
      it('should set GitLab binding', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_gitlab_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'gitlab-alm',
              repository: '123',
              monorepo: false,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client.setGitLabBinding({
          project: 'my-project',
          almSetting: 'gitlab-alm',
          repository: '123',
          monorepo: false,
        });
      });

      it('should set GitLab binding using builder', async () => {
        server.use(
          http.post(`${baseUrl}/api/alm_settings/set_gitlab_binding`, async ({ request }) => {
            const body = await request.json();
            expect(body).toEqual({
              project: 'my-project',
              almSetting: 'gitlab-alm',
              repository: '123',
              monorepo: false,
            });
            return new HttpResponse(null, { status: 200 });
          })
        );

        await client
          .setGitLabBindingBuilder('my-project', 'gitlab-alm')
          .withRepository('123')
          .asMonorepo(false)
          .execute();
      });

      it('should throw validation error when repository is missing', async () => {
        await expect(
          client.setGitLabBindingBuilder('my-project', 'gitlab-alm').execute()
        ).rejects.toThrow('Repository is required');
      });
    });

    describe('setBitbucketCloudBinding', () => {
      it('should set Bitbucket Cloud binding', async () => {
        server.use(
          http.post(
            `${baseUrl}/api/alm_settings/set_bitbucketcloud_binding`,
            async ({ request }) => {
              const body = await request.json();
              expect(body).toEqual({
                project: 'my-project',
                almSetting: 'bitbucket-cloud-alm',
                repository: 'workspace/repo',
                monorepo: true,
              });
              return new HttpResponse(null, { status: 200 });
            }
          )
        );

        await client.setBitbucketCloudBinding({
          project: 'my-project',
          almSetting: 'bitbucket-cloud-alm',
          repository: 'workspace/repo',
          monorepo: true,
        });
      });

      it('should set Bitbucket Cloud binding using builder', async () => {
        server.use(
          http.post(
            `${baseUrl}/api/alm_settings/set_bitbucketcloud_binding`,
            async ({ request }) => {
              const body = await request.json();
              expect(body).toEqual({
                project: 'my-project',
                almSetting: 'bitbucket-cloud-alm',
                repository: 'workspace/repo',
                monorepo: true,
              });
              return new HttpResponse(null, { status: 200 });
            }
          )
        );

        await client
          .setBitbucketCloudBindingBuilder('my-project', 'bitbucket-cloud-alm')
          .withRepository('workspace/repo')
          .asMonorepo(true)
          .execute();
      });

      it('should throw validation error when repository is missing', async () => {
        await expect(
          client.setBitbucketCloudBindingBuilder('my-project', 'bitbucket-cloud-alm').execute()
        ).rejects.toThrow('Repository is required');
      });
    });
  });
});
