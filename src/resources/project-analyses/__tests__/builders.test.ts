import { ValidationError } from '../../../errors';
import { SearchProjectAnalysesBuilder } from '../builders';
import type { SearchAnalysesResponse } from '../types';

describe('SearchProjectAnalysesBuilder', () => {
  let mockExecutor: jest.Mock;

  beforeEach(() => {
    mockExecutor = jest.fn();
  });

  describe('parameter methods', () => {
    let builder: SearchProjectAnalysesBuilder;

    beforeEach(() => {
      builder = new SearchProjectAnalysesBuilder(mockExecutor);
    });

    it('should set project parameter', () => {
      builder.project('my-project');
      expect(builder['params'].project).toBe('my-project');
    });

    it('should set branch parameter', () => {
      builder.branch('main');
      expect(builder['params'].branch).toBe('main');
    });

    it('should set category parameter', () => {
      builder.category('VERSION');
      expect(builder['params'].category).toBe('VERSION');
    });

    it('should set from parameter', () => {
      builder.from('2024-01-01');
      expect(builder['params'].from).toBe('2024-01-01');
    });

    it('should set to parameter', () => {
      builder.to('2024-12-31');
      expect(builder['params'].to).toBe('2024-12-31');
    });

    it('should set page parameter', () => {
      builder.page(2);
      expect(builder['params'].p).toBe(2);
    });

    it('should set pageSize parameter', () => {
      builder.pageSize(50);
      expect(builder['params'].ps).toBe(50);
    });

    it('should support method chaining', () => {
      const result = builder
        .project('my-project')
        .branch('develop')
        .category('QUALITY_GATE')
        .from('2024-01-01')
        .to('2024-12-31')
        .pageSize(25);

      expect(result).toBe(builder);
      expect(builder['params']).toEqual({
        project: 'my-project',
        branch: 'develop',
        category: 'QUALITY_GATE',
        from: '2024-01-01',
        to: '2024-12-31',
        ps: 25,
      });
    });
  });

  describe('execute', () => {
    let builder: SearchProjectAnalysesBuilder;

    beforeEach(() => {
      builder = new SearchProjectAnalysesBuilder(mockExecutor);
    });

    it('should throw ValidationError if project is not set', async () => {
      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow('Project key is required');
    });

    it('should throw ValidationError if page size is invalid', async () => {
      builder.project('my-project').pageSize(0);
      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow(
        'Page size must be greater than 0 and less than or equal to 500'
      );

      builder.pageSize(501);
      await expect(builder.execute()).rejects.toThrow(ValidationError);
      await expect(builder.execute()).rejects.toThrow(
        'Page size must be greater than 0 and less than or equal to 500'
      );
    });

    it('should call executor with correct parameters', async () => {
      const mockResponse: SearchAnalysesResponse = {
        paging: { pageIndex: 1, pageSize: 100, total: 0 },
        analyses: [],
      };
      mockExecutor.mockResolvedValue(mockResponse);

      builder.project('my-project').branch('main').category('VERSION');
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        project: 'my-project',
        branch: 'main',
        category: 'VERSION',
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle all event categories', async () => {
      const mockResponse: SearchAnalysesResponse = {
        paging: { pageIndex: 1, pageSize: 100, total: 0 },
        analyses: [],
      };
      mockExecutor.mockResolvedValue(mockResponse);

      const categories = [
        'VERSION',
        'OTHER',
        'QUALITY_PROFILE',
        'QUALITY_GATE',
        'DEFINITION_CHANGE',
      ] as const;

      for (const category of categories) {
        mockExecutor.mockClear();
        await builder.project('my-project').category(category).execute();
        expect(mockExecutor).toHaveBeenCalledWith(expect.objectContaining({ category }));
      }
    });
  });

  describe('getItems', () => {
    let builder: SearchProjectAnalysesBuilder;

    beforeEach(() => {
      builder = new SearchProjectAnalysesBuilder(mockExecutor);
    });

    it('should extract analyses from response', () => {
      const response: SearchAnalysesResponse = {
        paging: { pageIndex: 1, pageSize: 100, total: 2 },
        analyses: [
          {
            key: 'analysis1',
            date: '2024-01-01T10:00:00+0000',
            events: [],
          },
          {
            key: 'analysis2',
            date: '2024-01-02T10:00:00+0000',
            events: [
              {
                key: 'event1',
                category: 'VERSION',
                name: '1.0.0',
              },
            ],
          },
        ],
      };

      const items = builder['getItems'](response);
      expect(items).toBe(response.analyses);
      expect(items).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    it('should handle pagination through all() method', async () => {
      const page1: SearchAnalysesResponse = {
        paging: { pageIndex: 1, pageSize: 2, total: 3 },
        analyses: [
          { key: 'analysis1', date: '2024-01-01', events: [] },
          { key: 'analysis2', date: '2024-01-02', events: [] },
        ],
      };

      const page2: SearchAnalysesResponse = {
        paging: { pageIndex: 2, pageSize: 2, total: 3 },
        analyses: [{ key: 'analysis3', date: '2024-01-03', events: [] }],
      };

      mockExecutor.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

      const builder = new SearchProjectAnalysesBuilder(mockExecutor);
      // Ensure we're starting with a clean builder
      expect(builder['params']).toEqual({});

      const analyses = [];
      for await (const analysis of builder.project('my-project').all()) {
        analyses.push(analysis);
      }

      expect(analyses).toHaveLength(3);
      expect(analyses[0].key).toBe('analysis1');
      expect(analyses[1].key).toBe('analysis2');
      expect(analyses[2].key).toBe('analysis3');

      expect(mockExecutor).toHaveBeenCalledTimes(2);
      // Verify the project parameter was passed correctly
      expect(mockExecutor).toHaveBeenCalledWith(expect.objectContaining({ project: 'my-project' }));
    });
  });
});
