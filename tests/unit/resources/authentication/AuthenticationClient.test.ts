// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
} from '../../../../src/test-utils/assertions.js';
import { AuthenticationClient } from '../../../../src/resources/authentication/AuthenticationClient.js';
import { AuthenticationError, NetworkError } from '../../../../src/errors/index.js';
import type { ValidateResponse } from '../../../../src/resources/authentication/types.js';

describe('AuthenticationClient', () => {
  let client: AuthenticationClient;
  let clientWithEmptyToken: AuthenticationClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AuthenticationClient(baseUrl, token);
    clientWithEmptyToken = new AuthenticationClient(baseUrl, '');
  });

  describe('validate', () => {
    it('should return valid true for authenticated user', async () => {
      const mockResponse: ValidateResponse = {
        valid: true,
      };

      server.use(
        http.get(`${baseUrl}/api/authentication/validate`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.validate();
      expect(result).toEqual(mockResponse);
    });

    it('should return valid false for unauthenticated user', async () => {
      const mockResponse: ValidateResponse = {
        valid: false,
      };

      server.use(
        http.get(`${baseUrl}/api/authentication/validate`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await clientWithEmptyToken.validate();
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/authentication/validate`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.validate()).rejects.toThrow(NetworkError);
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/authentication/validate`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Invalid token' }] }, { status: 401 });
        }),
      );

      await expect(client.validate()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      server.use(
        http.post(`${baseUrl}/api/authentication/logout`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(client.logout()).resolves.toBeUndefined();
    });

    it('should handle 401 authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/authentication/logout`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'User is not authenticated' }] },
            { status: 401 },
          );
        }),
      );

      await expect(client.logout()).rejects.toThrow(AuthenticationError);
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/authentication/logout`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.logout()).rejects.toThrow(NetworkError);
    });

    it('should send POST request with empty token', async () => {
      server.use(
        http.post(`${baseUrl}/api/authentication/logout`, ({ request }) => {
          assertNoAuthorizationHeader(request);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(clientWithEmptyToken.logout()).resolves.toBeUndefined();
    });
  });
});
