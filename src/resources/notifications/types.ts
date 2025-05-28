/**
 * Types for the SonarQube Notifications API
 */

/**
 * Notification channels
 */
export enum NotificationChannel {
  /** Email notifications */
  Email = 'EmailNotificationChannel',
}

/**
 * Global notification types
 */
export enum GlobalNotificationType {
  /** Background task failure */
  CeReportTaskFailure = 'CeReportTaskFailure',
  /** Changes on issues assigned to me */
  ChangesOnMyIssue = 'ChangesOnMyIssue',
  /** My new issues */
  SQMyNewIssues = 'SQ-MyNewIssues',
}

/**
 * Per-project notification types
 */
export enum ProjectNotificationType {
  /** Background task failure on project */
  CeReportTaskFailure = 'CeReportTaskFailure',
  /** Changes on issues assigned to me in project */
  ChangesOnMyIssue = 'ChangesOnMyIssue',
  /** New quality gate status */
  NewAlerts = 'NewAlerts',
  /** Issues resolved as false positive or won't fix */
  NewFalsePositiveIssue = 'NewFalsePositiveIssue',
  /** New issues in project */
  NewIssues = 'NewIssues',
  /** My new issues in project */
  SQMyNewIssues = 'SQ-MyNewIssues',
}

/**
 * All notification types (union of global and project types)
 */
export type NotificationType = GlobalNotificationType | ProjectNotificationType;

/**
 * Request parameters for notifications/add
 */
export interface NotificationAddRequest {
  /** Notification type */
  type: NotificationType;
  /** Channel through which the notification is sent */
  channel?: NotificationChannel | string;
  /** User login */
  login?: string;
  /** Project key */
  project?: string;
}

/**
 * Request parameters for notifications/list
 */
export interface NotificationListRequest {
  /** User login */
  login?: string;
}

/**
 * Request parameters for notifications/remove
 */
export interface NotificationRemoveRequest {
  /** Notification type */
  type: NotificationType;
  /** Channel through which the notification is sent */
  channel?: NotificationChannel | string;
  /** User login */
  login?: string;
  /** Project key */
  project?: string;
}

/**
 * Notification entity
 */
export interface Notification {
  /** Notification channel */
  channel: string;
  /** Notification type */
  type: string;
  /** Organization key (if applicable) */
  organization?: string;
  /** Project key (if applicable) */
  project?: string;
  /** Project name (if applicable) */
  projectName?: string;
}

/**
 * Response from notifications/list
 */
export interface NotificationListResponse {
  /** List of channels */
  channels: string[];
  /** List of global notification types */
  globalTypes: string[];
  /** List of per-project notification types */
  perProjectTypes: string[];
  /** List of active notifications */
  notifications: Notification[];
}

/**
 * Response from notifications/add and notifications/remove
 * These endpoints return 204 No Content on success
 */
export type NotificationModifyResponse = undefined;
