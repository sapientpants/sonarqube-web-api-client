import { AnalysisCacheClient } from '../AnalysisCacheClient';
import { AuthorizationError } from '../../../errors';

describe('AnalysisCacheClient', () => {
  let client: AnalysisCacheClient;
  let clientWithoutToken: AnalysisCacheClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new AnalysisCacheClient(baseUrl, token);
    clientWithoutToken = new AnalysisCacheClient(baseUrl);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('should fetch analysis cache with project parameter', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.get({ project: 'my-project' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/analysis_cache/get?project=my-project',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
          responseType: 'arrayBuffer',
        }
      );
      expect(result).toBe(mockArrayBuffer);
    });

    it('should fetch analysis cache with project and branch parameters', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.get({
        project: 'my-project',
        branch: 'feature/my-branch',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/analysis_cache/get?project=my-project&branch=feature%2Fmy-branch',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
          responseType: 'arrayBuffer',
        }
      );
      expect(result).toBe(mockArrayBuffer);
    });

    it('should include authorization header when token is provided', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.get({ project: 'my-project' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit & { responseType: string },
      ];
      const headers = fetchCall[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should handle gzipped response', async () => {
      // Create a mock gzipped array buffer
      const gzippedData = new Uint8Array([0x1f, 0x8b, 0x08, 0x00]).buffer;
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(gzippedData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.get({ project: 'my-project' });

      expect(result).toBe(gzippedData);
    });

    it('should throw error on failed request', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            errors: [{ msg: 'Insufficient privileges' }],
          })
        ),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.get({ project: 'my-project' })).rejects.toThrow(AuthorizationError);
    });

    it('should handle empty cache data', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(emptyBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.get({ project: 'my-project' });

      expect(result).toBe(emptyBuffer);
      expect(result.byteLength).toBe(0);
    });

    it('should encode special characters in parameters', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.get({
        project: 'my project with spaces',
        branch: 'feature/branch-with-#-special@chars',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/analysis_cache/get?project=my+project+with+spaces&branch=feature%2Fbranch-with-%23-special%40chars',
        expect.any(Object)
      );
    });

    it('should work without authentication token', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await clientWithoutToken.get({ project: 'my-project' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://sonarqube.example.com/api/analysis_cache/get?project=my-project',
        {
          headers: {},
          responseType: 'arrayBuffer',
        }
      );
      expect(result).toBe(mockArrayBuffer);
    });
  });
});
