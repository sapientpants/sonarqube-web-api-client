import { BaseClient } from '../../core/BaseClient';
import { ValidationError } from '../../errors';
import { GetWebhookDeliveriesBuilder, ListWebhooksBuilder } from './builders';
import type {
  CreateWebhookRequest,
  CreateWebhookResponse,
  DeleteWebhookRequest,
  GetWebhookDeliveriesResponse,
  GetWebhookDeliveryRequest,
  GetWebhookDeliveryResponse,
  ListWebhooksResponse,
  UpdateWebhookRequest,
} from './types';

/**
 * Client for interacting with the SonarQube Webhooks API.
 * Webhooks allow to notify external services when a project analysis is done.
 */
export class WebhooksClient extends BaseClient {
  /**
   * Create a webhook.
   * Requires 'Administer' permission on the specified project.
   *
   * @param request - The webhook creation parameters
   * @returns Promise resolving to the created webhook
   * @throws {ValidationError} If request parameters are invalid
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission
   *
   * @example
   * ```typescript
   * const webhook = await client.webhooks.create({
   *   name: 'My Webhook',
   *   organization: 'my-org',
   *   project: 'my-project',
   *   url: 'https://my-server.com/webhook',
   *   secret: 'my-secret'
   * });
   * ```
   */
  async create(request: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    if (!request.name || request.name.trim().length === 0) {
      throw new ValidationError('name is required');
    }
    if (!request.organization || request.organization.trim().length === 0) {
      throw new ValidationError('organization is required');
    }
    if (!request.url || request.url.trim().length === 0) {
      throw new ValidationError('url is required');
    }

    const params = new URLSearchParams();
    params.append('name', request.name.trim());
    params.append('organization', request.organization.trim());
    params.append('url', request.url.trim());

    if (request.project !== undefined && request.project.trim().length > 0) {
      params.append('project', request.project.trim());
    }
    if (request.secret !== undefined && request.secret.trim().length > 0) {
      params.append('secret', request.secret.trim());
    }

    return this.request<CreateWebhookResponse>('/api/webhooks/create', {
      method: 'POST',
      body: params,
    });
  }

  /**
   * Delete a webhook.
   * Requires 'Administer' permission on the specified project, or global 'Administer' permission.
   *
   * @param request - The webhook deletion parameters
   * @throws {ValidationError} If request parameters are invalid
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission
   *
   * @example
   * ```typescript
   * await client.webhooks.delete({
   *   webhook: 'webhook-key'
   * });
   * ```
   */
  async delete(request: DeleteWebhookRequest): Promise<void> {
    if (!request.webhook || request.webhook.trim().length === 0) {
      throw new ValidationError('webhook is required');
    }

    const params = new URLSearchParams();
    params.append('webhook', request.webhook.trim());

    await this.request('/api/webhooks/delete', {
      method: 'POST',
      body: params,
    });
  }

  /**
   * Get recent webhook deliveries for a specified project or Compute Engine task.
   * Requires 'Administer' permission on the related project.
   *
   * @returns A builder for constructing the deliveries search request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission
   *
   * @example
   * ```typescript
   * // Get deliveries for a project
   * const deliveries = await client.webhooks.deliveries()
   *   .componentKey('my-project')
   *   .pageSize(20)
   *   .execute();
   *
   * // Get deliveries for a specific webhook
   * const deliveries = await client.webhooks.deliveries()
   *   .webhook('webhook-key')
   *   .execute();
   * ```
   */
  deliveries(): GetWebhookDeliveriesBuilder {
    return new GetWebhookDeliveriesBuilder(async (params) => {
      const searchParams = new URLSearchParams();

      if (params.ceTaskId !== undefined && params.ceTaskId.length > 0) {
        searchParams.append('ceTaskId', params.ceTaskId);
      }
      if (params.componentKey !== undefined && params.componentKey.length > 0) {
        searchParams.append('componentKey', params.componentKey);
      }
      if (params.webhook !== undefined && params.webhook.length > 0) {
        searchParams.append('webhook', params.webhook);
      }
      if (params.p !== undefined) {
        searchParams.append('p', params.p.toString());
      }
      if (params.ps !== undefined) {
        searchParams.append('ps', params.ps.toString());
      }

      return this.request<GetWebhookDeliveriesResponse>(
        `/api/webhooks/deliveries?${searchParams.toString()}`
      );
    });
  }

