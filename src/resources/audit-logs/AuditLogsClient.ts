import { BaseClient } from '../../core/BaseClient';
import type {
  SearchAuditLogsRequest,
  SearchAuditLogsResponse,
  DownloadAuditLogsRequest,
  AuditLogEntry,
} from './types';

/**
 * Client for managing SonarQube audit logs
 *
 * **Note**: Only available in SonarQube Enterprise Edition.
 * Audit logs provide security audit trail functionality for tracking
 * user activities and system changes.
 *
 * @since SonarQube 8.1 (Enterprise Edition only)
 */
export class AuditLogsClient extends BaseClient {
  /**
   * Search audit logs with optional filtering.
   * Requires 'Administer System' permission.
   *
   * @param request - Search parameters
   * @returns Promise that resolves to the audit logs search results
   * @throws {AuthorizationError} If user lacks system administration permission
   * @throws {ApiError} If running on Community Edition (audit logs not available)
   *
   * @example
   * ```typescript
   * // Search all audit logs
   * const results = await client.auditLogs.search({});
   *
   * // Search login events for a specific user
   * const loginEvents = await client.auditLogs.search({
   *   category: 'AUTH',
   *   action: 'LOGIN',
   *   userLogin: 'john.doe'
   * });
   *
   * // Search events within date range
   * const recentEvents = await client.auditLogs.search({
   *   from: '2024-01-01T00:00:00Z',
   *   to: '2024-01-31T23:59:59Z',
   *   page: 1,
   *   pageSize: 100
   * });
   * ```
   */
  async search(request: SearchAuditLogsRequest = {}): Promise<SearchAuditLogsResponse> {
    const params = new URLSearchParams();

    if (request.category !== undefined) {
      params.append('category', request.category);
    }

    if (request.action !== undefined) {
      params.append('action', request.action);
    }

    if (request.userLogin !== undefined) {
      params.append('userLogin', request.userLogin);
    }

    if (request.from !== undefined) {
      params.append('from', request.from);
    }

    if (request.to !== undefined) {
      params.append('to', request.to);
    }

    if (request.page !== undefined) {
      params.append('page', String(request.page));
    }

    if (request.pageSize !== undefined) {
      params.append('pageSize', String(request.pageSize));
    }

    const queryString = params.toString();
    const url = queryString ? `/api/audit_logs/search?${queryString}` : '/api/audit_logs/search';

    return this.request<SearchAuditLogsResponse>(url);
  }

  /**
   * Convenience method to iterate through all audit logs.
   * This automatically handles pagination for large result sets.
   *
   * @param request - Search parameters (pagination parameters will be ignored)
   * @returns An async iterator for all audit log entries
   * @throws {AuthorizationError} If user lacks system administration permission
   * @throws {ApiError} If running on Community Edition (audit logs not available)
   *
   * @example
   * ```typescript
   * // Iterate through all audit logs
   * for await (const auditLog of client.auditLogs.searchAll()) {
   *   console.log(`${auditLog.timestamp}: ${auditLog.action} by ${auditLog.userLogin}`);
   * }
   *
   * // Iterate through filtered audit logs
   * for await (const auditLog of client.auditLogs.searchAll({
   *   category: 'AUTH',
   *   from: '2024-01-01T00:00:00Z'
   * })) {
   *   console.log(`Auth event: ${auditLog.action}`);
   * }
   * ```
   */
  async *searchAll(
    request: Omit<SearchAuditLogsRequest, 'page' | 'pageSize'> = {}
  ): AsyncIterableIterator<AuditLogEntry> {
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.search({
        ...request,
        page: currentPage,
        pageSize: 500, // Maximum page size
      });

      for (const auditLog of response.auditLogs) {
        yield auditLog;
      }

      hasMore = currentPage < response.page.totalPages;
      currentPage++;
    }
  }

  /**
   * Download audit logs as a file.
   * Requires 'Administer System' permission.
   *
   * @param request - Download parameters
   * @returns Promise that resolves to the file content and metadata
   * @throws {AuthorizationError} If user lacks system administration permission
   * @throws {ApiError} If running on Community Edition (audit logs not available)
   *
   * @example
   * ```typescript
   * // Download all audit logs as CSV
   * const csvData = await client.auditLogs.download({
   *   format: 'csv'
   * });
   *
   * // Download audit logs for specific date range as JSON
   * const jsonData = await client.auditLogs.download({
   *   from: '2024-01-01T00:00:00Z',
   *   to: '2024-01-31T23:59:59Z',
   *   format: 'json'
   * });
   *
   * // Save to file
   * const fs = require('fs');
   * fs.writeFileSync(jsonData.filename || 'audit-logs.json', await csvData.blob());
   * ```
   */
  async download(request: DownloadAuditLogsRequest = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (request.from !== undefined) {
      params.append('from', request.from);
    }

    if (request.to !== undefined) {
      params.append('to', request.to);
    }

    if (request.format !== undefined) {
      params.append('format', request.format);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/api/audit_logs/download?${queryString}`
      : '/api/audit_logs/download';

    return this.request<Blob>(url, { responseType: 'blob' });
  }

  /**
   * Check if audit logs are available on this SonarQube instance.
   * This method can be used to verify if the instance supports audit logs
   * (i.e., is running Enterprise Edition).
   *
   * @returns Promise that resolves to true if audit logs are available
   *
   * @example
   * ```typescript
   * const isAvailable = await client.auditLogs.isAvailable();
   * if (isAvailable) {
   *   console.log('Audit logs are available on this instance');
   * } else {
   *   console.log('Audit logs are not available (Community Edition)');
   * }
   * ```
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to make a minimal request to check if the endpoint exists
      await this.search({ pageSize: 1 });
      return true;
    } catch {
      // If we get a 404 or similar error, audit logs are not available
      return false;
    }
  }
}
