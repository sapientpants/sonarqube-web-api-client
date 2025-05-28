import { HotspotsClient } from '../HotspotsClient';
import { SearchHotspotsBuilder } from '../builders';
import { server } from '../../../test-utils/msw/server';
import { http, HttpResponse } from 'msw';

describe('HotspotsClient', () => {
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';
  let client: HotspotsClient;

  beforeEach(() => {
    client = new HotspotsClient(baseUrl, token);
  });

  describe('search', () => {
    it('should return a SearchHotspotsBuilder instance', () => {
      const builder = client.search();
      expect(builder).toBeInstanceOf(SearchHotspotsBuilder);
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
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        })
      );

      await expect(client.show({ hotspot: '' })).rejects.toThrow();
    });

    it('should throw on server error', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return new HttpResponse(null, { status: 500 });
        })
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
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        })
      );

      await expect(
        client.changeStatus({
          hotspot: 'hotspot-1',
          status: 'REVIEWED',
          // Missing resolution
        })
      ).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      server.use(
        http.post('*/api/hotspots/change_status', () => {
          return new HttpResponse(
            JSON.stringify({ errors: [{ msg: 'Missing required parameters' }] }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        })
      );

      await expect(
        client.changeStatus({
          hotspot: '',
          status: 'TO_REVIEW',
        })
      ).rejects.toThrow();
    });

    it('should throw on server error', async () => {
      server.use(
        http.post('*/api/hotspots/change_status', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        client.changeStatus({
          hotspot: 'hotspot-1',
          status: 'TO_REVIEW',
        })
      ).rejects.toThrow();
    });
  });

  describe('authentication and error handling', () => {
    it('should handle authentication errors', async () => {
      const unauthorizedClient = new HotspotsClient(baseUrl, 'invalid-token');

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
        })
      );

      await expect(client.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/hotspots/show', () => {
          return HttpResponse.error();
        })
      );

      await expect(client.show({ hotspot: 'hotspot-1' })).rejects.toThrow();
    });
  });
});
