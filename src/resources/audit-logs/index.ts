/**
 * Audit Logs API module
 *
 * This module provides functionality for accessing and managing audit logs
 * in SonarQube Enterprise Edition. Audit logs provide a security audit trail
 * for tracking user activities and system changes.
 *
 * **Note**: Only available in SonarQube Enterprise Edition
 *
 * @since SonarQube 8.1 (Enterprise Edition only)
 * @module audit-logs
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Check if audit logs are available (Enterprise Edition)
 * const isAvailable = await client.auditLogs.isAvailable();
 *
 * if (isAvailable) {
 *   // Search for login events
 *   const loginEvents = await client.auditLogs.search({
 *     category: 'AUTH',
 *     action: 'LOGIN',
 *     from: '2024-01-01T00:00:00Z'
 *   });
 *
 *   // Download audit logs as CSV
 *   const csvData = await client.auditLogs.download({
 *     format: 'csv',
 *     from: '2024-01-01T00:00:00Z',
 *     to: '2024-01-31T23:59:59Z'
 *   });
 * }
 * ```
 */

// Export the client
export { AuditLogsClient } from './AuditLogsClient.js';

// Export all types
export type {
  AuditEventCategory,
  AuditEventAction,
  AuditLogEntry,
  SearchAuditLogsRequest,
  SearchAuditLogsResponse,
  DownloadAuditLogsRequest,
  DownloadAuditLogsResponse,
} from './types.js';
