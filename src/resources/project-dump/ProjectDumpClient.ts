import { BaseClient } from '../../core/BaseClient';
import type { ExportProjectDumpRequest, ImportProjectDumpRequest } from './types';

/**
 * Client for SonarQube Project Dump API
 *
 * Provides project export/import functionality for backup and restore operations.
 *
 * **Note**: Only available in SonarQube Enterprise Edition (not SonarCloud) and requires
 * Administer permission on the project.
 *
 * @since SonarQube 1.0
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Export a project
 * await client.projectDump.export({
 *   key: 'my-project-key'
 * });
 *
 * // Import a project dump
 * const file = new File([dumpData], 'project-dump.zip');
 * await client.projectDump.import({
 *   key: 'target-project-key',
 *   file: file
 * });
 * ```
 */
export class ProjectDumpClient extends BaseClient {
  /**
   * Triggers project dump so that the project can be imported later.
   *
   * This endpoint creates a complete backup of the specified project including
   * all its analysis data, settings, and metadata.
   *
   * **Requires**: Administer permission on the project
   * **Note**: Only available in SonarQube Enterprise Edition
   *
   * @param request - The project export request
   * @returns Promise that resolves when export is triggered
   *
   * @since SonarQube 1.0
   *
   * @example
   * ```typescript
   * // Export a project for backup
   * await client.projectDump.export({
   *   key: 'my-project-key'
   * });
   * ```
   */
  async export(request: ExportProjectDumpRequest): Promise<undefined> {
    const formData = new URLSearchParams();
    formData.append('key', request.key);

    return this.request<undefined>('/api/project_dump/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  }

  /**
   * Triggers the import of a project dump.
   *
   * This endpoint restores a project from a previously exported dump file,
   * including all its analysis data, settings, and metadata.
   *
   * **Requires**: Administer permission on the target project
   *
   * @param request - The project import request
   * @returns Promise that resolves when import is triggered
   *
   * @since SonarQube 1.0
   *
   * @example
   * ```typescript
   * // Import a project from a dump file
   * const file = new File([dumpData], 'project-dump.zip');
   * await client.projectDump.import({
   *   key: 'target-project-key',
   *   file: file
   * });
   * ```
   */
  async import(request: ImportProjectDumpRequest): Promise<undefined> {
    const formData = new FormData();
    formData.append('key', request.key);

    if (request.file) {
      formData.append('file', request.file);
    }

    await this.request<string>('/api/project_dump/import', {
      method: 'POST',
      body: formData,
      responseType: 'text',
    });

    // Return undefined for empty responses (204 No Content)
    return undefined;
  }
}
