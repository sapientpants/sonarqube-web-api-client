import { GetWebhookDeliveriesBuilder, ListWebhooksBuilder } from '../builders';
import type {
  GetWebhookDeliveriesRequest,
  GetWebhookDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
} from '../types';

describe('Webhooks Builders', () => {
  describe('GetWebhookDeliveriesBuilder', () => {
    it('should build request with all parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        deliveries: [],
        paging: { pageIndex: 1, pageSize: 10, total: 0 },
      } as GetWebhookDeliveriesResponse);

      const builder = new GetWebhookDeliveriesBuilder(mockExecutor);

      await builder
        .ceTaskId('task-1')
        .componentKey('my-project')
        .webhook('webhook-key')
        .page(2)
        .pageSize(20)
        .execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        ceTaskId: 'task-1',
        componentKey: 'my-project',
        webhook: 'webhook-key',
        p: 2,
        ps: 20,
      } as GetWebhookDeliveriesRequest);
    });

    it('should build request with minimal parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        deliveries: [],
        paging: { pageIndex: 1, pageSize: 10, total: 0 },
      } as GetWebhookDeliveriesResponse);

      const builder = new GetWebhookDeliveriesBuilder(mockExecutor);

      await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({});
    });

    it('should build request with only ceTaskId', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        deliveries: [],
        paging: { pageIndex: 1, pageSize: 10, total: 0 },
      } as GetWebhookDeliveriesResponse);

      const builder = new GetWebhookDeliveriesBuilder(mockExecutor);

      await builder.ceTaskId('task-1').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        ceTaskId: 'task-1',
      } as GetWebhookDeliveriesRequest);
    });

    it('should build request with only componentKey', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        deliveries: [],
        paging: { pageIndex: 1, pageSize: 10, total: 0 },
      } as GetWebhookDeliveriesResponse);

      const builder = new GetWebhookDeliveriesBuilder(mockExecutor);

      await builder.componentKey('my-project').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        componentKey: 'my-project',
      } as GetWebhookDeliveriesRequest);
    });

    it('should build request with only webhook', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        deliveries: [],
        paging: { pageIndex: 1, pageSize: 10, total: 0 },
      } as GetWebhookDeliveriesResponse);

      const builder = new GetWebhookDeliveriesBuilder(mockExecutor);

      await builder.webhook('webhook-key').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        webhook: 'webhook-key',
      } as GetWebhookDeliveriesRequest);
    });
  });

  describe('ListWebhooksBuilder', () => {
    it('should build request with all parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        webhooks: [],
      } as ListWebhooksResponse);

      const builder = new ListWebhooksBuilder(mockExecutor);

      await builder.organization('my-org').project('my-project').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        organization: 'my-org',
        project: 'my-project',
      } as ListWebhooksRequest);
    });

    it('should build request with only organization', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        webhooks: [],
      } as ListWebhooksResponse);

      const builder = new ListWebhooksBuilder(mockExecutor);

      await builder.organization('my-org').execute();

      expect(mockExecutor).toHaveBeenCalledWith({
        organization: 'my-org',
      } as ListWebhooksRequest);
    });

    it('should build request with empty parameters', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({
        webhooks: [],
      } as ListWebhooksResponse);

      const builder = new ListWebhooksBuilder(mockExecutor);

      await builder.execute();

      expect(mockExecutor).toHaveBeenCalledWith({});
    });
  });
});
