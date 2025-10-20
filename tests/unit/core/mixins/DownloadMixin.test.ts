// @ts-nocheck
/**
 * Tests for DownloadMixin
 */

import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import { BaseClient } from '../../../../src/core/BaseClient.js';
import { DownloadMixin } from '../../../../src/core/mixins/DownloadMixin.js';

// Create a test class using the mixin
class TestClient extends DownloadMixin(BaseClient) {
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token ?? '');
  }
}

describe('DownloadMixin', () => {
  let client: TestClient;

  beforeEach(() => {
    client = new TestClient('http://localhost:9000', 'test-token');
  });

  describe('downloadWithProgress', () => {
    it('should download binary content as Blob', async () => {
      const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      server.use(
        http.get('http://localhost:9000/api/v2/test/download', ({ request }) => {
          // Verify headers were sent correctly
          expect(request.headers.get('Accept')).toBe('application/octet-stream');
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');

          return HttpResponse.arrayBuffer(binaryData, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        }),
      );

      const result = await client.downloadWithProgress('/api/v2/test/download');
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(5);

      // Verify blob content
      const arrayBuffer = await result.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      expect(uint8Array).toEqual(binaryData);
    });

    it('should track download progress when callback provided', async () => {
      const chunks = [
        new Uint8Array([0x48, 0x65]), // "He"
        new Uint8Array([0x6c, 0x6c]), // "ll"
        new Uint8Array([0x6f]), // "o"
      ];
      const totalSize = 5;
      const progressUpdates: Array<{ loaded: number; total: number; percentage: number }> = [];

      server.use(
        http.get('http://localhost:9000/api/v2/test/download', () => {
          return new HttpResponse(
            new ReadableStream({
              async start(controller): Promise<void> {
                for (const chunk of chunks) {
                  controller.enqueue(chunk);
                  await new Promise((resolve) => setTimeout(resolve, 10));
                }
                controller.close();
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': totalSize.toString(),
              },
            },
          );
        }),
      );

      const result = await client.downloadWithProgress('/api/v2/test/download', {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(5);

      // Verify progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].loaded).toBe(2);
      expect(progressUpdates[0].total).toBe(5);
      expect(progressUpdates[0].percentage).toBe(40);

      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.loaded).toBe(5);
      expect(lastUpdate.total).toBe(5);
      expect(lastUpdate.percentage).toBe(100);
    });

    it('should handle download without Content-Length header', async () => {
      const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      let progressCalled = false;

      server.use(
        http.get('http://localhost:9000/api/v2/test/download', () => {
          // MSW automatically adds Content-Length for arrayBuffer responses,
          // so we need to use a custom response to simulate no Content-Length
          return new HttpResponse(binaryData, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              // Explicitly remove Content-Length
            },
          });
        }),
      );

      const result = await client.downloadWithProgress('/api/v2/test/download', {
        onProgress: () => {
          progressCalled = true;
        },
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(5);
      expect(progressCalled).toBe(false); // Progress should not be called without Content-Length
    });

    it('should handle download cancellation', async () => {
      const controller = new AbortController();

      server.use(
        http.get('http://localhost:9000/api/v2/test/download', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.arrayBuffer(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });
        }),
      );

      // Cancel after 50ms
      setTimeout(() => {
        controller.abort();
      }, 50);

      await expect(
        client.downloadWithProgress('/api/v2/test/download', {
          signal: controller.signal,
        }),
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/test/download', () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.downloadWithProgress('/api/v2/test/download')).rejects.toThrow(
        'Network request failed',
      );
    });

    it('should handle HTTP errors', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/test/download', () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Resource not found' }],
            },
            { status: 404 },
          );
        }),
      );

      await expect(client.downloadWithProgress('/api/v2/test/download')).rejects.toThrow(
        'Resource not found',
      );
    });
  });

  describe('requestText', () => {
    it('should request text content', async () => {
      const textContent = '{"message": "Hello, World!"}';

      server.use(
        http.get('http://localhost:9000/api/v2/test/text', ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');
          return HttpResponse.text(textContent, { status: 200 });
        }),
      );

      const result = await client.requestText('/api/v2/test/text');
      expect(result).toBe(textContent);
    });

    it('should merge custom headers', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/test/text', ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Bearer test-token');
          expect(request.headers.get('Accept')).toBe('application/json');
          expect(request.headers.get('X-Custom')).toBe('custom-value');
          return HttpResponse.text('OK', { status: 200 });
        }),
      );

      const result = await client.requestText('/api/v2/test/text', {
        headers: {
          Accept: 'application/json',
          'X-Custom': 'custom-value',
        },
      });
      expect(result).toBe('OK');
    });

    it('should handle text request errors', async () => {
      server.use(
        http.get('http://localhost:9000/api/v2/test/text', () => {
          return HttpResponse.json(
            {
              errors: [{ msg: 'Unauthorized' }],
            },
            { status: 401 },
          );
        }),
      );

      await expect(client.requestText('/api/v2/test/text')).rejects.toThrow('Unauthorized');
    });
  });
});
