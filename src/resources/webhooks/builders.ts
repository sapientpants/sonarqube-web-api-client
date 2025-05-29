import { BaseBuilder, PaginatedBuilder, ParameterHelpers } from '../../core/builders';
import type {
  GetWebhookDeliveriesRequest,
  GetWebhookDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
} from './types';

/**
 * Builder for constructing webhook deliveries requests.
 * Search for webhook deliveries with flexible filtering options.
 *
 * @example
 * ```typescript
 * // Get deliveries for a specific project
 * await client.webhooks.deliveries()
 *   .componentKey('my-project')
 *   .pageSize(20)
 *   .execute();
 *
 * // Get deliveries for a specific webhook
 * await client.webhooks.deliveries()
 *   .webhook('webhook-key')
 *   .execute();
 *
 * // Get deliveries for a specific CE task
 * await client.webhooks.deliveries()
 *   .ceTaskId('AU-Tpxb--iU5OvuD2FLy')
 *   .execute();
 * ```
 */
export class GetWebhookDeliveriesBuilder extends PaginatedBuilder<
  GetWebhookDeliveriesRequest,
  GetWebhookDeliveriesResponse,
  unknown
> {
  /**
   * Filter deliveries by Compute Engine task ID.
   */
  ceTaskId = ParameterHelpers.createStringMethod<typeof this>('ceTaskId');

  /**
   * Filter deliveries by project key.
   */
  componentKey = ParameterHelpers.createStringMethod<typeof this>('componentKey');

  /**
   * Filter deliveries by webhook key.
   * Key can be obtained through create or list operations.
   */
  webhook = ParameterHelpers.createStringMethod<typeof this>('webhook');

  async execute(): Promise<GetWebhookDeliveriesResponse> {
    return this.executor(this.params as GetWebhookDeliveriesRequest);
  }

  protected getItems(response: GetWebhookDeliveriesResponse): unknown[] {
    return response.deliveries;
  }
}

/**
 * Builder for constructing list webhooks requests.
 * List global or project-specific webhooks.
 *
 * @example
 * ```typescript
 * // List all webhooks for an organization
 * await client.webhooks.list()
 *   .organization('my-org')
 *   .execute();
 *
 * // List webhooks for a specific project
 * await client.webhooks.list()
 *   .organization('my-org')
 *   .project('my-project')
 *   .execute();
 * ```
 */
export class ListWebhooksBuilder extends BaseBuilder<ListWebhooksRequest, ListWebhooksResponse> {
  /**
   * Organization key (required).
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  /**
   * Project key to filter webhooks for a specific project.
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  async execute(): Promise<ListWebhooksResponse> {
    return this.executor(this.params as ListWebhooksRequest);
  }
}
