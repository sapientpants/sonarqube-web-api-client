import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { EditionsClient } from '../EditionsClient';
import { AuthenticationError, NetworkError } from '../../../errors';

describe('EditionsClient', () => {
  let client: EditionsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new EditionsClient(baseUrl, token);
  });

  describe('status', () => {
    const mockStatusResponse = {
      currentEditionKey: 'enterprise',
      installationStatus: 'COMPLETED',
    };

    it('should get edition status successfully', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return HttpResponse.json(mockStatusResponse);
        })
      );

      const result = await client.status();
      expect(result).toEqual(mockStatusResponse);
      expect(result.currentEditionKey).toBe('enterprise');
      expect(result.installationStatus).toBe('COMPLETED');
    });

    it('should get status for community edition', async () => {
      const communityResponse = {
        currentEditionKey: 'community',
      };

      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return HttpResponse.json(communityResponse);
        })
      );

      const result = await client.status();
      expect(result).toEqual(communityResponse);
      expect(result.currentEditionKey).toBe('community');
      expect(result.installationStatus).toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        })
      );

      await expect(client.status()).rejects.toThrow(AuthenticationError);
    });

    it('should handle forbidden access', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return new HttpResponse('Forbidden', { status: 403 });
        })
      );

      await expect(client.status()).rejects.toThrow();
    });

    it('should handle not found errors for unsupported versions', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return new HttpResponse('Not Found', { status: 404 });
        })
      );

      await expect(client.status()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.status()).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/editions/status`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        })
      );

      await expect(client.status()).rejects.toThrow();
    });

    it('should handle different edition keys', async () => {
      const editions = ['community', 'developer', 'enterprise', 'datacenter'];

      for (const edition of editions) {
        const response = {
          currentEditionKey: edition,
          installationStatus: edition === 'community' ? undefined : 'COMPLETED',
        };

        server.use(
          http.get(`${baseUrl}/api/editions/status`, () => {
            return HttpResponse.json(response);
          })
        );

        const result = await client.status();
        expect(result.currentEditionKey).toBe(edition);
      }
    });
  });

  describe('activateGracePeriod', () => {
    it('should activate grace period successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.activateGracePeriod()).resolves.toBeUndefined();
    });

    it('should activate grace period with empty request object', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(client.activateGracePeriod({})).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        })
      );

      await expect(client.activateGracePeriod()).rejects.toThrow(AuthenticationError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.activateGracePeriod()).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        })
      );

      await expect(client.activateGracePeriod()).rejects.toThrow();
    });

    it('should handle forbidden access', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, () => {
          return new HttpResponse('Forbidden', { status: 403 });
        })
      );

      await expect(client.activateGracePeriod()).rejects.toThrow();
    });
  });

  describe('setLicense', () => {
    const mockLicenseKey = 'enterprise-license-key-123456789';

    it('should set license successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe(`license=${mockLicenseKey}`);

          const contentType = request.headers.get('content-type');
          expect(contentType).toBe('application/x-www-form-urlencoded');

          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(
        client.setLicense({
          license: mockLicenseKey,
        })
      ).resolves.toBeUndefined();
    });

    it('should handle license with special characters', async () => {
      const specialLicense = 'license-with-special-chars-!@#$%^&*()';

      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, async ({ request }) => {
          const body = await request.text();
          // URLSearchParams encodes more aggressively than encodeURIComponent
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('license', specialLicense);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(
        client.setLicense({
          license: specialLicense,
        })
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        })
      );

      await expect(client.setLicense({ license: mockLicenseKey })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should handle forbidden access', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, () => {
          return new HttpResponse('Forbidden', { status: 403 });
        })
      );

      await expect(client.setLicense({ license: mockLicenseKey })).rejects.toThrow();
    });

    it('should handle invalid license', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, () => {
          return new HttpResponse('Bad Request: Invalid license', { status: 400 });
        })
      );

      await expect(client.setLicense({ license: 'invalid-license' })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.setLicense({ license: mockLicenseKey })).rejects.toThrow(NetworkError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, () => {
          return new HttpResponse('Internal Server Error', { status: 500 });
        })
      );

      await expect(client.setLicense({ license: mockLicenseKey })).rejects.toThrow();
    });

    it('should handle empty license string', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/set_license`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('license=');

          return new HttpResponse('', { status: 204 });
        })
      );

      await expect(
        client.setLicense({
          license: '',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new EditionsClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(EditionsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new EditionsClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(EditionsClient);
    });

    it('should create client with options object', () => {
      const clientWithOptions = new EditionsClient(baseUrl, 'test-token', {
        organization: 'my-org',
        timeout: 10000,
      });
      expect(clientWithOptions).toBeInstanceOf(EditionsClient);
    });
  });

  describe('authorization header', () => {
    it('should include authorization header when token is provided', async () => {
      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBe('Bearer test-token');
          return new HttpResponse('', { status: 204 });
        })
      );

      await client.activateGracePeriod();
    });

    it('should work without authorization header when token is empty', async () => {
      const clientWithoutToken = new EditionsClient(baseUrl, '');

      server.use(
        http.post(`${baseUrl}/api/editions/activate_grace_period`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBeNull();
          return new HttpResponse('', { status: 204 });
        })
      );

      await clientWithoutToken.activateGracePeriod();
    });
  });
});
