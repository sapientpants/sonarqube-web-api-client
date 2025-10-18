// @ts-nocheck
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../../src/test-utils/msw/server';
import { SonarQubeClient, NoAuthProvider } from '../../../../src/index';
import type {
  GetActiveRulesV2Response,
  EngineMetadataV2,
  GetJresV2Response,
  JreMetadataV2,
  VersionV2Response,
  DownloadProgress,
} from '../../../../src/resources/analysis/types';

describe('AnalysisClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: SonarQubeClient;

  beforeEach(() => {
    client = new SonarQubeClient(baseUrl, token);
  });

  describe('getActiveRulesV2', () => {
    it('should fetch active rules for a project', async () => {
      const mockResponse: GetActiveRulesV2Response = {
        rules: [
          {
            ruleKey: 'java:S1125',
            repository: 'java',
            name: 'Unnecessary boolean literal',
            language: 'java',
            severity: 'MINOR',
            type: 'CODE_SMELL',
            tags: ['clumsy'],
          },
          {
            ruleKey: 'java:S1135',
            repository: 'java',
            name: 'Track uses of "TODO" tags',
            language: 'java',
            severity: 'INFO',
            type: 'CODE_SMELL',
            params: { message: 'Complete this TODO' },
          },
        ],
        total: 2,
      };

      server.use(
        http.get('*/api/v2/analysis/active_rules', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.analysis.getActiveRulesV2({
        projectKey: 'my-project',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle branch parameter', async () => {
      const mockResponse: GetActiveRulesV2Response = {
        rules: [],
        total: 0,
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/analysis/active_rules', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.analysis.getActiveRulesV2({
        projectKey: 'my-project',
        branch: 'feature/new-feature',
      });

      expect(capturedUrl).toContain('projectKey=my-project');
      expect(capturedUrl).toContain('branch=feature%2Fnew-feature');
    });

    it('should handle pull request parameter', async () => {
      const mockResponse: GetActiveRulesV2Response = {
        rules: [],
        total: 0,
      };

      let capturedUrl: string | undefined;
      server.use(
        http.get('*/api/v2/analysis/active_rules', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.analysis.getActiveRulesV2({
        projectKey: 'my-project',
        pullRequest: '123',
      });

      expect(capturedUrl).toContain('projectKey=my-project');
      expect(capturedUrl).toContain('pullRequest=123');
    });

    it('should handle empty rules response', async () => {
      const mockResponse: GetActiveRulesV2Response = {
        rules: [],
        total: 0,
      };

      server.use(
        http.get('*/api/v2/analysis/active_rules', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.analysis.getActiveRulesV2({
        projectKey: 'empty-project',
      });

      expect(result.rules).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('engine endpoints', () => {
    it('should fetch engine metadata with JSON accept header', async () => {
      const mockMetadata: EngineMetadataV2 = {
        filename: 'sonar-scanner-engine-10.3.0.1234.jar',
        sha256: 'abc123def456789',
        downloadUrl: '/api/v2/analysis/engine',
        minimumSqVersion: '10.0',
        size: 5242880,
      };

      server.use(
        http.get('*/api/v2/analysis/engine', ({ request }) => {
          const acceptHeader = request.headers.get('accept');

          if (acceptHeader?.includes('application/json')) {
            return HttpResponse.json(mockMetadata);
          }
          return new HttpResponse(null, { status: 406 });
        }),
      );

      const result = await client.analysis.getEngineMetadataV2();
      expect(result).toEqual(mockMetadata);
    });

    it('should download engine binary with octet-stream header', async () => {
      const mockBinaryData = new ArrayBuffer(1024);

      server.use(
        http.get('*/api/v2/analysis/engine', ({ request }) => {
          const acceptHeader = request.headers.get('accept');

          if (acceptHeader?.includes('application/octet-stream')) {
            return new HttpResponse(mockBinaryData, {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="sonar-scanner-engine.jar"',
                'Content-Length': '1024',
              },
            });
          }
          return new HttpResponse(null, { status: 406 });
        }),
      );

      const blob = await client.analysis.downloadEngineV2();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(1024);
    });

    it('should handle download errors', async () => {
      server.use(
        http.get('*/api/v2/analysis/engine', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(client.analysis.downloadEngineV2()).rejects.toThrow();
    });

    it('should track download progress', async () => {
      const totalSize = 10240; // 10KB
      const chunkSize = 1024; // 1KB chunks
      const progressUpdates: DownloadProgress[] = [];

      server.use(
        http.get('*/api/v2/analysis/engine', async () => {
          const chunks: Uint8Array[] = [];
          for (let i = 0; i < totalSize / chunkSize; i++) {
            chunks.push(new Uint8Array(chunkSize));
          }

          const stream = new ReadableStream({
            async start(controller): Promise<void> {
              for (const chunk of chunks) {
                controller.enqueue(chunk);
                await delay(10); // Simulate network delay
              }
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': totalSize.toString(),
            },
          });
        }),
      );

      await client.analysis.downloadEngineV2({
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toEqual({
        loaded: totalSize,
        total: totalSize,
        percentage: 100,
      });
    });
  });

  describe('JRE endpoints', () => {
    it('should list all available JREs', async () => {
      const mockResponse: GetJresV2Response = {
        jres: [
          {
            id: 'jre-17-linux-x64',
            filename: 'jre-17.0.8-linux-x64.tar.gz',
            sha256: 'sha256hash1',
            javaPath: 'jre-17/bin/java',
            os: 'linux',
            arch: 'x64',
            version: '17.0.8',
            size: 104857600,
          },
          {
            id: 'jre-17-windows-x64',
            filename: 'jre-17.0.8-windows-x64.zip',
            sha256: 'sha256hash2',
            javaPath: 'jre-17/bin/java.exe',
            os: 'windows',
            arch: 'x64',
            version: '17.0.8',
            size: 104857600,
          },
        ],
      };

      server.use(
        http.get('*/api/v2/analysis/jres', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.analysis.getAllJresMetadataV2();
      expect(result).toEqual(mockResponse);
      expect(result.jres).toHaveLength(2);
    });

    it('should fetch specific JRE metadata', async () => {
      const mockJre: JreMetadataV2 = {
        id: 'jre-17-linux-x64',
        filename: 'jre-17.0.8-linux-x64.tar.gz',
        sha256: 'sha256hash',
        javaPath: 'jre-17/bin/java',
        os: 'linux',
        arch: 'x64',
        version: '17.0.8',
        minimumSqVersion: '10.0',
        size: 104857600,
      };

      server.use(
        http.get('*/api/v2/analysis/jres/:id', ({ params, request }) => {
          const acceptHeader = request.headers.get('accept');
          if (
            acceptHeader !== null &&
            acceptHeader.includes('application/json') &&
            params.id === 'jre-17-linux-x64'
          ) {
            return HttpResponse.json(mockJre);
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const result = await client.analysis.getJreMetadataV2('jre-17-linux-x64');
      expect(result).toEqual(mockJre);
    });

    it('should download JRE binary', async () => {
      const mockBinaryData = new ArrayBuffer(2048);

      server.use(
        http.get('*/api/v2/analysis/jres/:id', ({ params, request }) => {
          const acceptHeader = request.headers.get('accept');
          if (
            acceptHeader !== null &&
            acceptHeader.includes('application/octet-stream') &&
            params.id === 'jre-17-linux-x64'
          ) {
            return new HttpResponse(mockBinaryData, {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="jre-17.0.8-linux-x64.tar.gz"',
                'Content-Length': '2048',
              },
            });
          }
          return new HttpResponse(null, { status: 404 });
        }),
      );

      const blob = await client.analysis.downloadJreV2('jre-17-linux-x64');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(2048);
    });

    it('should handle large file downloads', async () => {
      const largeSize = 104857600; // 100MB

      server.use(
        http.get('*/api/v2/analysis/jres/:id', () => {
          // Simulate a large file with a stream
          const stream = new ReadableStream({
            start(controller): void {
              // Just enqueue a small amount to simulate the concept
              controller.enqueue(new Uint8Array(1024));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': largeSize.toString(),
            },
          });
        }),
      );

      const blob = await client.analysis.downloadJreV2('jre-17-linux-x64', {
        onProgress: (progress) => {
          // Track progress
          expect(progress.loaded).toBeGreaterThanOrEqual(0);
        },
      });

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('version endpoint', () => {
    it('should fetch server version', async () => {
      const mockVersion: VersionV2Response = {
        version: '10.3.0',
        buildNumber: '12345',
        commitId: 'abc123def456',
        implementationVersion: '10.3.0.12345',
      };

      server.use(
        http.get('*/api/v2/analysis/version', () => {
          return HttpResponse.json(mockVersion);
        }),
      );

      const result = await client.analysis.getVersionV2();
      expect(result).toEqual(mockVersion);
    });

    it('should work without authentication', async () => {
      const unauthClient = SonarQubeClient.withAuth(baseUrl, new NoAuthProvider());
      const mockVersion: VersionV2Response = {
        version: '10.3.0',
      };

      server.use(
        http.get('*/api/v2/analysis/version', () => {
          // Endpoint should work even without auth
          return HttpResponse.json(mockVersion);
        }),
      );

      const result = await unauthClient.analysis.getVersionV2();
      expect(result).toEqual(mockVersion);
    });
  });

  describe('error handling', () => {
    it('should handle 401 authentication errors', async () => {
      server.use(
        http.get('*/api/v2/analysis/active_rules', () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      await expect(client.analysis.getActiveRulesV2({ projectKey: 'test' })).rejects.toThrow();
    });

    it('should handle 404 not found errors', async () => {
      server.use(
        http.get('*/api/v2/analysis/jres/:id', () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      await expect(client.analysis.getJreMetadataV2('non-existent-jre')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/v2/analysis/engine', () => {
          throw new Error('Network error');
        }),
      );

      await expect(client.analysis.downloadEngineV2()).rejects.toThrow();
    });

    it('should handle timeout with abort signal', async () => {
      server.use(
        http.get('*/api/v2/analysis/engine', async () => {
          await delay(1000);
          return new HttpResponse(new ArrayBuffer(1024));
        }),
      );

      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, 100);

      await expect(
        client.analysis.downloadEngineV2({ signal: controller.signal }),
      ).rejects.toThrow();
    });
  });
});
