import { ComponentTreeBuilder, MeasuresHistoryBuilder } from '../builders';
import type { ComponentMeasures, ComponentMeasuresHistory } from '../types';

describe('Measures Builders', () => {
  describe('ComponentTreeBuilder', () => {
    let executor: jest.Mock;
    let builder: ComponentTreeBuilder;

    beforeEach(() => {
      executor = jest.fn();
      builder = new ComponentTreeBuilder(executor, 'my-project', ['coverage', 'bugs']);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('fluent interface', () => {
      it('should set base component ID', () => {
        builder.withBaseComponentId('ABC123');
        expect(builder['params'].baseComponentId).toBe('ABC123');
        expect(builder['params'].component).toBeUndefined();
      });

      it('should add additional fields', () => {
        builder.withAdditionalFields('metrics', 'periods');
        expect(builder['params'].additionalFields).toEqual(['metrics', 'periods']);
      });

      it('should set strategy', () => {
        builder.withStrategy('leaves');
        expect(builder['params'].strategy).toBe('leaves');
      });

      it('should set qualifiers', () => {
        builder.withQualifiers('FIL', 'UTS');
        expect(builder['params'].qualifiers).toEqual(['FIL', 'UTS']);
      });

      it('should set branch', () => {
        builder.withBranch('feature/test');
        expect(builder['params'].branch).toBe('feature/test');
      });

      it('should set pull request', () => {
        builder.withPullRequest('123');
        expect(builder['params'].pullRequest).toBe('123');
      });

      it('should set query filter', () => {
        builder.withQuery('test');
        expect(builder['params'].q).toBe('test');
      });

      it('should set metric sort', () => {
        builder.sortByMetric('coverage', 'withMeasuresOnly');
        expect(builder['params'].metricSort).toBe('coverage');
        expect(builder['params'].metricSortFilter).toBe('withMeasuresOnly');
      });

      it('should set metric sort with default filter', () => {
        builder.sortByMetric('coverage');
        expect(builder['params'].metricSort).toBe('coverage');
        expect(builder['params'].metricSortFilter).toBe('all');
      });

      it('should set field sort', () => {
        builder.sortBy('name', false);
        expect(builder['params'].s).toBe('name');
        expect(builder['params'].asc).toBe(false);
      });

      it('should set field sort with default ascending', () => {
        builder.sortBy('path');
        expect(builder['params'].s).toBe('path');
        expect(builder['params'].asc).toBe(true);
      });

      it('should support method chaining', () => {
        const result = builder
          .withStrategy('children')
          .withQualifiers('FIL')
          .withBranch('main')
          .withQuery('test')
          .sortByMetric('coverage')
          .pageSize(50);

        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          strategy: 'children',
          qualifiers: ['FIL'],
          branch: 'main',
          q: 'test',
          metricSort: 'coverage',
          metricSortFilter: 'all',
          ps: 50,
        });
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        const mockResponse = {
          baseComponent: { key: 'my-project' },
          components: [{ key: 'file1.js' }],
          paging: { pageIndex: 1, pageSize: 100, total: 1 },
        };
        executor.mockResolvedValue(mockResponse);

        const freshBuilder = new ComponentTreeBuilder(executor, 'my-project', ['coverage', 'bugs']);
        const result = await freshBuilder.execute();
        expect(result).toEqual(mockResponse);
        expect(executor).toHaveBeenCalledWith({
          component: 'my-project',
          metricKeys: ['coverage', 'bugs'],
        });
      });

      it('should throw error when more than 15 metrics', async () => {
        const manyMetrics = Array.from({ length: 16 }, (_, i) => `metric${i.toString()}`);
        builder = new ComponentTreeBuilder(executor, 'my-project', manyMetrics);

        await expect(builder.execute()).rejects.toThrow('Maximum 15 metric keys allowed');
      });

      it('should throw error when neither component nor baseComponentId provided', async () => {
        builder = new ComponentTreeBuilder(executor, 'my-project', ['coverage']);
        builder['params'].component = undefined;

        await expect(builder.execute()).rejects.toThrow(
          'Either component or baseComponentId must be provided'
        );
      });

      it('should execute with baseComponentId instead of component', async () => {
        const mockResponse = {
          baseComponent: { id: 'ABC123' },
          components: [],
          paging: { pageIndex: 1, pageSize: 100, total: 0 },
        };
        executor.mockResolvedValue(mockResponse);

        const freshBuilder = new ComponentTreeBuilder(executor, 'my-project', ['coverage', 'bugs']);
        await freshBuilder.withBaseComponentId('ABC123').execute();

        expect(executor).toHaveBeenCalledWith({
          baseComponentId: 'ABC123',
          metricKeys: ['coverage', 'bugs'],
        });
      });
    });

    describe('pagination', () => {
      it('should extract items from response', () => {
        const response = {
          baseComponent: { key: 'my-project' },
          components: [
            { key: 'file1.js', measures: [] },
            { key: 'file2.js', measures: [] },
          ],
          paging: { pageIndex: 1, pageSize: 100, total: 2 },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(response.components);
      });

      it('should support async iteration', async () => {
        const page1 = {
          baseComponent: { key: 'my-project' },
          components: [{ key: 'file1.js' }],
          paging: { pageIndex: 1, pageSize: 1, total: 2 },
        };
        const page2 = {
          baseComponent: { key: 'my-project' },
          components: [{ key: 'file2.js' }],
          paging: { pageIndex: 2, pageSize: 1, total: 2 },
        };

        executor.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

        const freshBuilder = new ComponentTreeBuilder(executor, 'my-project', ['coverage', 'bugs']);
        freshBuilder.pageSize(1);
        const items: ComponentMeasures[] = [];
        for await (const item of freshBuilder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(2);
        expect(items[0].key).toBe('file1.js');
        expect(items[1].key).toBe('file2.js');
      });
    });
  });

  describe('MeasuresHistoryBuilder', () => {
    let executor: jest.Mock;
    let builder: MeasuresHistoryBuilder;

    beforeEach(() => {
      executor = jest.fn();
      builder = new MeasuresHistoryBuilder(executor, 'my-project', ['coverage']);
    });

    describe('fluent interface', () => {
      it('should set branch', () => {
        builder.withBranch('feature/test');
        expect(builder['params'].branch).toBe('feature/test');
      });

      it('should set pull request', () => {
        builder.withPullRequest('456');
        expect(builder['params'].pullRequest).toBe('456');
      });

      it('should set from date', () => {
        builder.from('2024-01-01');
        expect(builder['params'].from).toBe('2024-01-01');
      });

      it('should set to date', () => {
        builder.to('2024-12-31');
        expect(builder['params'].to).toBe('2024-12-31');
      });

      it('should set date range', () => {
        builder.dateRange('2024-01-01', '2024-12-31');
        expect(builder['params'].from).toBe('2024-01-01');
        expect(builder['params'].to).toBe('2024-12-31');
      });

      it('should support method chaining', () => {
        const result = builder.withBranch('main').from('2024-01-01').to('2024-12-31').pageSize(50);

        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          component: 'my-project',
          metrics: ['coverage'],
          branch: 'main',
          from: '2024-01-01',
          to: '2024-12-31',
          ps: 50,
        });
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
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
          paging: { pageIndex: 1, pageSize: 100, total: 1 },
        };
        executor.mockResolvedValue(mockResponse);

        const result = await builder.execute();
        expect(result).toEqual(mockResponse);
        expect(executor).toHaveBeenCalledWith({
          component: 'my-project',
          metrics: ['coverage'],
        });
      });

      it('should throw error when component is missing', async () => {
        builder['params'].component = undefined;
        await expect(builder.execute()).rejects.toThrow('Component is required');
      });

      it('should throw error when metrics is missing', async () => {
        builder['params'].metrics = undefined;
        await expect(builder.execute()).rejects.toThrow('Metrics is required');
      });

      it('should execute with all parameters', async () => {
        const mockResponse = {
          measures: [],
          paging: { pageIndex: 1, pageSize: 100, total: 0 },
        };
        executor.mockResolvedValue(mockResponse);

        await builder
          .withBranch('main')
          .dateRange('2024-01-01', '2024-12-31')
          .page(2)
          .pageSize(50)
          .execute();

        expect(executor).toHaveBeenCalledWith({
          component: 'my-project',
          metrics: ['coverage'],
          branch: 'main',
          from: '2024-01-01',
          to: '2024-12-31',
          p: 2,
          ps: 50,
        });
      });
    });

    describe('pagination', () => {
      it('should extract items from response', () => {
        const response = {
          measures: [
            { metric: 'coverage', history: [] },
            { metric: 'bugs', history: [] },
          ],
          paging: { pageIndex: 1, pageSize: 100, total: 2 },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(response.measures);
      });

      it('should support async iteration', async () => {
        const page1 = {
          measures: [{ metric: 'coverage', history: [] }],
          paging: { pageIndex: 1, pageSize: 1, total: 2 },
        };
        const page2 = {
          measures: [{ metric: 'bugs', history: [] }],
          paging: { pageIndex: 2, pageSize: 1, total: 2 },
        };

        executor.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

        builder.pageSize(1);
        const items: ComponentMeasuresHistory[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(2);
        expect(items[0].metric).toBe('coverage');
        expect(items[1].metric).toBe('bugs');
      });
    });
  });
});
