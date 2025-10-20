import { BaseClient } from '../../core/BaseClient.js';
import type {
  NotificationAddRequest,
  NotificationListRequest,
  NotificationListResponse,
  NotificationModifyRequest,
  NotificationRemoveRequest,
} from './types.js';

/**
 * Client for managing notifications of the authenticated user
 *
 * Notifications control what events trigger alerts to users via different channels (e.g., email).
 * Users can configure both global notifications and project-specific notifications.
 */
export class NotificationsClient extends BaseClient {
  /**
   * Add a notification for the authenticated user
   *
   * Requires authentication. If a project is provided, requires Browse permission on that project.
   *
   * @param params - Notification parameters
   * @param params.type - Notification type (required)
   * @param params.channel - Channel through which the notification is sent (e.g., email)
   * @param params.login - User login (defaults to authenticated user)
   * @param params.project - Project key for project-specific notifications
   * @returns Promise that resolves when the notification is added
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have Browse permission on the specified project
   * @throws {ApiError} If the notification type is invalid for the scope (global vs project)
   *
   * @example
   * ```typescript
   * // Add a global notification for new issues assigned to me
   * await client.notifications.add({
   *   type: GlobalNotificationType.ChangesOnMyIssue
   * });
   *
   * // Add a project-specific notification for quality gate changes
   * await client.notifications.add({
   *   type: ProjectNotificationType.NewAlerts,
   *   project: 'my-project',
   *   channel: NotificationChannel.Email
   * });
   * ```
   */
  async add(params: NotificationAddRequest): Promise<undefined> {
    const searchParams = this.buildNotificationParams(params);
    await this.request(`/api/notifications/add?${searchParams.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * List notifications of the authenticated user
   *
   * Returns all configured notifications for the user, including both global
   * and project-specific notifications, along with available notification types
   * and channels.
   *
   * @param params - Optional parameters
   * @param params.login - User login (defaults to authenticated user)
   * @returns Promise that resolves to the list of notifications and configuration
   * @throws {AuthenticationError} If the user is not authenticated
   *
   * @example
   * ```typescript
   * // List notifications for the authenticated user
   * const result = await client.notifications.list();
   * console.log('Active notifications:', result.notifications);
   * console.log('Available channels:', result.channels);
   * console.log('Global types:', result.globalTypes);
   * console.log('Per-project types:', result.perProjectTypes);
   *
   * // List notifications for a specific user (requires admin permissions)
   * const userNotifications = await client.notifications.list({
   *   login: 'john.doe'
   * });
   * ```
   */
  async list(params: NotificationListRequest = {}): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();

    if (params.login !== undefined && params.login !== '') {
      searchParams.set('login', params.login);
    }

    const query = searchParams.toString();
    const url = query ? `/api/notifications/list?${query}` : '/api/notifications/list';

    return this.request<NotificationListResponse>(url);
  }

  /**
   * Remove a notification for the authenticated user
   *
   * Removes a previously configured notification. The parameters must match
   * exactly with the notification to be removed.
   *
   * @param params - Notification parameters
   * @param params.type - Notification type (required)
   * @param params.channel - Channel through which the notification is sent
   * @param params.login - User login (defaults to authenticated user)
   * @param params.project - Project key for project-specific notifications
   * @returns Promise that resolves when the notification is removed
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the notification doesn't exist
   *
   * @example
   * ```typescript
   * // Remove a global notification
   * await client.notifications.remove({
   *   type: GlobalNotificationType.ChangesOnMyIssue
   * });
   *
   * // Remove a project-specific notification
   * await client.notifications.remove({
   *   type: ProjectNotificationType.NewAlerts,
   *   project: 'my-project',
   *   channel: NotificationChannel.Email
   * });
   * ```
   */
  async remove(params: NotificationRemoveRequest): Promise<undefined> {
    const searchParams = this.buildNotificationParams(params);
    await this.request(`/api/notifications/remove?${searchParams.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Build URLSearchParams for notification modification requests
   * @private
   */
  private buildNotificationParams(params: NotificationModifyRequest): URLSearchParams {
    const searchParams = new URLSearchParams();
    searchParams.set('type', params.type);

    if (params.channel !== undefined && params.channel !== '') {
      searchParams.set('channel', params.channel);
    }
    if (params.login !== undefined && params.login !== '') {
      searchParams.set('login', params.login);
    }
    if (params.project !== undefined && params.project !== '') {
      searchParams.set('project', params.project);
    }

    return searchParams;
  }
}
