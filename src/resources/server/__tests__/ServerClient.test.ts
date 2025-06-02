import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { ServerClient } from '../ServerClient';
import { NetworkError } from '../../../errors';

describe('ServerClient', () => {
  let client: ServerClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ServerClient(baseUrl, token);
  });

  describe('version', () => {
    it('should get server version', async () => {
      const mockVersion = '10.8.0';

      server.use(
        http.get(`${baseUrl}/api/server/version`, () => {
          return new HttpResponse(mockVersion, {
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.version();

      expect(result).toBe(mockVersion);
    });

    it('should work without authentication token', async () => {
      const clientWithoutToken = new ServerClient(baseUrl, '');
      const mockVersion = '10.8.0';

      server.use(
        http.get(`${baseUrl}/api/server/version`, () => {
          return new HttpResponse(mockVersion, {
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await clientWithoutToken.version();

      expect(result).toBe(mockVersion);
    });

    it('should handle different version formats', async () => {
      const mockVersion = '10.8.0-build-123';

      server.use(
        http.get(`${baseUrl}/api/server/version`, () => {
          return new HttpResponse(mockVersion, {
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.version();

      expect(result).toBe(mockVersion);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/server/version`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.version()).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/server/version`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        })
      );

      await expect(client.version()).rejects.toThrow();
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new ServerClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(ServerClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new ServerClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(ServerClient);
    });
  });
});
