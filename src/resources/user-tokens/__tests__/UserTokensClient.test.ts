import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../test-utils/assertions';
import { UserTokensClient } from '../UserTokensClient';
import { AuthenticationError, AuthorizationError, NetworkError } from '../../../errors';
import type { GenerateTokenResponse, SearchTokensResponse, UserToken } from '../types';

describe('UserTokensClient', () => {
  let client: UserTokensClient;
  let clientWithEmptyToken: UserTokensClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new UserTokensClient(baseUrl, token);
    clientWithEmptyToken = new UserTokensClient(baseUrl, '');
  });

  describe('generate', () => {
    it('should generate a token for current user', async () => {
      const mockResponse: GenerateTokenResponse = {
        login: 'john.doe',
        name: 'CI Token',
        token: 'generated-token-value',
        createdAt: '2023-01-01T00:00:00+0000',
      };

      server.use(
        http.post(`${baseUrl}/api/user_tokens/generate`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          expect(body).toBe('name=CI+Token');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.generate({ name: 'CI Token' });
      expect(result).toEqual(mockResponse);
    });

    it('should generate a token for specified user', async () => {
      const mockResponse: GenerateTokenResponse = {
        login: 'g.hopper',
        name: 'Project scan on Travis',
        token: 'generated-token-value',
        createdAt: '2023-01-01T00:00:00+0000',
      };

      server.use(
        http.post(`${baseUrl}/api/user_tokens/generate`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          expect(body).toBe('name=Project+scan+on+Travis&login=g.hopper');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.generate({
        login: 'g.hopper',
        name: 'Project scan on Travis',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/generate`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Invalid authentication' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.generate({ name: 'Test Token' })).rejects.toThrow(AuthenticationError);
    });

    it('should handle 403 authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/generate`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient privileges' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.generate({ name: 'Test Token' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/generate`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.generate({ name: 'Test Token' })).rejects.toThrow(NetworkError);
    });
  });

  describe('revoke', () => {
    it('should revoke a token for current user', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/revoke`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          expect(body).toBe('name=CI+Token');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.revoke({ name: 'CI Token' })).resolves.toBeUndefined();
    });

    it('should revoke a token for specified user', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/revoke`, async ({ request }) => {
          assertAuthorizationHeader(request, token);
          const body = await request.text();
          expect(body).toBe('name=Project+scan+on+Travis&login=g.hopper');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.revoke({ login: 'g.hopper', name: 'Project scan on Travis' })
      ).resolves.toBeUndefined();
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/revoke`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Invalid authentication' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.revoke({ name: 'Test Token' })).rejects.toThrow(AuthenticationError);
    });

    it('should handle 403 authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/revoke`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient privileges' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.revoke({ name: 'Test Token' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/user_tokens/revoke`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.revoke({ name: 'Test Token' })).rejects.toThrow(NetworkError);
    });
  });

  describe('search', () => {
    const mockTokens: UserToken[] = [
      {
        name: 'CI Token',
        createdAt: '2023-01-01T00:00:00+0000',
        lastConnectionDate: '2023-12-01T12:00:00+0000',
      },
      {
        name: 'Dev Token',
        createdAt: '2023-06-01T00:00:00+0000',
      },
    ];

    it('should list tokens for current user', async () => {
      const mockResponse: SearchTokensResponse = {
        login: 'john.doe',
        userTokens: mockTokens,
      };

      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBeNull();
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.search();
      expect(result).toEqual(mockResponse);
    });

    it('should list tokens for specified user', async () => {
      const mockResponse: SearchTokensResponse = {
        login: 'g.hopper',
        userTokens: mockTokens,
      };

      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('g.hopper');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.search({ login: 'g.hopper' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty token list', async () => {
      const mockResponse: SearchTokensResponse = {
        login: 'john.doe',
        userTokens: [],
      };

      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.search();
      expect(result).toEqual(mockResponse);
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Invalid authentication' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.search()).rejects.toThrow(AuthenticationError);
    });

    it('should handle 403 authorization errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient privileges' }] },
            { status: 403 }
          );
        })
      );

      await expect(client.search()).rejects.toThrow(AuthorizationError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, () => {
          return HttpResponse.error();
        })
      );

      await expect(client.search()).rejects.toThrow(NetworkError);
    });

    it('should work without authentication for current user', async () => {
      const mockResponse: SearchTokensResponse = {
        login: 'anonymous',
        userTokens: [],
      };

      server.use(
        http.get(`${baseUrl}/api/user_tokens/search`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await clientWithEmptyToken.search();
      expect(result).toEqual(mockResponse);
    });
  });
});
