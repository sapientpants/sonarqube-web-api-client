// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { WebhooksClient } from '../../../../src/resources/webhooks/WebhooksClient.js';
import { server } from '../../../../src/test-utils/msw/server.js';
import { assertCommonHeaders, assertQueryParams } from '../../../../src/test-utils/assertions.js';
import type {
  CreateWebhookResponse,
  GetWebhookDeliveriesResponse,
  GetWebhookDeliveryResponse,
  ListWebhooksResponse,
} from '../../../../src/resources/webhooks/types.js';
import { ValidationError } from '../../../../src/errors/index.js';

describe('WebhooksClient', () => {
  const baseUrl = 'http://localhost:9000';
  const token = 'test-token';
  let client: WebhooksClient;

  beforeEach(() => {
    client = new WebhooksClient(baseUrl, token);
  });

  describe('create', () => {
    it('should create a webhook with all parameters', async () => {
      const mockResponse: CreateWebhookResponse = {
        webhook: {
          key: 'AU-TpxcA-iU5OvuD2FL1',
          name: 'My Webhook',
          url: 'https://www.example.com/webhook',
          hasSecret: true,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/webhooks/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('name')).toBe('My Webhook');
          expect(params.get('organization')).toBe('my-org');
          expect(params.get('project')).toBe('my-project');
          expect(params.get('url')).toBe('https://www.example.com/webhook');
          expect(params.get('secret')).toBe('my-secret');
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.create({
        name: 'My Webhook',
        organization: 'my-org',
        project: 'my-project',
        url: 'https://www.example.com/webhook',
        secret: 'my-secret',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create a webhook without optional parameters', async () => {
      const mockResponse: CreateWebhookResponse = {
        webhook: {
          key: 'AU-TpxcA-iU5OvuD2FL1',
          name: 'My Webhook',
          url: 'https://www.example.com/webhook',
          hasSecret: false,
        },
      };

      server.use(
        http.post(`${baseUrl}/api/webhooks/create`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('name')).toBe('My Webhook');
          expect(params.get('organization')).toBe('my-org');
          expect(params.get('url')).toBe('https://www.example.com/webhook');
          expect(params.has('project')).toBe(false);
          expect(params.has('secret')).toBe(false);
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.create({
        name: 'My Webhook',
        organization: 'my-org',
        url: 'https://www.example.com/webhook',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw ValidationError when name is missing', async () => {
      await expect(
        client.create({
          name: '',
          organization: 'my-org',
          url: 'https://www.example.com/webhook',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when organization is missing', async () => {
      await expect(
        client.create({
          name: 'My Webhook',
          organization: '',
          url: 'https://www.example.com/webhook',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when url is missing', async () => {
      await expect(
        client.create({
          name: 'My Webhook',
          organization: 'my-org',
          url: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('should delete a webhook', async () => {
      server.use(
        http.post(`${baseUrl}/api/webhooks/delete`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('webhook')).toBe('webhook-key');
          return HttpResponse.text('');
        }),
      );

      await expect(
        client.delete({
          webhook: 'webhook-key',
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when webhook is missing', async () => {
      await expect(
        client.delete({
          webhook: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deliveries', () => {
    it('should create a GetWebhookDeliveriesBuilder', () => {
      const builder = client.deliveries();
      expect(builder).toBeDefined();
      expect(typeof builder.ceTaskId).toBe('function');
      expect(typeof builder.componentKey).toBe('function');
      expect(typeof builder.webhook).toBe('function');
      expect(typeof builder.page).toBe('function');
      expect(typeof builder.pageSize).toBe('function');
    });

    it('should get webhook deliveries with all parameters', async () => {
      const mockResponse: GetWebhookDeliveriesResponse = {
        deliveries: [
          {
            id: 'delivery-1',
            componentKey: 'my-project',
            ceTaskId: 'task-1',
            name: 'My Webhook',
            url: 'https://www.example.com/webhook',
            hasSecret: true,
            at: '2024-01-01T10:00:00Z',
            success: true,
            httpStatus: 200,
            durationMs: 150,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 1,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/webhooks/deliveries`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            ceTaskId: 'task-1',
            componentKey: 'my-project',
            webhook: 'webhook-key',
            p: '1',
            ps: '10',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client
        .deliveries()
        .ceTaskId('task-1')
        .componentKey('my-project')
        .webhook('webhook-key')
        .page(1)
        .pageSize(10)
        .execute();

      expect(result).toEqual(mockResponse);
    });

    it('should get webhook deliveries with minimal parameters', async () => {
      const mockResponse: GetWebhookDeliveriesResponse = {
        deliveries: [],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 0,
        },
      };

      server.use(
        http.get(`${baseUrl}/api/webhooks/deliveries`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {});
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.deliveries().execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('delivery', () => {
    it('should get a webhook delivery by ID', async () => {
      const mockResponse: GetWebhookDeliveryResponse = {
        delivery: {
          id: 'delivery-1',
          componentKey: 'my-project',
          ceTaskId: 'task-1',
          name: 'My Webhook',
          url: 'https://www.example.com/webhook',
          hasSecret: true,
          at: '2024-01-01T10:00:00Z',
          success: true,
          httpStatus: 200,
          durationMs: 150,
          payload: '{"status":"SUCCESS"}',
        },
      };

      server.use(
        http.get(`${baseUrl}/api/webhooks/delivery`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            deliveryId: 'delivery-1',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.delivery({
        deliveryId: 'delivery-1',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw ValidationError when deliveryId is missing', async () => {
      await expect(
        client.delivery({
          deliveryId: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('list', () => {
    it('should create a ListWebhooksBuilder', () => {
      const builder = client.list();
      expect(builder).toBeDefined();
      expect(typeof builder.organization).toBe('function');
      expect(typeof builder.project).toBe('function');
    });

    it('should list webhooks for organization and project', async () => {
      const mockResponse: ListWebhooksResponse = {
        webhooks: [
          {
            key: 'webhook-1',
            name: 'Project Webhook',
            url: 'https://www.example.com/webhook',
            hasSecret: true,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/webhooks/list`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
            project: 'my-project',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.list().organization('my-org').project('my-project').execute();

      expect(result).toEqual(mockResponse);
    });

    it('should list webhooks for organization only', async () => {
      const mockResponse: ListWebhooksResponse = {
        webhooks: [
          {
            key: 'webhook-1',
            name: 'Global Webhook',
            url: 'https://www.example.com/webhook',
            hasSecret: false,
          },
        ],
      };

      server.use(
        http.get(`${baseUrl}/api/webhooks/list`, ({ request }) => {
          assertCommonHeaders(request, token);
          assertQueryParams(request, {
            organization: 'my-org',
          });
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await client.list().organization('my-org').execute();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update a webhook with all parameters', async () => {
      server.use(
        http.post(`${baseUrl}/api/webhooks/update`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('webhook')).toBe('webhook-key');
          expect(params.get('name')).toBe('Updated Webhook');
          expect(params.get('url')).toBe('https://www.updated.com/webhook');
          expect(params.get('secret')).toBe('new-secret');
          return HttpResponse.text('');
        }),
      );

      await expect(
        client.update({
          webhook: 'webhook-key',
          name: 'Updated Webhook',
          url: 'https://www.updated.com/webhook',
          secret: 'new-secret',
        }),
      ).resolves.toBeUndefined();
    });

    it('should update a webhook without secret', async () => {
      server.use(
        http.post(`${baseUrl}/api/webhooks/update`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('webhook')).toBe('webhook-key');
          expect(params.get('name')).toBe('Updated Webhook');
          expect(params.get('url')).toBe('https://www.updated.com/webhook');
          expect(params.has('secret')).toBe(false);
          return HttpResponse.text('');
        }),
      );

      await expect(
        client.update({
          webhook: 'webhook-key',
          name: 'Updated Webhook',
          url: 'https://www.updated.com/webhook',
        }),
      ).resolves.toBeUndefined();
    });

    it('should update a webhook and remove secret with empty string', async () => {
      server.use(
        http.post(`${baseUrl}/api/webhooks/update`, async ({ request }) => {
          assertCommonHeaders(request, token);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('webhook')).toBe('webhook-key');
          expect(params.get('name')).toBe('Updated Webhook');
          expect(params.get('url')).toBe('https://www.updated.com/webhook');
          expect(params.get('secret')).toBe('');
          return HttpResponse.text('');
        }),
      );

      await expect(
        client.update({
          webhook: 'webhook-key',
          name: 'Updated Webhook',
          url: 'https://www.updated.com/webhook',
          secret: '',
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when webhook is missing', async () => {
      await expect(
        client.update({
          webhook: '',
          name: 'Updated Webhook',
          url: 'https://www.updated.com/webhook',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name is missing', async () => {
      await expect(
        client.update({
          webhook: 'webhook-key',
          name: '',
          url: 'https://www.updated.com/webhook',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when url is missing', async () => {
      await expect(
        client.update({
          webhook: 'webhook-key',
          name: 'Updated Webhook',
          url: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
