import { http, HttpResponse } from 'msw';
import { server } from '../../../test-utils/msw/server';
import { assertAuthorizationHeader } from '../../../test-utils/assertions';
import { NotificationsClient } from '../NotificationsClient';
import { AuthenticationError, AuthorizationError, NotFoundError } from '../../../errors';
import {
  type NotificationListResponse,
  GlobalNotificationType,
  NotificationChannel,
  ProjectNotificationType,
} from '../types';

describe('NotificationsClient', () => {
  let client: NotificationsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new NotificationsClient(baseUrl, token);
  });

  describe('add', () => {
    it('should add a global notification with minimal parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/add`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('ChangesOnMyIssue');
          expect(url.searchParams.has('channel')).toBe(false);
          expect(url.searchParams.has('login')).toBe(false);
          expect(url.searchParams.has('project')).toBe(false);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.add({
        type: GlobalNotificationType.ChangesOnMyIssue,
      });
    });

    it('should add a project notification with all parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/add`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('NewAlerts');
          expect(url.searchParams.get('channel')).toBe('EmailNotificationChannel');
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('project')).toBe('my-project');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.add({
        type: ProjectNotificationType.NewAlerts,
        channel: NotificationChannel.Email,
        login: 'john.doe',
        project: 'my-project',
      });
    });

    it('should handle custom channel strings', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/add`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('CeReportTaskFailure');
          expect(url.searchParams.get('channel')).toBe('CustomChannel');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.add({
        type: GlobalNotificationType.CeReportTaskFailure,
        channel: 'CustomChannel',
      });
    });
  });

  describe('list', () => {
    const mockResponse: NotificationListResponse = {
      channels: ['EmailNotificationChannel'],
      globalTypes: ['CeReportTaskFailure', 'ChangesOnMyIssue', 'SQ-MyNewIssues'],
      perProjectTypes: [
        'CeReportTaskFailure',
        'ChangesOnMyIssue',
        'NewAlerts',
        'NewFalsePositiveIssue',
        'NewIssues',
        'SQ-MyNewIssues',
      ],
      notifications: [
        {
          channel: 'EmailNotificationChannel',
          type: 'ChangesOnMyIssue',
        },
        {
          channel: 'EmailNotificationChannel',
          type: 'NewAlerts',
          project: 'my-project',
          projectName: 'My Project',
        },
      ],
    };

    it('should list notifications without parameters', async () => {
      server.use(
        http.get(`${baseUrl}/api/notifications/list`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.has('login')).toBe(false);
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list();
      expect(result).toEqual(mockResponse);
    });

    it('should list notifications for a specific user', async () => {
      server.use(
        http.get(`${baseUrl}/api/notifications/list`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('login')).toBe('john.doe');
          return HttpResponse.json(mockResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list({
        login: 'john.doe',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty notifications list', async () => {
      const emptyResponse: NotificationListResponse = {
        channels: ['EmailNotificationChannel'],
        globalTypes: ['CeReportTaskFailure', 'ChangesOnMyIssue', 'SQ-MyNewIssues'],
        perProjectTypes: [
          'CeReportTaskFailure',
          'ChangesOnMyIssue',
          'NewAlerts',
          'NewFalsePositiveIssue',
          'NewIssues',
          'SQ-MyNewIssues',
        ],
        notifications: [],
      };

      server.use(
        http.get(`${baseUrl}/api/notifications/list`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          return HttpResponse.json(emptyResponse);
        })
      );

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await client.list();
      expect(result.notifications).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('should remove a global notification with minimal parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/remove`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('ChangesOnMyIssue');
          expect(url.searchParams.has('channel')).toBe(false);
          expect(url.searchParams.has('login')).toBe(false);
          expect(url.searchParams.has('project')).toBe(false);
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.remove({
        type: GlobalNotificationType.ChangesOnMyIssue,
      });
    });

    it('should remove a project notification with all parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/remove`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('NewAlerts');
          expect(url.searchParams.get('channel')).toBe('EmailNotificationChannel');
          expect(url.searchParams.get('login')).toBe('john.doe');
          expect(url.searchParams.get('project')).toBe('my-project');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.remove({
        type: ProjectNotificationType.NewAlerts,
        channel: NotificationChannel.Email,
        login: 'john.doe',
        project: 'my-project',
      });
    });

    it('should handle removal of notifications with custom channels', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/remove`, ({ request }) => {
          assertAuthorizationHeader(request, token);
          const url = new URL(request.url);
          expect(url.searchParams.get('type')).toBe('NewIssues');
          expect(url.searchParams.get('channel')).toBe('SlackChannel');
          expect(url.searchParams.get('project')).toBe('my-project');
          return new HttpResponse(null, { status: 204 });
        })
      );

      await client.remove({
        type: ProjectNotificationType.NewIssues,
        channel: 'SlackChannel',
        project: 'my-project',
      });
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/add`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      await expect(client.add({ type: GlobalNotificationType.ChangesOnMyIssue })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthorizationError on 403 for project notifications', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/add`, () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      await expect(
        client.add({
          type: ProjectNotificationType.NewAlerts,
          project: 'restricted-project',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when removing non-existent notifications', async () => {
      server.use(
        http.post(`${baseUrl}/api/notifications/remove`, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      await expect(
        client.remove({ type: GlobalNotificationType.ChangesOnMyIssue })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
