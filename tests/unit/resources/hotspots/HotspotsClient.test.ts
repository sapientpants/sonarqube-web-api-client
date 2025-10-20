// @ts-nocheck
import { HotspotsClient } from '../../../../src/resources/hotspots/HotspotsClient.js';
import { SearchHotspotsBuilder } from '../../../../src/resources/hotspots/builders.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import { http, HttpResponse } from 'msw';

describe('HotspotsClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  const invalidToken = 'test-invalid-token';
  let client: HotspotsClient;

  beforeEach(() => {
    client = new HotspotsClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return a SearchHotspotsBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchHotspotsBuilder);
    });

    it('should execute search with basic parameters', async () => {
      const result = await client.search().forProject('test-project').execute();

      expect(result.hotspots).toBeDefined();
      expect(result.paging).toBeDefined();
    });

    it('should execute search with multiple hotspot keys', async () => {
      const result = await client.search().withHotspots(['hotspot-1', 'hotspot-2']).execute();

      expect(result.hotspots).toHaveLength(2);
      expect(result.hotspots[0].key).toBe('hotspot-1');
      expect(result.hotspots[1].key).toBe('hotspot-2');
    });

    it('should execute search with status filter', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .withStatus('TO_REVIEW')
        .execute();

      expect(result.hotspots).toBeDefined();
      // All returned hotspots should have TO_REVIEW status
      result.hotspots.forEach((hotspot) => {
        expect(hotspot.status).toBe('TO_REVIEW');
      });
    });

    it('should execute search with resolution filter', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .withResolution('FIXED')
        .execute();

      expect(result.hotspots).toBeDefined();
      // All returned hotspots should have FIXED resolution
      result.hotspots.forEach((hotspot) => {
        expect(hotspot.resolution).toBe('FIXED');
      });
    });

    it('should execute search with onlyMine filter', async () => {
      const result = await client.search().forProject('test-project').onlyMine(true).execute();

      expect(result.hotspots).toBeDefined();
      // MSW handler filters by assignee === 'john.doe' when onlyMine is true
      result.hotspots.forEach((hotspot) => {
        expect(hotspot.assignee).toBe('john.doe');
      });
    });

    it('should execute search with sinceLeakPeriod filter', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .sinceLeakPeriod(true)
        .execute();

      expect(result.hotspots).toBeDefined();
      // MSW handler filters by creation date > 2024-01-01 when sinceLeakPeriod is true
      result.hotspots.forEach((hotspot) => {
        const creationDate = new Date(hotspot.creationDate);
        const leakPeriodDate = new Date('2024-01-01T00:00:00+0000');
        expect(creationDate.getTime()).toBeGreaterThan(leakPeriodDate.getTime());
      });
    });

    it('should execute search with files filter', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .inFiles(['App.java', 'Security.java'])
        .execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should execute search with fileUuids filter', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .inFileUuids(['uuid-1', 'uuid-2'])
        .execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should execute search with pagination parameters', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .pageSize(50)
        .page(2)
        .execute();

      expect(result.hotspots).toBeDefined();
      expect(result.paging).toBeDefined();
      expect(result.paging.pageIndex).toBe(2);
      expect(result.paging.pageSize).toBe(50);
    });

    it('should execute search with all parameters combined', async () => {
      const result = await client
        .search()
        .forProject('test-project')
        .withHotspots(['hotspot-1'])
        .withStatus('REVIEWED')
        .withResolution('FIXED')
        .onlyMine(false)
        .sinceLeakPeriod(false)
        .inFiles(['App.java'])
        .inFileUuids(['uuid-1'])
        .pageSize(25)
        .page(1)
        .execute();

      expect(result.hotspots).toBeDefined();
      expect(result.paging).toBeDefined();
    });

    it('should execute search with all convenience methods', async () => {
      const needingReviewResult = await client.search().needingReview().execute();
      expect(needingReviewResult.hotspots).toBeDefined();

      const reviewedResult = await client.search().reviewed().execute();
      expect(reviewedResult.hotspots).toBeDefined();

      const fixedResult = await client.search().fixed().execute();
      expect(fixedResult.hotspots).toBeDefined();

      const safeResult = await client.search().safe().execute();
      expect(safeResult.hotspots).toBeDefined();
    });

    it('should handle empty hotspots array parameter', async () => {
      const result = await client.search().forProject('test-project').withHotspots([]).execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle empty files array parameter', async () => {
      const result = await client.search().forProject('test-project').inFiles([]).execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle empty fileUuids array parameter', async () => {
      const result = await client.search().forProject('test-project').inFileUuids([]).execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle zero page number', async () => {
      const result = await client.search().forProject('test-project').page(0).execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle zero page size', async () => {
      const result = await client.search().forProject('test-project').pageSize(0).execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle empty project key', async () => {
      const result = await client.search().forProject('').execute();

      expect(result.hotspots).toBeDefined();
    });

    it('should handle search errors', async () => {
      server.use(
        http.get('*/api/hotspots/search', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(client.search().forProject('test-project').execute()).rejects.toThrow();
    });
  });

  describe('show', () => {
    it('should fetch hotspot details successfully', async () => {
      const result = await client.show({ hotspot: 'hotspot-1' });

      expect(result.key).toBe('hotspot-1');
      expect(result.status).toBe('TO_REVIEW');
      expect(result.securityCategory).toBe('sql-injection');
      expect(result.vulnerabilityProbability).toBe('HIGH');
      expect(result.component).toEqual({
        key: 'project:src/main/java/com/example/App.java',
        qualifier: 'FIL',
        name: 'App.java',
        longName: 'src/main/java/com/example/App.java',
        path: 'src/main/java/com/example/App.java',
      });
    });

    it('should handle missing hotspot parameter', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'The hotspot parameter is missing' }] }),
            { status: 400, headers: { 'content-type': 'application/json' } },
          );
        }),
      );

      await expect(client.show({ hotspot: '' })).rejects.toThrow();
    });

    it('should throw on server error', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(client.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });
  });

  describe('changeStatus', () => {
    it('should change hotspot status to TO_REVIEW successfully', async () => {
      const result = await client.changeStatus({
        hotspot: 'hotspot-1',
        status: 'TO_REVIEW',
      });

      // API returns empty response on success
      expect(result).toEqual({});
    });

    it('should change hotspot status to REVIEWED with resolution', async () => {
      const result = await client.changeStatus({
        hotspot: 'hotspot-1',
        status: 'REVIEWED',
        resolution: 'FIXED',
        comment: 'Issue has been fixed',
      });

      expect(result).toEqual({});
    });

    it('should handle validation error when resolution is missing for REVIEWED status', async () => {
      server.use(
        http.post('*/api/hotspots/change_status', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Resolution is required when status is REVIEWED' }] }),
            { status: 400, headers: { 'content-type': 'application/json' } },
          );
        }),
      );

      await expect(
        client.changeStatus({
          hotspot: 'hotspot-1',
          status: 'REVIEWED',
          // Missing resolution
        }),
      ).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      server.use(
        http.post('*/api/hotspots/change_status', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Missing required parameters' }] }),
            { status: 400, headers: { 'content-type': 'application/json' } },
          );
        }),
      );

      await expect(
        client.changeStatus({
          hotspot: '',
          status: 'TO_REVIEW',
        }),
      ).rejects.toThrow();
    });

    it('should throw on server error', async () => {
      server.use(
        http.post('*/api/hotspots/change_status', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(
        client.changeStatus({
          hotspot: 'hotspot-1',
          status: 'TO_REVIEW',
        }),
      ).rejects.toThrow();
    });
  });

  describe('authentication and error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Authentication required' }] }),
            { status: 401, headers: { 'content-type': 'application/json' } },
          );
        }),
      );

      const unauthorizedClient = new HotspotsClient(baseUrl, invalidToken);

      await expect(unauthorizedClient.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return new HttpResponse(JSON.stringify({ errors: [{ msg: 'Rate limit exceeded' }] }), {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'retry-after': '60',
              'content-type': 'application/json',
            },
          });
        }),
      );

      await expect(client.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });
  });
});
