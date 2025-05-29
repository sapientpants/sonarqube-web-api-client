/**
 * Types for the SonarQube Webhooks API
 */

/**
 * Webhook entity
 */
export interface Webhook {
  key: string;
  name: string;
  url: string;
  hasSecret: boolean;
}

/**
 * Webhook delivery entity
 */
export interface WebhookDelivery {
  id: string;
  componentKey: string;
  ceTaskId?: string;
  name: string;
  url: string;
  hasSecret: boolean;
  at: string;
  success: boolean;
  httpStatus?: number;
  durationMs: number;
  payload?: string;
  errorStacktrace?: string;
}

/**
 * Request parameters for create webhook
 */
export interface CreateWebhookRequest {
  name: string;
  organization: string;
  project?: string;
  secret?: string;
  url: string;
}

/**
 * Response for create webhook
 */
export interface CreateWebhookResponse {
  webhook: Webhook;
}

/**
 * Request parameters for delete webhook
 */
export interface DeleteWebhookRequest {
  webhook: string;
}

/**
 * Request parameters for update webhook
 */
export interface UpdateWebhookRequest {
  webhook: string;
  name: string;
  url: string;
  secret?: string;
}

/**
 * Request parameters for list webhooks
 */
export interface ListWebhooksRequest {
  organization: string;
  project?: string;
}

/**
 * Response for list webhooks
 */
export interface ListWebhooksResponse {
  webhooks: Webhook[];
}

/**
 * Request parameters for get webhook deliveries
 */
export interface GetWebhookDeliveriesRequest {
  ceTaskId?: string;
  componentKey?: string;
  p?: number;
  ps?: number;
  webhook?: string;
}

/**
 * Response for get webhook deliveries
 */
export interface GetWebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Request parameters for get webhook delivery
 */
export interface GetWebhookDeliveryRequest {
  deliveryId: string;
}

/**
 * Response for get webhook delivery
 */
export interface GetWebhookDeliveryResponse {
  delivery: WebhookDelivery;
}
