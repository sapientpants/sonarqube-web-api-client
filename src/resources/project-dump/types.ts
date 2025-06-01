/**
 * Types for SonarQube Project Dump API
 *
 * Project export/import functionality for backup and restore operations.
 *
 * @since SonarQube 1.0
 */

/**
 * Request to export a project dump
 */
export interface ExportProjectDumpRequest {
  /**
   * Project key to export
   */
  key: string;
}

/**
 * Request to import a project dump
 */
export interface ImportProjectDumpRequest {
  /**
   * Project key where the dump should be imported
   */
  key: string;

  /**
   * The project dump file to import
   */
  file?: File | Blob;
}
