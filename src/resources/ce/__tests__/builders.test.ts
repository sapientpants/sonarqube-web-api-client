import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { CEClient } from '../CEClient';
import { ActivityBuilder } from '../builders';
import { TaskStatus, TaskType, type ActivityTask } from '../types';

const SONARQUBE_URL = 'http://localhost:9000';
const TOKEN = 'test-token';

describe('ActivityBuilder', () => {
  let client: CEClient;
  let builder: ActivityBuilder;

  beforeEach(() => {
    client = new CEClient(SONARQUBE_URL, TOKEN);
    builder = new ActivityBuilder(client);
  });

  describe('filtering', () => {
    it('should build request with component filter', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withComponent('my-project').execute();
    });

    it('should build request with componentId filter', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('componentId')).toBe('project-123');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withComponentId('project-123').execute();
    });

    it('should build request with date range', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('minSubmittedAt')).toBe('2023-01-01T00:00:00+0000');
          expect(url.searchParams.get('maxExecutedAt')).toBe('2023-12-31T23:59:59+0000');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withDateRange('2023-01-01T00:00:00+0000', '2023-12-31T23:59:59+0000').execute();
    });

    it('should build request with status filters', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('status')).toBe('FAILED,CANCELED');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withStatuses(TaskStatus.Failed, TaskStatus.Canceled).execute();
    });

    it('should build request with query', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('my-search');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withQuery('my-search').execute();
    });

    it('should build request with onlyCurrents', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('onlyCurrents')).toBe('true');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withOnlyCurrents().execute();
    });

    it('should build request with type filter', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('REPORT');
          return HttpResponse.json({
            tasks: [],
            paging: { pageIndex: 1, pageSize: 100, total: 0 },
          });
        })
      );

      await builder.withType(TaskType.REPORT).execute();
    });
  });

  describe('complex queries', () => {
    it('should chain multiple filters', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          expect(url.searchParams.get('status')).toBe('FAILED');
          expect(url.searchParams.get('onlyCurrents')).toBe('true');
          expect(url.searchParams.get('ps')).toBe('50');
          return HttpResponse.json({
            tasks: [
              {
                id: 'task-1',
                type: TaskType.REPORT,
                status: TaskStatus.Failed,
                submittedAt: '2023-01-01T10:00:00+0000',
              },
            ],
            paging: { pageIndex: 1, pageSize: 50, total: 1 },
          });
        })
      );

      const response = await builder
        .withComponent('my-project')
        .withStatuses(TaskStatus.Failed)
        .withOnlyCurrents()
        .withPageSize(50)
        .execute();

      expect(response.tasks).toHaveLength(1);
      expect(response.tasks[0].status).toBe(TaskStatus.Failed);
    });
  });

  describe('pagination', () => {
    it('should handle pagination', async () => {
      const allTasks = Array.from({ length: 25 }, (_, i) => ({
        id: `task-${String(i)}`,
        type: TaskType.REPORT,
        status: TaskStatus.Success,
        submittedAt: '2023-01-01T10:00:00+0000',
      }));

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('p') ?? '1');
          const pageSize = parseInt(url.searchParams.get('ps') ?? '10');

          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const tasks = allTasks.slice(start, end);

          return HttpResponse.json({
            tasks,
            paging: {
              pageIndex: page,
              pageSize,
              total: allTasks.length,
            },
          });
        })
      );

      // Get all items
      const items: ActivityTask[] = [];
      for await (const task of builder.withPageSize(10).all()) {
        items.push(task);
      }

      expect(items).toHaveLength(25);
      expect(items[0].id).toBe('task-0');
      expect(items[24].id).toBe('task-24');
    });
  });

  describe('getItems', () => {
    it('should extract tasks from response', () => {
      const response = {
        tasks: [
          {
            id: 'task-1',
            type: TaskType.REPORT,
            status: TaskStatus.Success,
            submittedAt: '2023-01-01T10:00:00+0000',
          },
        ],
        paging: { pageIndex: 1, pageSize: 100, total: 1 },
      };

      // Access protected method through type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const items = (builder as any).getItems(response);
      expect(items).toEqual(response.tasks);
    });
  });

  describe('parameter validation', () => {
    it('should throw error when setting query after componentId', () => {
      builder.withComponentId('project-123');

      expect(() => builder.withQuery('search-term')).toThrow(
        'Cannot set query when componentId is already set. These parameters are mutually exclusive.'
      );
    });

    it('should throw error when setting componentId after query', () => {
      builder.withQuery('search-term');

      expect(() => builder.withComponentId('project-123')).toThrow(
        'Cannot set componentId when query is already set. These parameters are mutually exclusive.'
      );
    });

    it('should allow setting component and query together', () => {
      // component and query can be used together, only componentId and query are mutually exclusive
      expect(() => {
        builder.withComponent('my-project').withQuery('search-term');
      }).not.toThrow();
    });
  });
});
