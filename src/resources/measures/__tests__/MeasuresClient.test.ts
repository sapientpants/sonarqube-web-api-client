import { MeasuresClient } from '../MeasuresClient';
import { http } from 'msw';
import { server } from '../../../test-utils';

describe('MeasuresClient', () => {
  let client: MeasuresClient;

  beforeEach(() => {
    client = new MeasuresClient('http://localhost', 'token');
  });

  describe('component', () => {
    it('should fetch component measures with required parameters', async () => {
      const mockResponse = {
        component: {
          key: 'my-project',
          name: 'My Project',
          qualifier: 'TRK',
          measures: [
            { metric: 'coverage', value: '85.5' },
            { metric: 'bugs', value: '3' },
          ],
        },
      };

      server.use(
        http.get('http://localhost/api/measures/component', () => {
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.component({
        component: 'my-project',
        metricKeys: ['coverage', 'bugs'],
      });

      expect(result).toEqual(mockResponse);
    });

    it('should fetch component measures with component ID', async () => {
      const mockResponse = {
        component: {
          id: 'AVXuGHKutxRmSBZ3KuSQ',
          key: 'my-project',
          name: 'My Project',
          measures: [],
        },
      };

      server.use(
        http.get('http://localhost/api/measures/component', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('componentId')).toBe('AVXuGHKutxRmSBZ3KuSQ');
          expect(url.searchParams.get('metricKeys')).toBe('coverage');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.component({
        componentId: 'AVXuGHKutxRmSBZ3KuSQ',
        metricKeys: ['coverage'],
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle additional fields', async () => {
      server.use(
        http.get('http://localhost/api/measures/component', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('additionalFields')).toBe('metrics,periods');
          return new Response(JSON.stringify({ component: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.component({
        component: 'my-project',
        metricKeys: ['coverage'],
        additionalFields: ['metrics', 'periods'],
      });
    });

    it('should handle branch parameter', async () => {
      server.use(
        http.get('http://localhost/api/measures/component', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('branch')).toBe('feature/test');
          return new Response(JSON.stringify({ component: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.component({
        component: 'my-project',
        metricKeys: ['coverage'],
        branch: 'feature/test',
      });
    });

    it('should handle pull request parameter', async () => {
      server.use(
        http.get('http://localhost/api/measures/component', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('pullRequest')).toBe('123');
          return new Response(JSON.stringify({ component: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.component({
        component: 'my-project',
        metricKeys: ['coverage'],
        pullRequest: '123',
      });
    });

    it('should handle empty additional fields', async () => {
      server.use(
        http.get('http://localhost/api/measures/component', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.has('additionalFields')).toBe(false);
          return new Response(JSON.stringify({ component: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.component({
        component: 'my-project',
        metricKeys: ['coverage'],
        additionalFields: [],
      });
    });

    it('should handle API errors', async () => {
      server.use(
        http.get('http://localhost/api/measures/component', () => {
          return new Response(JSON.stringify({ errors: [{ msg: 'Component not found' }] }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await expect(
        client.component({
          component: 'non-existent',
          metricKeys: ['coverage'],
        })
      ).rejects.toThrow();
    });
  });

  describe('componentTree', () => {
    it('should create a ComponentTreeBuilder with required parameters', () => {
      const builder = client.componentTree('my-project', ['coverage', 'bugs']);
      expect(builder).toBeDefined();
      expect(typeof builder.execute).toBe('function');
    });

    it('should return component tree builder that can be executed', async () => {
      const mockResponse = {
        baseComponent: { key: 'my-project' },
        components: [{ key: 'file1.js' }, { key: 'file2.js' }],
        metrics: [],
      };

      server.use(
        http.get('http://localhost/api/measures/component_tree', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          expect(url.searchParams.get('metricKeys')).toBe('coverage,bugs');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.componentTree('my-project', ['coverage', 'bugs']).execute();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchHistory', () => {
    it('should create a MeasuresHistoryBuilder with required parameters', () => {
      const builder = client.searchHistory('my-project', ['coverage']);
      expect(builder).toBeDefined();
      expect(typeof builder.execute).toBe('function');
    });

    it('should return history builder that can be executed', async () => {
      const mockResponse = {
        measures: [
          {
            metric: 'coverage',
            history: [
              { date: '2024-01-01', value: '80' },
              { date: '2024-01-02', value: '85' },
            ],
          },
        ],
      };

      server.use(
        http.get('http://localhost/api/measures/search_history', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          expect(url.searchParams.get('metrics')).toBe('coverage');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.searchHistory('my-project', ['coverage']).execute();
      expect(result).toEqual(mockResponse);
    });
  });
});
