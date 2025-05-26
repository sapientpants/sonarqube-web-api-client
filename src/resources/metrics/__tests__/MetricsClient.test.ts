import { http, HttpResponse } from 'msw';
import { MetricsClient } from '../MetricsClient';
import { server } from '../../../test-utils/msw/server';
import type {
  SearchMetricsResponse,
  MetricTypesResponse,
  MetricDomainsResponse,
  Metric,
} from '../types';
import { AuthenticationError, NotFoundError, RateLimitError, ServerError } from '../../../errors';

describe('MetricsClient', () => {
  let client: MetricsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new MetricsClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return metrics with default parameters', async () => {
      const mockResponse: SearchMetricsResponse = {
        metrics: [
          {
            id: '1',
            key: 'coverage',
            name: 'Coverage',
            type: 'PERCENT',
            domain: 'Coverage',
            description: 'Coverage by unit tests',
            direction: 1,
            qualitative: true,
            hidden: false,
            custom: false,
            decimalScale: 1,
          },
          {
            id: '2',
            key: 'lines',
            name: 'Lines of Code',
            type: 'INT',
            domain: 'Size',
            description: 'Lines of code',
            direction: -1,
            qualitative: false,
            hidden: false,
            custom: false,
          },
        ],
        total: 2,
        p: 1,
        ps: 50,
      };

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search();

      expect(result).toEqual(mockResponse);
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].key).toBe('coverage');
    });

    it('should handle search parameters correctly', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            metrics: [],
            total: 0,
            p: 2,
            ps: 100,
          });
        })
      );

      await client.search({
        f: ['key', 'name', 'type'],
        isCustom: true,
        p: 2,
        ps: 100,
      });

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const params = capturedUrl!.searchParams;
      expect(params.get('f')).toBe('key,name,type');
      expect(params.get('isCustom')).toBe('true');
      expect(params.get('p')).toBe('2');
      expect(params.get('ps')).toBe('100');
    });

    it('should handle empty results', async () => {
      const mockResponse: SearchMetricsResponse = {
        metrics: [],
        total: 0,
        p: 1,
        ps: 50,
      };

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.search();

      expect(result.metrics).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Authentication required' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.search()).rejects.toThrow(AuthenticationError);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Internal server error' }] }, { status: 500 });
        })
      );

      await expect(client.search()).rejects.toThrow(ServerError);
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Rate limit exceeded' }] },
            {
              status: 429,
              headers: { 'Retry-After': '60' },
            }
          );
        })
      );

      try {
        await client.search();
        fail('Expected RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });
  });

  describe('searchAll', () => {
    it('should iterate through all pages of metrics', async () => {
      const metrics: Metric[] = [];
      for (let i = 1; i <= 1200; i++) {
        metrics.push({
          id: String(i),
          key: `metric_${String(i)}`,
          name: `Metric ${String(i)}`,
          type: 'INT',
        });
      }

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('p') ?? '1');
          const pageSize = parseInt(url.searchParams.get('ps') ?? '500');

          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const pageMetrics = metrics.slice(start, end);

          return HttpResponse.json({
            metrics: pageMetrics,
            total: metrics.length,
            p: page,
            ps: pageSize,
          });
        })
      );

      const collectedMetrics: Metric[] = [];

      for await (const metric of client.searchAll()) {
        collectedMetrics.push(metric);
      }

      expect(collectedMetrics).toHaveLength(1200);
      expect(collectedMetrics[0].key).toBe('metric_1');
      expect(collectedMetrics[1199].key).toBe('metric_1200');
    });

    it('should pass through search parameters', async () => {
      const capturedUrls: URL[] = [];

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, ({ request }) => {
          capturedUrls.push(new URL(request.url));
          return HttpResponse.json({
            metrics: [{ id: '1', key: 'custom_metric', name: 'Custom Metric', type: 'INT' }],
            total: 1,
            p: 1,
            ps: 500,
          });
        })
      );

      const metrics: Metric[] = [];

      for await (const metric of client.searchAll({
        isCustom: true,
        f: ['key', 'name'],
      })) {
        metrics.push(metric);
      }

      expect(capturedUrls).toHaveLength(1);
      const params = capturedUrls[0].searchParams;
      expect(params.get('isCustom')).toBe('true');
      expect(params.get('f')).toBe('key,name');
      expect(params.get('ps')).toBe('500');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          return HttpResponse.json({
            metrics: [],
            total: 0,
            p: 1,
            ps: 500,
          });
        })
      );

      const metrics: Metric[] = [];

      for await (const metric of client.searchAll()) {
        metrics.push(metric);
      }

      expect(metrics).toHaveLength(0);
    });

    it('should propagate errors during iteration', async () => {
      let callCount = 0;

      server.use(
        http.get(`${baseUrl}/api/metrics/search`, () => {
          callCount++;
          if (callCount === 2) {
            return HttpResponse.json({ errors: [{ msg: 'Server error' }] }, { status: 500 });
          }
          return HttpResponse.json({
            metrics: [
              {
                id: String(callCount),
                key: `metric_${String(callCount)}`,
                name: `Metric ${String(callCount)}`,
                type: 'INT',
              },
            ],
            total: 1000,
            p: callCount,
            ps: 1,
          });
        })
      );

      const metrics: Metric[] = [];

      await expect(async () => {
        for await (const metric of client.searchAll()) {
          metrics.push(metric);
        }
      }).rejects.toThrow(ServerError);

      expect(metrics).toHaveLength(1);
    });
  });

  describe('types', () => {
    it('should return available metric types', async () => {
      const mockResponse: MetricTypesResponse = {
        types: [
          'INT',
          'FLOAT',
          'PERCENT',
          'BOOL',
          'STRING',
          'LEVEL',
          'DATA',
          'DISTRIB',
          'RATING',
          'WORK_DUR',
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/metrics/types`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.types();

      expect(result).toEqual(mockResponse);
      expect(result.types).toContain('INT');
      expect(result.types).toContain('PERCENT');
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/types`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Authentication required' }] },
            { status: 401 }
          );
        })
      );

      await expect(client.types()).rejects.toThrow(AuthenticationError);
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/types`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Not found' }] }, { status: 404 });
        })
      );

      await expect(client.types()).rejects.toThrow(NotFoundError);
    });
  });

  describe('domains', () => {
    it('should return metric domains', async () => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const mockResponse: MetricDomainsResponse = {
        domains: ['Issues', 'Maintainability', 'Reliability', 'Security', 'Coverage'],
      };

      server.use(
        http.get(`${baseUrl}/api/metrics/domains`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const result = await client.domains();

      expect(result).toEqual(mockResponse);
      expect(result.domains).toContain('Issues');
      expect(result.domains).toContain('Security');
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/metrics/domains`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Authentication required' }] },
            { status: 401 }
          );
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      await expect(client.domains()).rejects.toThrow(AuthenticationError);
    });
  });
});
