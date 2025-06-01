/**
 * Project Dump API module
 *
 * This module provides functionality for project backup and restore operations
 * through export and import capabilities.
 *
 * **Note**: Only available in SonarQube Enterprise Edition (not SonarCloud) and requires
 * Administer permission on the project.
 *
 * @since SonarQube 1.0
 * @module project-dump
 *
 * @example
 * ```typescript
 * import { SonarQubeClient } from 'sonarqube-web-api-client';
 *
 * const client = new SonarQubeClient('https://sonarqube.example.com', 'token');
 *
 * // Export a project for backup
 * await client.projectDump.export({
 *   key: 'my-project-key'
 * });
 *
 * // Import a project from backup
 * const file = new File([dumpData], 'project-dump.zip');
 * await client.projectDump.import({
 *   key: 'target-project-key',
 *   file: file
 * });
 * ```
 */

// Export the client
export { ProjectDumpClient } from './ProjectDumpClient';

// Export all types
export type {
  ExportProjectDumpRequest,
  ExportProjectDumpResponse,
  ImportProjectDumpRequest,
  ImportProjectDumpResponse,
} from './types';
