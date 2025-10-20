// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import { CEClient } from '../../../../src/resources/ce/CEClient.js';
import { TaskStatus, TaskType } from '../../../../src/resources/ce/types.js';

const SONARQUBE_URL = 'http://localhost:9000';
const TOKEN = 'test-token';

describe('CEClient', () => {
  let client: CEClient;

  beforeEach(() => {
    client = new CEClient(SONARQUBE_URL, TOKEN);
  });

  describe('activity', () => {
    it('should fetch CE activity', async () => {
      const mockResponse = {
        tasks: [
          {
            id: 'AU-Tpxb--iU5OvuD2FLy',
            type: TaskType.REPORT,
            componentId: 'project-1',
            componentKey: 'my-project',
            componentName: 'My Project',
            status: TaskStatus.Success,
            submittedAt: '2023-01-01T10:00:00+0000',
            executedAt: '2023-01-01T10:01:00+0000',
            executionTimeMs: 60000,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 100,
          total: 1,
        },
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.activity();
      expect(response.tasks).toHaveLength(1);
      expect(response.tasks[0].id).toBe('AU-Tpxb--iU5OvuD2FLy');
    });

    it('should fetch activity with filters', async () => {
      const mockResponse = {
        tasks: [],
        paging: { pageIndex: 1, pageSize: 50, total: 0 },
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          expect(url.searchParams.get('status')).toBe('FAILED,CANCELED');
          expect(url.searchParams.get('onlyCurrents')).toBe('true');
          expect(url.searchParams.get('ps')).toBe('50');
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.activity({
        component: 'my-project',
        status: [TaskStatus.Failed, TaskStatus.Canceled],
        onlyCurrents: true,
        ps: 50,
      });
    });

    it('should validate mutual exclusion of component and componentId', async () => {
      // The SonarQube API documentation states that component and componentId
      // cannot be provided together. The client now enforces this constraint.
      await expect(
        client.activity({
          component: 'my-project',
          componentId: 'project-123',
        }),
      ).rejects.toThrow(
        'Both `component` and `componentId` cannot be set simultaneously. Please provide only one.',
      );
    });

    it('should handle errors', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity`, () => {
          return HttpResponse.json(
            { errors: [{ msg: 'Insufficient privileges' }] },
            { status: 403 },
          );
        }),
      );

      await expect(client.activity()).rejects.toThrow('Insufficient privileges');
    });
  });

  describe('activityStatus', () => {
    it('should fetch activity status', async () => {
      const mockResponse = {
        pending: 5,
        inProgress: 2,
        failing: 1,
        pendingTime: 1500,
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity_status`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.activityStatus();
      expect(response.pending).toBe(5);
      expect(response.inProgress).toBe(2);
      expect(response.failing).toBe(1);
      expect(response.pendingTime).toBe(1500);
    });

    it('should fetch status for specific component', async () => {
      const mockResponse = {
        pending: 0,
        inProgress: 1,
        failing: 0,
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/activity_status`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('componentKey')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        }),
      );

      await client.activityStatus({ componentKey: 'my-project' });
    });
  });

  describe('component', () => {
    it('should fetch component tasks', async () => {
      const mockResponse = {
        queue: [
          {
            id: 'task-1',
            type: TaskType.REPORT,
            status: TaskStatus.Pending,
            submittedAt: '2023-01-01T10:00:00+0000',
          },
        ],
        current: {
          id: 'task-2',
          type: TaskType.REPORT,
          status: TaskStatus.InProgress,
          submittedAt: '2023-01-01T09:50:00+0000',
          startedAt: '2023-01-01T10:00:00+0000',
        },
        lastExecutedTask: {
          id: 'task-3',
          type: TaskType.REPORT,
          status: TaskStatus.Success,
          submittedAt: '2023-01-01T09:00:00+0000',
          executedAt: '2023-01-01T09:10:00+0000',
          executionTimeMs: 600000,
        },
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/component`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('component')).toBe('my-project');
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.component({ component: 'my-project' });
      expect(response.queue).toHaveLength(1);
      expect(response.current?.id).toBe('task-2');
      expect(response.lastExecutedTask?.id).toBe('task-3');
    });

    it('should handle no tasks', async () => {
      const mockResponse = {
        queue: [],
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/component`, () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.component({ componentId: 'project-1' });
      expect(response.queue).toHaveLength(0);
      expect(response.current).toBeUndefined();
      expect(response.lastExecutedTask).toBeUndefined();
    });
  });

  describe('task', () => {
    it('should fetch task details', async () => {
      const mockResponse = {
        task: {
          id: 'AU-Tpxb--iU5OvuD2FLy',
          type: TaskType.REPORT,
          componentId: 'project-1',
          componentKey: 'my-project',
          componentName: 'My Project',
          status: TaskStatus.Success,
          submittedAt: '2023-01-01T10:00:00+0000',
          executedAt: '2023-01-01T10:01:00+0000',
          executionTimeMs: 60000,
          hasScannerContext: true,
          warningCount: 2,
        },
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/task`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('id')).toBe('AU-Tpxb--iU5OvuD2FLy');
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.task({ id: 'AU-Tpxb--iU5OvuD2FLy' });
      expect(response.task.id).toBe('AU-Tpxb--iU5OvuD2FLy');
      expect(response.task.status).toBe(TaskStatus.Success);
    });

    it('should fetch task with additional fields', async () => {
      const mockResponse = {
        task: {
          id: 'AU-Tpxb--iU5OvuD2FLy',
          type: TaskType.REPORT,
          status: TaskStatus.Failed,
          submittedAt: '2023-01-01T10:00:00+0000',
          executedAt: '2023-01-01T10:01:00+0000',
          scannerContext: 'sonar.projectKey=my-project',
          warnings: ['Warning 1', 'Warning 2'],
          errorMessage: 'Analysis failed',
        },
      };

      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/task`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('additionalFields')).toBe('scannerContext,warnings');
          return HttpResponse.json(mockResponse);
        }),
      );

      const response = await client.task({
        id: 'AU-Tpxb--iU5OvuD2FLy',
        additionalFields: ['scannerContext', 'warnings'],
      });
      expect(response.task.scannerContext).toBe('sonar.projectKey=my-project');
      expect(response.task.warnings).toHaveLength(2);
    });

    it('should handle task not found', async () => {
      server.use(
        http.get(`${SONARQUBE_URL}/api/ce/task`, () => {
          return HttpResponse.json({ errors: [{ msg: 'Task not found' }] }, { status: 404 });
        }),
      );

      await expect(client.task({ id: 'non-existent' })).rejects.toThrow('Task not found');
    });
  });

  describe('searchActivity', () => {
    it('should return an ActivityBuilder', () => {
      const builder = client.searchActivity();
      expect(builder).toBeDefined();
      expect(builder.constructor.name).toBe('ActivityBuilder');
    });
  });
});
