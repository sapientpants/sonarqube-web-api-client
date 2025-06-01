/**
 * Types for SonarQube Audit Logs API
 *
 * **Note**: Only available in SonarQube Enterprise Edition
 * @since SonarQube 8.1
 */

/**
 * Audit log event categories
 */
export type AuditEventCategory =
  | 'AUTH'
  | 'USER_MANAGEMENT'
  | 'PERMISSION'
  | 'PROJECT'
  | 'QUALITY_GATE'
  | 'QUALITY_PROFILE'
  | 'SETTINGS'
  | 'PLUGIN'
  | 'SYSTEM';

/**
 * Audit log event actions
 */
export type AuditEventAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILURE'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'CHANGE_PASSWORD'
  | 'GRANT_PERMISSION'
  | 'REVOKE_PERMISSION';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Unique identifier for the audit log entry */
  id: string;
  /** Timestamp when the event occurred (ISO 8601) */
  timestamp: string;
  /** User who performed the action */
  userLogin?: string;
  /** User name who performed the action */
  userName?: string;
  /** Category of the audit event */
  category: AuditEventCategory;
  /** Specific action performed */
  action: AuditEventAction;
  /** Resource affected by the action */
  resource?: string;
  /** Additional details about the event */
  details?: Record<string, unknown>;
  /** IP address of the user */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
}

/**
 * Request parameters for searching audit logs
 */
export interface SearchAuditLogsRequest {
  /** Filter by category */
  category?: AuditEventCategory;
  /** Filter by action */
  action?: AuditEventAction;
  /** Filter by user login */
  userLogin?: string;
  /** Start date for filtering (ISO 8601) */
  from?: string;
  /** End date for filtering (ISO 8601) */
  to?: string;
  /** Page number (1-based) */
  page?: number;
  /** Page size (max 500) */
  pageSize?: number;
}

/**
 * Response from audit logs search
 */
export interface SearchAuditLogsResponse {
  /** List of audit log entries */
  auditLogs: AuditLogEntry[];
  /** Pagination information */
  page: {
    /** Current page number (1-based) */
    pageIndex: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items */
    totalItems: number;
    /** Total number of pages */
    totalPages: number;
  };
}

/**
 * Request parameters for downloading audit logs
 */
export interface DownloadAuditLogsRequest {
  /** Start date for filtering (ISO 8601) */
  from?: string;
  /** End date for filtering (ISO 8601) */
  to?: string;
  /** Format for the download */
  format?: 'csv' | 'json';
}

/**
 * Response metadata for audit logs download
 */
export interface DownloadAuditLogsResponse {
  /** Content type of the download */
  contentType: string;
  /** Size of the downloaded file in bytes */
  size?: number;
  /** Suggested filename for the download */
  filename?: string;
}
