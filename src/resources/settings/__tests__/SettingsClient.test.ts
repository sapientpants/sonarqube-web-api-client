import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { assertAuthorizationHeader } from '../../../test-utils/assertions';
import { SettingsClient } from '../SettingsClient';
import { AuthenticationError, AuthorizationError, NetworkError } from '../../../errors';
import type { ListDefinitionsResponse, ValuesResponse } from '../types';

describe('SettingsClient', () => {
  let client: SettingsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new SettingsClient(baseUrl, token);
  });

  describe('listDefinitions', () => {
    it('should list all setting definitions', async () => {
      const mockResponse: ListDefinitionsResponse = {
        definitions: [
          {
            key: 'sonar.links.scm',
            name: 'SCM',
            description: 'Link to SCM repository',
            category: 'General',
            type: 'STRING',
          },
          {
            key: 'sonar.exclusions',
            name: 'Global Source File Exclusions',
            description: 'Patterns used to exclude files from analysis',
            category: 'Analysis Scope',
            type: 'TEXT',
            multiValues: true,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/list_definitions`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.has('component')).toBe(false);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.listDefinitions();
      expect(result).toEqual(mockResponse);
    });

    it('should list setting definitions for a component', async () => {
      const mockResponse: ListDefinitionsResponse = {
        definitions: [
          {
            key: 'sonar.coverage.exclusions',
            name: 'Coverage Exclusions',
            category: 'Code Coverage',
            type: 'TEXT',
            multiValues: true,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/list_definitions`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my_project');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.listDefinitions({ component: 'my_project' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/settings/list_definitions`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Invalid token' }] }, { status: 401 });
        })
      );

      await expect(client.listDefinitions()).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/settings/list_definitions`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient privileges' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.listDefinitions({ component: 'my_project' })).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/settings/list_definitions`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.listDefinitions()).rejects.toThrow(NetworkError);
    });
  });

  describe('set', () => {
    it('should set a single value', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('key')).toBe('sonar.links.scm');
          expect(params.get('value')).toBe('git@github.com:SonarSource/sonarqube.git');
          expect(params.has('component')).toBe(false);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client
        .set()
        .key('sonar.links.scm')
        .value('git@github.com:SonarSource/sonarqube.git')
        .execute();
    });

    it('should set multiple values', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('key')).toBe('sonar.inclusions');
          expect(params.getAll('values')).toEqual(['src/**', 'lib/**']);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.set().key('sonar.inclusions').values(['src/**', 'lib/**']).execute();
    });

    it('should set field values', async () => {
      const fieldValues = [
        { ruleKey: 'java:S1135', resourceKey: '**/test/**' },
        { ruleKey: 'java:S2589', resourceKey: '**/generated/**' },
      ];

      server.use(
        http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('key')).toBe('sonar.issue.ignore.multicriteria');
          const receivedFieldValues = params
            .getAll('fieldValues')
            .map((v) => JSON.parse(v) as Record<string, string>);
          expect(receivedFieldValues).toEqual(fieldValues);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.set().key('sonar.issue.ignore.multicriteria').fieldValues(fieldValues).execute();
    });

    it('should set component-specific setting', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/set`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('key')).toBe('sonar.coverage.exclusions');
          expect(params.get('value')).toBe('**/test/**,**/vendor/**');
          expect(params.get('component')).toBe('my_project');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client
        .set()
        .key('sonar.coverage.exclusions')
        .value('**/test/**,**/vendor/**')
        .component('my_project')
        .execute();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/set`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Administer permission required' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.set().key('test.key').value('test').execute()).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe('reset', () => {
    it('should reset single setting', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('keys')).toBe('sonar.links.scm');
          expect(params.has('component')).toBe(false);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.reset().keys(['sonar.links.scm']).execute();
    });

    it('should reset multiple settings', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('keys')).toBe('sonar.links.scm,sonar.debt.hoursInDay');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.reset().keys(['sonar.links.scm', 'sonar.debt.hoursInDay']).execute();
    });

    it('should reset component-specific settings', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('keys')).toBe('sonar.coverage.exclusions');
          expect(params.get('component')).toBe('my_project');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.reset().keys(['sonar.coverage.exclusions']).component('my_project').execute();
    });

    it('should reset settings on a specific branch', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/reset`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('keys')).toBe('sonar.coverage.exclusions');
          expect(params.get('component')).toBe('my_project');
          expect(params.get('branch')).toBe('feature/my_branch');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client
        .reset()
        .keys(['sonar.coverage.exclusions'])
        .component('my_project')
        .branch('feature/my_branch')
        .execute();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/settings/reset`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Administer permission required' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.reset().keys(['test.key']).execute()).rejects.toThrow(AuthorizationError);
    });
  });

  describe('values', () => {
    it('should get all setting values', async () => {
      const mockResponse: ValuesResponse = {
        settings: [
          {
            key: 'sonar.links.scm',
            value: 'git@github.com:SonarSource/sonarqube.git',
          },
          {
            key: 'sonar.exclusions',
            values: ['**/test/**', '**/vendor/**'],
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.entries().next().done).toBe(true); // No params
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.values().execute();
      expect(result).toEqual(mockResponse);
    });

    it('should get specific setting values', async () => {
      const mockResponse: ValuesResponse = {
        settings: [
          {
            key: 'sonar.test.inclusions',
            value: '**/test/**',
          },
          {
            key: 'sonar.exclusions',
            values: ['**/vendor/**'],
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('keys')).toBe('sonar.test.inclusions,sonar.exclusions');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client
        .values()
        .keys(['sonar.test.inclusions', 'sonar.exclusions'])
        .execute();
      expect(result).toEqual(mockResponse);
    });

    it('should get component-specific settings', async () => {
      const mockResponse: ValuesResponse = {
        settings: [
          {
            key: 'sonar.coverage.exclusions',
            value: '**/test/**',
            inherited: false,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my_project');
          expect(url.searchParams.has('organization')).toBe(false);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.values().component('my_project').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should get organization-specific settings', async () => {
      const mockResponse: ValuesResponse = {
        settings: [
          {
            key: 'sonar.links.homepage',
            value: 'https://example.com',
            inherited: true,
            parentValue: 'https://parent.example.com',
            parentOrigin: 'INSTANCE',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/settings/values`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('organization')).toBe('my-org');
          expect(url.searchParams.has('component')).toBe(false);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.values().organization('my-org').execute();
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/settings/values`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.values().execute()).rejects.toThrow(NetworkError);
    });
  });
});
