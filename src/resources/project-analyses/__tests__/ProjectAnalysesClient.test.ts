import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { ProjectAnalysesClient } from '../ProjectAnalysesClient';
import { ValidationError } from '../../../errors';
import type { CreateEventResponse, SearchAnalysesResponse, UpdateEventResponse } from '../types';

describe('ProjectAnalysesClient', () => {
  let client: ProjectAnalysesClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ProjectAnalysesClient(baseUrl, token);
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const mockResponse: CreateEventResponse = {
        event: {
          key: 'event1',
          category: 'VERSION',
          name: '5.6',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/project_analyses/create_event`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.createEvent({
        analysis: 'AU-Tpxb--iU5OvuD2FLy',
        category: 'VERSION',
        name: '5.6',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create an event with default category', async () => {
      const mockResponse: CreateEventResponse = {
        event: {
          key: 'event1',
          category: 'OTHER',
          name: 'Deployment',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/project_analyses/create_event`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            analysis: 'AU-Tpxb--iU5OvuD2FLy',
            name: 'Deployment',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.createEvent({
        analysis: 'AU-Tpxb--iU5OvuD2FLy',
        name: 'Deployment',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw ValidationError for name exceeding 400 characters', async () => {
      const longName = 'a'.repeat(401);

      await expect(
        client.createEvent({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          name: longName,
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        client.createEvent({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          name: longName,
        })
      ).rejects.toThrow('Event name cannot exceed 400 characters');
    });

    it('should throw ValidationError for invalid category', async () => {
      await expect(
        client.createEvent({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          // @ts-expect-error Testing invalid category
          category: 'QUALITY_GATE',
          name: 'Test',
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        client.createEvent({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          // @ts-expect-error Testing invalid category
          category: 'QUALITY_GATE',
          name: 'Test',
        })
      ).rejects.toThrow("Only events of category 'VERSION' and 'OTHER' can be created");
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete an analysis successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/delete`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.deleteAnalysis({ analysis: 'AU-TpxcA-iU5OvuD2FL1' })
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/delete_event`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(client.deleteEvent({ event: 'AU-TpxcA-iU5OvuD2FLz' })).resolves.toBeUndefined();
    });
  });

  describe('search', () => {
    it('should return a SearchProjectAnalysesBuilder', () => {
      const builder = client.search();
      expect(builder).toBeDefined();
      expect(typeof builder.project).toBe('function');
      expect(typeof builder.branch).toBe('function');
      expect(typeof builder.category).toBe('function');
      expect(typeof builder.execute).toBe('function');
    });

    it('should search analyses successfully', async () => {
      const mockResponse: SearchAnalysesResponse = {
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
            projectVersion: '1.0.0',
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/project_analyses/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(url.searchParams.get('branch')).toBe('main');
          expect(url.searchParams.get('category')).toBe('VERSION');
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client
        .search()
        .project('my-project')
        .branch('main')
        .category('VERSION')
        .execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchAll', () => {
    it('should iterate through all analyses', async () => {
      const mockResponse: SearchAnalysesResponse = {
        paging: { pageIndex: 1, pageSize: 100, total: 2 },
        analyses: [
          { key: 'analysis1', date: '2024-01-01', events: [] },
          { key: 'analysis2', date: '2024-01-02', events: [] },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/project_analyses/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        })
      );

      const analyses = [];
      for await (const analysis of client.searchAll('my-project')) {
        analyses.push(analysis);
      }

      expect(analyses).toHaveLength(2);
      expect(analyses[0].key).toBe('analysis1');
      expect(analyses[1].key).toBe('analysis2');
    });
  });

  describe('setBaseline', () => {
    it('should set baseline for project successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/set_baseline`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            analysis: 'AU-Tpxb--iU5OvuD2FLy',
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.setBaseline({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          project: 'my-project',
        })
      ).resolves.toBeUndefined();
    });

    it('should set baseline for branch successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/set_baseline`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            analysis: 'AU-Tpxb--iU5OvuD2FLy',
            project: 'my-project',
            branch: 'feature/new-code',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.setBaseline({
          analysis: 'AU-Tpxb--iU5OvuD2FLy',
          project: 'my-project',
          branch: 'feature/new-code',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('unsetBaseline', () => {
    it('should unset baseline for project successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/unset_baseline`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            project: 'my-project',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.unsetBaseline({
          project: 'my-project',
        })
      ).resolves.toBeUndefined();
    });

    it('should unset baseline for branch successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/project_analyses/unset_baseline`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            project: 'my-project',
            branch: 'feature/new-code',
          });
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.unsetBaseline({
          project: 'my-project',
          branch: 'feature/new-code',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const mockResponse: UpdateEventResponse = {
        event: {
          key: 'AU-TpxcA-iU5OvuD2FL5',
          category: 'VERSION',
          name: '5.6.1',
        },
      };

      server.use(
        http.post(`${baseUrl}/api/project_analyses/update_event`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({
            event: 'AU-TpxcA-iU5OvuD2FL5',
            name: '5.6.1',
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await client.updateEvent({
        event: 'AU-TpxcA-iU5OvuD2FL5',
        name: '5.6.1',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw ValidationError for name exceeding 400 characters', async () => {
      const longName = 'a'.repeat(401);

      await expect(
        client.updateEvent({
          event: 'AU-TpxcA-iU5OvuD2FL5',
          name: longName,
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        client.updateEvent({
          event: 'AU-TpxcA-iU5OvuD2FL5',
          name: longName,
        })
      ).rejects.toThrow('Event name cannot exceed 400 characters');
    });
  });
});