  /**
   * Get a webhook delivery by its ID.
   *
   * @param request - The delivery request parameters
   * @returns Promise resolving to the webhook delivery details
   * @throws {ValidationError} If request parameters are invalid
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the delivery is not found
   *
   * @example
   * ```typescript
   * const delivery = await client.webhooks.delivery({
   *   deliveryId: 'AU-TpxcA-iU5OvuD2FL3'
   * });
   * ```
   */
  async delivery(request: GetWebhookDeliveryRequest): Promise<GetWebhookDeliveryResponse> {
    if (!request.deliveryId || request.deliveryId.trim().length === 0) {
      throw new ValidationError('deliveryId is required');
    }

    const params = new URLSearchParams();
    params.append('deliveryId', request.deliveryId.trim());

    return this.request<GetWebhookDeliveryResponse>(`/api/webhooks/delivery?${params.toString()}`);
  }

  /**
   * Search for global webhooks or project webhooks.
   * Webhooks are ordered by name.
   * Requires 'Administer' permission on the specified project, or global 'Administer' permission.
   *
   * @returns A builder for constructing the list request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission
   *
   * @example
   * ```typescript
   * // List all webhooks for an organization
   * const webhooks = await client.webhooks.list()
   *   .organization('my-org')
   *   .execute();
   *
   * // List webhooks for a specific project
   * const webhooks = await client.webhooks.list()
   *   .organization('my-org')
   *   .project('my-project')
   *   .execute();
   * ```
   */
  list(): ListWebhooksBuilder {
    return new ListWebhooksBuilder(async (params) => {
      if (!params.organization || params.organization.trim().length === 0) {
        throw new ValidationError('organization is required');
      }

      const searchParams = new URLSearchParams();
      searchParams.append('organization', params.organization.trim());

      if (params.project !== undefined && params.project.trim().length > 0) {
        searchParams.append('project', params.project.trim());
      }

      return this.request<ListWebhooksResponse>(`/api/webhooks/list?${searchParams.toString()}`);
    });
  }

  /**
   * Update a webhook.
   * Requires 'Administer' permission on the specified project, or global 'Administer' permission.
   *
   * @param request - The webhook update parameters
   * @throws {ValidationError} If request parameters are invalid
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer' permission
   * @throws {NotFoundError} If the webhook is not found
   *
   * @example
   * ```typescript
   * await client.webhooks.update({
   *   webhook: 'webhook-key',
   *   name: 'Updated Webhook Name',
   *   url: 'https://new-server.com/webhook',
   *   secret: 'new-secret'
   * });
   * ```
   */
  async update(request: UpdateWebhookRequest): Promise<void> {
    if (!request.webhook || request.webhook.trim().length === 0) {
      throw new ValidationError('webhook is required');
    }
    if (!request.name || request.name.trim().length === 0) {
      throw new ValidationError('name is required');
    }
    if (!request.url || request.url.trim().length === 0) {
      throw new ValidationError('url is required');
    }

    const params = new URLSearchParams();
    params.append('webhook', request.webhook.trim());
    params.append('name', request.name.trim());
    params.append('url', request.url.trim());

    if (request.secret !== undefined) {
      if (request.secret.trim().length > 0) {
        params.append('secret', request.secret.trim());
      } else {
        // Empty string removes the secret
        params.append('secret', '');
      }
    }

    await this.request('/api/webhooks/update', {
      method: 'POST',
      body: params,
    });
  }
}
