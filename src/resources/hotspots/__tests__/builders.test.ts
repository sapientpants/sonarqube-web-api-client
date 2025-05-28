import { SearchHotspotsBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';
import type { SearchHotspotsRequest, SearchHotspotsResponse } from '../types';

describe('SearchHotspotsBuilder', () => {
  let mockExecutor: jest.Mock<Promise<SearchHotspotsResponse>, [SearchHotspotsRequest]>;
  let builder: SearchHotspotsBuilder;

  beforeEach(() => {
    mockExecutor = jest.fn() as jest.Mock<Promise<SearchHotspotsResponse>, [SearchHotspotsRequest]>;
    builder = new SearchHotspotsBuilder(mockExecutor);
  });

  describe('parameter setting methods', () => {
    it('should set project key', async () => {
      await builder.forProject('my-project').execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectKey: 'my-project',
        })
      );
    });

    it('should set hotspot keys', async () => {
      await builder.withHotspots(['hotspot-1', 'hotspot-2']).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          hotspots: ['hotspot-1', 'hotspot-2'],
        })
      );
    });

    it('should set status filter', async () => {
      await builder.withStatus('TO_REVIEW').execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'TO_REVIEW',
        })
      );
    });

    it('should set resolution filter', async () => {
      await builder.withResolution('FIXED').execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: 'FIXED',
        })
      );
    });

    it('should set onlyMine filter', async () => {
      await builder.onlyMine().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          onlyMine: true,
        })
      );
    });

    it('should set onlyMine filter with explicit value', async () => {
      await builder.onlyMine(false).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          onlyMine: false,
        })
      );
    });

    it('should set sinceLeakPeriod filter', async () => {
      await builder.sinceLeakPeriod().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          sinceLeakPeriod: true,
        })
      );
    });

    it('should set sinceLeakPeriod filter with explicit value', async () => {
      await builder.sinceLeakPeriod(false).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          sinceLeakPeriod: false,
        })
      );
    });

    it('should set files filter', async () => {
      const files = ['src/main/java/App.java', 'src/main/java/Security.java'];
      await builder.inFiles(files).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          files,
        })
      );
    });

    it('should set fileUuids filter', async () => {
      const uuids = ['uuid-1', 'uuid-2'];
      await builder.inFileUuids(uuids).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          fileUuids: uuids,
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should set status to TO_REVIEW with needingReview', async () => {
      await builder.needingReview().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'TO_REVIEW',
        })
      );
    });

    it('should set status to REVIEWED with reviewed', async () => {
      await builder.reviewed().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REVIEWED',
        })
      );
    });

    it('should set status to REVIEWED and resolution to FIXED with fixed', async () => {
      await builder.fixed().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REVIEWED',
          resolution: 'FIXED',
        })
      );
    });

    it('should set status to REVIEWED and resolution to SAFE with safe', async () => {
      await builder.safe().execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REVIEWED',
          resolution: 'SAFE',
        })
      );
    });
  });

  describe('method chaining', () => {
    it('should chain multiple filter methods', async () => {
      await builder
        .forProject('my-project')
        .withStatus('TO_REVIEW')
        .onlyMine()
        .sinceLeakPeriod()
        .pageSize(50)
        .page(2)
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectKey: 'my-project',
          status: 'TO_REVIEW',
          onlyMine: true,
          sinceLeakPeriod: true,
          ps: 50,
          p: 2,
        })
      );
    });

    it('should override previous values when called multiple times', async () => {
      await builder
        .withStatus('TO_REVIEW')
        .withStatus('REVIEWED')
        .withResolution('FIXED')
        .withResolution('SAFE')
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REVIEWED',
          resolution: 'SAFE',
        })
      );
    });
  });

  describe('pagination methods', () => {
    it('should set page size', async () => {
      await builder.pageSize(25).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          ps: 25,
        })
      );
    });

    it('should set page number', async () => {
      await builder.page(3).execute();

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          p: 3,
        })
      );
    });
  });

  describe('iterator functionality', () => {
    beforeEach(() => {
      // Mock successful responses for pagination testing
      server.use(
        http.get('*/api/hotspots/search', ({ request }) => {
          const url = new URL(request.url);
          const page = Number(url.searchParams.get('p')) || 1;
          const pageSize = Number(url.searchParams.get('ps')) || 100;

          const mockHotspots = Array.from({ length: 150 }, (_, i) => ({
            key: `hotspot-${(i + 1).toString()}`,
            component: `project:src/file${(i + 1).toString()}.java`,
            project: 'test-project',
            securityCategory: 'sql-injection',
            vulnerabilityProbability: 'HIGH',
            status: 'TO_REVIEW' as const,
            line: 42,
            hash: `hash-${(i + 1).toString()}`,
            message: `Security hotspot ${(i + 1).toString()}`,
            author: 'test-author',
            creationDate: '2024-01-01T00:00:00+0000',
            updateDate: '2024-01-01T00:00:00+0000',
          }));

          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedHotspots = mockHotspots.slice(startIndex, endIndex);

          return HttpResponse.json({
            hotspots: paginatedHotspots,
            paging: {
              pageIndex: page,
              pageSize,
              total: mockHotspots.length,
            },
          });
        })
      );
    });

    it('should iterate through all hotspots across multiple pages', async () => {
      // Create a real builder that uses actual HTTP requests
      const realBuilder = new SearchHotspotsBuilder(async (params) => {
        const urlParams = new URLSearchParams();

        if (params.projectKey !== undefined && params.projectKey !== '') {
          urlParams.append('projectKey', params.projectKey);
        }
        if (params.p !== undefined && params.p > 0) {
          urlParams.append('p', params.p.toString());
        }
        if (params.ps !== undefined && params.ps > 0) {
          urlParams.append('ps', params.ps.toString());
        }

        const response = await fetch(
          `https://sonarqube.example.com/api/hotspots/search?${urlParams}`,
          {
            headers: { Authorization: 'Bearer test-token' },
          }
        );

        return response.json() as Promise<SearchHotspotsResponse>;
      });

      const hotspots = [];
      for await (const hotspot of realBuilder.forProject('test-project').pageSize(50).all()) {
        hotspots.push(hotspot);
      }

      expect(hotspots).toHaveLength(150);
      expect(hotspots[0].key).toBe('hotspot-1');
      expect(hotspots[149].key).toBe('hotspot-150');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get('*/api/hotspots/search', () => {
          return HttpResponse.json({
            hotspots: [],
            paging: {
              pageIndex: 1,
              pageSize: 100,
              total: 0,
            },
          });
        })
      );

      const realBuilder = new SearchHotspotsBuilder(async (_params) => {
        const response = await fetch(`https://sonarqube.example.com/api/hotspots/search`, {
          headers: { Authorization: 'Bearer test-token' },
        });
        return response.json() as Promise<SearchHotspotsResponse>;
      });

      const hotspots = [];
      for await (const hotspot of realBuilder.forProject('empty-project').all()) {
        hotspots.push(hotspot);
      }

      expect(hotspots).toHaveLength(0);
    });
  });
});
