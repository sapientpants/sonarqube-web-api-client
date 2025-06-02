import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { PluginsClient } from '../PluginsClient';
import type {
  GetAvailablePluginsResponse,
  GetInstalledPluginsResponse,
  GetPendingPluginsResponse,
  GetPluginUpdatesResponse,
} from '../types';
import { AuthorizationError, ApiError, NetworkError } from '../../../errors';

describe('PluginsClient', () => {
  let client: PluginsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new PluginsClient(baseUrl, token);
  });

  describe('getAvailable', () => {
    it('should get available plugins without parameters', async () => {
      const mockResponse: GetAvailablePluginsResponse = {
        plugins: [
          {
            key: 'java',
            name: 'SonarJava',
            description: 'SonarQube rule engine for Java',
            version: '7.16.0',
            license: 'LGPL v3',
            organizationName: 'SonarSource',
            organizationUrl: 'https://www.sonarsource.com',
            homepageUrl: 'https://redirect.sonarsource.com/plugins/java.html',
            issueTrackerUrl: 'https://jira.sonarsource.com/browse/SONARJAVA',
            updateStatus: 'COMPATIBLE',
            category: 'Languages',
            release: {
              version: '7.16.0',
              date: '2023-05-15',
              description: 'Bug fixes and improvements',
              changelogUrl: 'https://github.com/SonarSource/sonar-java/releases',
            },
          },
          {
            key: 'typescript',
            name: 'SonarTS',
            description: 'SonarQube rule engine for TypeScript',
            version: '2.1.0',
            updateStatus: 'REQUIRES_SYSTEM_UPGRADE',
            category: 'Languages',
          },
        ],
        updateCenterRefresh: '2024-01-15T10:30:00Z',
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/available`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.toString()).toBe('');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.getAvailable();

      expect(result).toEqual(mockResponse);
      expect(result.plugins).toHaveLength(2);
      expect(result.plugins[0].name).toBe('SonarJava');
    });

    it('should get available plugins with search query', async () => {
      const mockResponse: GetAvailablePluginsResponse = {
        plugins: [
          {
            key: 'java',
            name: 'SonarJava',
            description: 'SonarQube rule engine for Java',
            version: '7.16.0',
            updateStatus: 'COMPATIBLE',
            category: 'Languages',
          },
        ],
        updateCenterRefresh: '2024-01-15T10:30:00Z',
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/available`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('java');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.getAvailable({ q: 'java' });

      expect(result.plugins).toHaveLength(1);
      expect(result.plugins[0].key).toBe('java');
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/plugins/available`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.getAvailable()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('cancelAll', () => {
    it('should cancel all pending operations', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/cancel_all`, () => {
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.cancelAll()).resolves.toBeUndefined();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/cancel_all`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.cancelAll()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('install', () => {
    it('should install a plugin', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/install`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('key=java');
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.install({ key: 'java' })).resolves.toBeUndefined();
    });

    it('should handle plugin risk consent errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/install`, () => {
          return new HttpResponse('Plugin risk consent not accepted', { status: 400 });
        })
      );

      await expect(client.install({ key: 'java' })).rejects.toThrow(ApiError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/install`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.install({ key: 'java' })).rejects.toThrow(AuthorizationError);
    });
  });

  describe('getInstalled', () => {
    it('should get installed plugins without parameters', async () => {
      const mockResponse: GetInstalledPluginsResponse = {
        plugins: [
          {
            key: 'java',
            name: 'SonarJava',
            description: 'SonarQube rule engine for Java',
            version: '7.15.0',
            license: 'LGPL v3',
            organizationName: 'SonarSource',
            filename: 'sonar-java-plugin-7.15.0.jar',
            hash: 'abc123def456',
            defaultPlugin: false,
            edition: 'community',
            sonarQubeMinVersion: '8.9',
          },
          {
            key: 'typescript',
            name: 'SonarTS',
            description: 'SonarQube rule engine for TypeScript',
            version: '2.0.0',
            defaultPlugin: false,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/installed`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.toString()).toBe('');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.getInstalled();

      expect(result.plugins).toHaveLength(2);
      expect(result.plugins[0].name).toBe('SonarJava');
    });

    it('should get installed plugins with additional fields', async () => {
      const mockResponse: GetInstalledPluginsResponse = {
        plugins: [],
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/installed`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('f')).toBe('category,license');
          return HttpResponse.json(mockResponse);
        })
      );

      await client.getInstalled({ f: ['category', 'license'] });
    });
  });

  describe('getPending', () => {
    it('should get pending plugin operations', async () => {
      const mockResponse: GetPendingPluginsResponse = {
        installing: [
          {
            key: 'python',
            name: 'SonarPython',
            description: 'SonarQube rule engine for Python',
            version: '4.2.0',
            operation: 'INSTALL',
          },
        ],
        updating: [
          {
            key: 'java',
            name: 'SonarJava',
            description: 'SonarQube rule engine for Java',
            version: '7.16.0',
            operation: 'UPDATE',
          },
        ],
        removing: [
          {
            key: 'deprecated-plugin',
            name: 'Deprecated Plugin',
            description: 'Old plugin being removed',
            version: '1.0.0',
            operation: 'UNINSTALL',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/pending`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.getPending();

      expect(result.installing).toHaveLength(1);
      expect(result.updating).toHaveLength(1);
      expect(result.removing).toHaveLength(1);
      expect(result.installing[0].operation).toBe('INSTALL');
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/plugins/pending`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.getPending()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('uninstall', () => {
    it('should uninstall a plugin', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/uninstall`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('key=deprecated-plugin');
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.uninstall({ key: 'deprecated-plugin' })).resolves.toBeUndefined();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/uninstall`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.uninstall({ key: 'java' })).rejects.toThrow(AuthorizationError);
    });
  });

  describe('update', () => {
    it('should update a plugin', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/update`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('key=java');
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.update({ key: 'java' })).resolves.toBeUndefined();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/plugins/update`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.update({ key: 'java' })).rejects.toThrow(AuthorizationError);
    });
  });

  describe('getUpdates', () => {
    it('should get available plugin updates', async () => {
      const mockResponse: GetPluginUpdatesResponse = {
        plugins: [
          {
            key: 'java',
            name: 'SonarJava',
            description: 'SonarQube rule engine for Java',
            version: '7.15.0',
            updates: [
              {
                version: '7.16.0',
                status: 'COMPATIBLE',
                release: {
                  version: '7.16.0',
                  date: '2023-05-15',
                  description: 'Bug fixes and improvements',
                  changelogUrl: 'https://github.com/SonarSource/sonar-java/releases',
                },
              },
              {
                version: '8.0.0',
                status: 'REQUIRES_UPGRADE',
              },
            ],
          },
        ],
        updateCenterRefresh: '2024-01-15T10:30:00Z',
      };

      server.use(
        http.get(`${baseUrl}/api/plugins/updates`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.getUpdates();

      expect(result.plugins).toHaveLength(1);
      expect(result.plugins[0].updates).toHaveLength(2);
      expect(result.plugins[0].updates[0].version).toBe('7.16.0');
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/plugins/updates`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        })
      );

      await expect(client.getUpdates()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new PluginsClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(PluginsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new PluginsClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(PluginsClient);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/plugins/available`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.getAvailable()).rejects.toThrow(NetworkError);
    });
  });
});
