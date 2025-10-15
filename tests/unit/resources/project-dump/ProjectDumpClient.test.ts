// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import { ProjectDumpClient } from '../../../../src/resources/project-dump/ProjectDumpClient';
import { AuthenticationError, AuthorizationError, NetworkError } from '../../../../src/errors';

describe('ProjectDumpClient', () => {
  let client: ProjectDumpClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ProjectDumpClient(baseUrl, token);
  });

  describe('export', () => {
    const projectKey = 'my-project-key';

    it('should export project dump successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe(`key=${projectKey}`);

          const contentType = request.headers.get('content-type');
          expect(contentType).toBe('application/x-www-form-urlencoded');

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.export({
          key: projectKey,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle project key with special characters', async () => {
      const specialKey = 'project-key-with-special-chars-!@#$%^&*()';

      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('key', specialKey);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.export({
          key: specialKey,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow(AuthorizationError);
    });

    it('should handle project not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return new HttpResponse('Project not found', { status: 404 });
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow();
    });

    it('should handle enterprise edition feature not available', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return new HttpResponse('Feature not available in Community Edition', { status: 400 });
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        }),
      );

      await expect(client.export({ key: projectKey })).rejects.toThrow();
    });
  });

  describe('import', () => {
    const projectKey = 'target-project-key';

    it('should import project dump successfully', async () => {
      const mockFile = new File(['dummy content'], 'project-dump.zip', {
        type: 'application/zip',
      });

      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, async ({ request }) => {
          const formData = await request.formData();

          expect(formData.get('key')).toBe(projectKey);
          expect(formData.get('file')).toBeInstanceOf(File);

          const file = formData.get('file') as File;
          expect(file.name).toBe('project-dump.zip');
          expect(file.type).toBe('application/zip');

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.import({
          key: projectKey,
          file: mockFile,
        }),
      ).resolves.toBeUndefined();
    });

    it('should import project dump without file', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, async ({ request }) => {
          const formData = await request.formData();

          expect(formData.get('key')).toBe(projectKey);
          expect(formData.get('file')).toBeNull();

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.import({
          key: projectKey,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle import with Blob instead of File', async () => {
      const mockBlob = new Blob(['dummy content'], { type: 'application/zip' });

      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, async ({ request }) => {
          const formData = await request.formData();

          expect(formData.get('key')).toBe(projectKey);
          expect(formData.get('file')).toBeInstanceOf(Blob);

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.import({
          key: projectKey,
          file: mockBlob,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle project key with special characters', async () => {
      const specialKey = 'target-project-with-special-chars-!@#$%^&*()';
      const mockFile = new File(['dummy content'], 'project-dump.zip');

      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, async ({ request }) => {
          const formData = await request.formData();
          expect(formData.get('key')).toBe(specialKey);

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.import({
          key: specialKey,
          file: mockFile,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow(AuthorizationError);
    });

    it('should handle invalid dump file errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return new HttpResponse('Invalid dump file format', { status: 400 });
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow();
    });

    it('should handle project already exists errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return new HttpResponse('Project already exists', { status: 409 });
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/import`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        }),
      );

      await expect(client.import({ key: projectKey })).rejects.toThrow();
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new ProjectDumpClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(ProjectDumpClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new ProjectDumpClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(ProjectDumpClient);
    });

    it('should create client with options object', () => {
      const clientWithOptions = new ProjectDumpClient(baseUrl, 'test-token', {
        organization: 'my-org',
        timeout: 10000,
      });
      expect(clientWithOptions).toBeInstanceOf(ProjectDumpClient);
    });
  });

  describe('authorization header', () => {
    it('should include authorization header when token is provided', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBe('Bearer test-token');
          return new HttpResponse('', { status: 204 });
        }),
      );

      await client.export({ key: 'test-project' });
    });

    it('should work without authorization header when token is empty', async () => {
      const clientWithoutToken = new ProjectDumpClient(baseUrl, '');

      server.use(
        http.post(`${baseUrl}/api/project_dump/export`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBeNull();
          return new HttpResponse('', { status: 204 });
        }),
      );

      await clientWithoutToken.export({ key: 'test-project' });
    });
  });
});
