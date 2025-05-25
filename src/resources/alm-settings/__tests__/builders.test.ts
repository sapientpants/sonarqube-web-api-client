import { AlmSettingsClient } from '../AlmSettingsClient';

describe('AlmSettings Builders', () => {
  let client: AlmSettingsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AlmSettingsClient(baseUrl, token);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GitHub Builders', () => {
    describe('createGitHubBuilder', () => {
      it('should create GitHub ALM setting with all parameters', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .createGitHubBuilder('github-key')
          .withAppId('app-123')
          .withOAuth('client-id', 'client-secret')
          .withPrivateKey('private-key')
          .withUrl('https://github.enterprise.com')
          .withWebhookSecret('webhook-secret')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/create_github',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              key: 'github-key',
              appId: 'app-123',
              clientId: 'client-id',
              clientSecret: 'client-secret',
              privateKey: 'private-key',
              url: 'https://github.enterprise.com',
              webhookSecret: 'webhook-secret',
            }),
          }
        );
      });

      it('should throw error when required fields are missing', async () => {
        const builder = client.createGitHubBuilder('github-key');

        await expect(builder.execute()).rejects.toThrow('GitHub App ID is required');

        builder.withAppId('app-123');
        await expect(builder.execute()).rejects.toThrow('OAuth client ID and secret are required');

        builder.withOAuth('client-id', 'client-secret');
        await expect(builder.execute()).rejects.toThrow('Private key is required');

        builder.withPrivateKey('private-key');
        await expect(builder.execute()).rejects.toThrow('URL is required');
      });
    });

    describe('updateGitHubBuilder', () => {
      it('should update GitHub ALM setting with partial parameters', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .updateGitHubBuilder('github-key')
          .withNewKey('new-github-key')
          .withAppId('new-app-123')
          .withWebhookSecret('new-webhook-secret')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/update_github',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              key: 'github-key',
              newKey: 'new-github-key',
              appId: 'new-app-123',
              webhookSecret: 'new-webhook-secret',
            }),
          }
        );
      });
    });
  });

  describe('Bitbucket Cloud Builders', () => {
    describe('createBitbucketCloudBuilder', () => {
      it('should create Bitbucket Cloud ALM setting', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .createBitbucketCloudBuilder('bitbucket-cloud-key')
          .withOAuth('consumer-key', 'consumer-secret')
          .withWorkspace('my-workspace')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/create_bitbucketcloud',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              key: 'bitbucket-cloud-key',
              clientId: 'consumer-key',
              clientSecret: 'consumer-secret',
              workspace: 'my-workspace',
            }),
          }
        );
      });

      it('should throw error when required fields are missing', async () => {
        const builder = client.createBitbucketCloudBuilder('bitbucket-cloud-key');

        await expect(builder.execute()).rejects.toThrow(
          'OAuth consumer key and secret are required'
        );

        builder.withOAuth('consumer-key', 'consumer-secret');
        await expect(builder.execute()).rejects.toThrow('Workspace is required');
      });
    });

    describe('updateBitbucketCloudBuilder', () => {
      it('should update Bitbucket Cloud ALM setting', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .updateBitbucketCloudBuilder('bitbucket-cloud-key')
          .withWorkspace('new-workspace')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/update_bitbucketcloud',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              key: 'bitbucket-cloud-key',
              workspace: 'new-workspace',
            }),
          }
        );
      });
    });
  });

  describe('Binding Builders', () => {
    describe('setAzureBindingBuilder', () => {
      it('should set Azure binding', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .setAzureBindingBuilder('my-project', 'azure-setting-1')
          .withProjectName('AzureProject')
          .withRepository('my-repo')
          .asMonorepo()
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/set_azure_binding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              project: 'my-project',
              almSetting: 'azure-setting-1',
              projectName: 'AzureProject',
              repositoryName: 'my-repo',
              monorepo: true,
            }),
          }
        );
      });

      it('should throw error when required fields are missing', async () => {
        const builder = client.setAzureBindingBuilder('my-project', 'azure-setting-1');

        await expect(builder.execute()).rejects.toThrow('Azure project name is required');

        builder.withProjectName('AzureProject');
        await expect(builder.execute()).rejects.toThrow('Repository name is required');
      });
    });

    describe('setBitbucketBindingBuilder', () => {
      it('should set Bitbucket binding', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .setBitbucketBindingBuilder('my-project', 'bitbucket-setting-1')
          .withRepository('my-repo')
          .withSlug('repo-slug')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/set_bitbucket_binding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              project: 'my-project',
              almSetting: 'bitbucket-setting-1',
              repository: 'my-repo',
              slug: 'repo-slug',
            }),
          }
        );
      });
    });

    describe('setBitbucketCloudBindingBuilder', () => {
      it('should set Bitbucket Cloud binding', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .setBitbucketCloudBindingBuilder('my-project', 'bitbucket-cloud-setting-1')
          .withRepository('my-repo')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/set_bitbucketcloud_binding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              project: 'my-project',
              almSetting: 'bitbucket-cloud-setting-1',
              repository: 'my-repo',
            }),
          }
        );
      });
    });

    describe('setGitHubBindingBuilder', () => {
      it('should set GitHub binding with summary comments', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .setGitHubBindingBuilder('my-project', 'github-setting-1')
          .withRepository('org/repo')
          .withSummaryComments(true)
          .asMonorepo()
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/set_github_binding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              project: 'my-project',
              almSetting: 'github-setting-1',
              repository: 'org/repo',
              summaryCommentEnabled: true,
              monorepo: true,
            }),
          }
        );
      });
    });

    describe('setGitLabBindingBuilder', () => {
      it('should set GitLab binding', async () => {
        const mockResponse = { ok: true, text: jest.fn().mockResolvedValue('') };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await client
          .setGitLabBindingBuilder('my-project', 'gitlab-setting-1')
          .withRepository('12345')
          .execute();

        expect(global.fetch).toHaveBeenCalledWith(
          'https://sonarqube.example.com/api/alm_settings/set_gitlab_binding',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              project: 'my-project',
              almSetting: 'gitlab-setting-1',
              repository: '12345',
            }),
          }
        );
      });
    });
  });
});
