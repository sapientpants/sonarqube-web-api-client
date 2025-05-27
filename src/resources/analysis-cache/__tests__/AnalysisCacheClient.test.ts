import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import {
  assertAuthorizationHeader,
  assertNoAuthorizationHeader,
  assertQueryParams,
} from '../../../test-utils/assertions';
import { AnalysisCacheClient } from '../AnalysisCacheClient';
import { AuthorizationError } from '../../../errors';

describe('AnalysisCacheClient', () => {
  let client: AnalysisCacheClient;
  let clientWithoutToken: AnalysisCacheClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AnalysisCacheClient(baseUrl, token);
    clientWithoutToken = new AnalysisCacheClient(baseUrl, '');
  });

  describe('get', () => {
    it('should fetch analysis cache with project parameter', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertQueryParams(request, { project: 'my-project' });
          assertAuthorizationHeader(request, token);

          return new HttpResponse(mockArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      const result = await client.get({ project: 'my-project' });
      expect(result).toEqual(mockArrayBuffer);
    });

    it('should fetch analysis cache with project and branch parameters', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertQueryParams(request, {
            project: 'my-project',
            branch: 'feature/my-branch',
          });

          return new HttpResponse(mockArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      const result = await client.get({
        project: 'my-project',
        branch: 'feature/my-branch',
      });

      expect(result).toEqual(mockArrayBuffer);
    });

    it('should include authorization header when token is provided', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertAuthorizationHeader(request, token);

          return new HttpResponse(mockArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      await client.get({ project: 'my-project' });
    });

    it('should handle gzipped response', async () => {
      // Test that the client can handle binary responses that would typically be gzipped
      // Note: In real usage, the server sends gzipped data with Content-Encoding: gzip,
      // and the browser/node automatically decompresses it before we receive it.
      // This test verifies our client correctly handles the decompressed binary data.
      const cacheData = new Uint8Array([0xca, 0xfe, 0xba, 0xbe, 0x00, 0x00, 0x00, 0x01]);
      const mockBuffer = cacheData.buffer;

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertQueryParams(request, { project: 'my-project' });

          // In production, this would have Content-Encoding: gzip and the data would be compressed
          // But for testing, we return uncompressed data as the runtime handles decompression
          return new HttpResponse(mockBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              // Not setting Content-Encoding in test because MSW + fetch would try to decompress
            },
          });
        })
      );

      const result = await client.get({ project: 'my-project' });

      // Verify we received an ArrayBuffer with the expected data
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(8);

      // Verify the binary data matches what we sent
      const resultArray = new Uint8Array(result);
      expect(resultArray[0]).toBe(0xca);
      expect(resultArray[1]).toBe(0xfe);
      expect(resultArray[2]).toBe(0xba);
      expect(resultArray[3]).toBe(0xbe);
    });

    it('should throw error on failed request', async () => {
      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Insufficient privileges' }],
            },
            {
              status: 403,
              statusText: 'Forbidden',
            }
          );
        })
      );

      await expect(client.get({ project: 'my-project' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle empty cache data', async () => {
      const emptyBuffer = new ArrayBuffer(0);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, () => {
          return new HttpResponse(emptyBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      const result = await client.get({ project: 'my-project' });
      expect(result).toEqual(emptyBuffer);
      expect(result.byteLength).toBe(0);
    });

    it('should encode special characters in parameters', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertQueryParams(request, {
            project: 'my project with spaces',
            branch: 'feature/branch-with-#-special@chars',
          });

          return new HttpResponse(mockArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      await client.get({
        project: 'my project with spaces',
        branch: 'feature/branch-with-#-special@chars',
      });
    });

    it('should work without authentication token', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);

      server.use(
        http.get(`${baseUrl}/api/analysis_cache/get`, ({ request }) => {
          assertQueryParams(request, { project: 'my-project' });
          assertNoAuthorizationHeader(request);

          return new HttpResponse(mockArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        })
      );

      const result = await clientWithoutToken.get({ project: 'my-project' });
      expect(result).toEqual(mockArrayBuffer);
    });
  });
});
