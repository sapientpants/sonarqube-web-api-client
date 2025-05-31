import { V2BaseClient } from '../../core/V2BaseClient';
import type {
  GetActiveRulesV2Request,
  GetActiveRulesV2Response,
  EngineMetadataV2,
  GetJresV2Response,
  JreMetadataV2,
  VersionV2Response,
} from './types';

/**
 * Client for interacting with the SonarQube Analysis API v2.
 * This API provides scanner management and project analysis functionality.
 *
 * @since 10.3
 */
export class AnalysisClient extends V2BaseClient {
  /**
   * Get all active rules for a specific project.
   * These are the rules that will be applied during analysis.
   *
   * @param params - Request parameters
   * @returns Active rules for the project
   * @since 10.3
   *
   * @example
   * ```typescript
   * // Get active rules for a project
   * const rules = await client.analysis.getActiveRulesV2({
   *   projectKey: 'my-project'
   * });
   *
   * // Get active rules for a specific branch
   * const branchRules = await client.analysis.getActiveRulesV2({
   *   projectKey: 'my-project',
   *   branch: 'feature/new-feature'
   * });
   * ```
   */
  async getActiveRulesV2(params: GetActiveRulesV2Request): Promise<GetActiveRulesV2Response> {
    const queryString = this.buildV2Query(params as unknown as Record<string, unknown>);
    return this.request<GetActiveRulesV2Response>(`/api/v2/analysis/active_rules?${queryString}`);
  }

  /**
   * Get scanner engine metadata.
   *
   * @returns Engine metadata including filename and checksum
   * @since 10.3
   *
   * @example
   * ```typescript
   * const metadata = await client.analysis.getEngineMetadataV2();
   * console.log(`Engine: ${metadata.filename}`);
   * console.log(`SHA256: ${metadata.sha256}`);
   * ```
   */
  async getEngineMetadataV2(): Promise<EngineMetadataV2> {
    return this.request<EngineMetadataV2>('/api/v2/analysis/engine', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Download scanner engine binary.
   *
   * @param options - Download options
   * @returns Engine JAR file as Blob
   * @since 10.3
   *
   * @example
   * ```typescript
   * // Simple download
   * const blob = await client.analysis.downloadEngineV2();
   *
   * // Download with progress tracking
   * const blob = await client.analysis.downloadEngineV2({
   *   onProgress: (progress) => {
   *     console.log(`Downloaded ${progress.percentage}%`);
   *   }
   * });
   *
   * // Save to file (Node.js)
   * const buffer = await blob.arrayBuffer();
   * fs.writeFileSync('sonar-scanner-engine.jar', Buffer.from(buffer));
   * ```
   */
  async downloadEngineV2(
    options?: Parameters<V2BaseClient['downloadWithProgress']>[1]
  ): Promise<Blob> {
    return this.downloadWithProgress('/api/v2/analysis/engine', options);
  }

  /**
   * Get all available JREs metadata.
   *
   * @returns List of available JREs for different platforms
   * @since 10.3
   *
   * @example
   * ```typescript
   * const response = await client.analysis.getAllJresMetadataV2();
   *
   * // Find JRE for current platform
   * const currentPlatformJre = response.jres.find(jre =>
   *   jre.os === process.platform && jre.arch === process.arch
   * );
   * ```
   */
  async getAllJresMetadataV2(): Promise<GetJresV2Response> {
    return this.request<GetJresV2Response>('/api/v2/analysis/jres');
  }

  /**
   * Get specific JRE metadata.
   *
   * @param id - JRE identifier
   * @returns JRE metadata
   * @since 10.3
   *
   * @example
   * ```typescript
   * const metadata = await client.analysis.getJreMetadataV2('jre-17-linux-x64');
   * console.log(`JRE: ${metadata.filename}`);
   * console.log(`Version: ${metadata.version}`);
   * ```
   */
  async getJreMetadataV2(id: string): Promise<JreMetadataV2> {
    return this.request<JreMetadataV2>(`/api/v2/analysis/jres/${id}`, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * Download specific JRE binary.
   *
   * @param id - JRE identifier
   * @param options - Download options
   * @returns JRE archive as Blob
   * @since 10.3
   *
   * @example
   * ```typescript
   * // Download JRE with progress
   * const blob = await client.analysis.downloadJreV2('jre-17-linux-x64', {
   *   onProgress: (progress) => {
   *     console.log(`${progress.loaded} / ${progress.total} bytes`);
   *   }
   * });
   * ```
   */
  async downloadJreV2(
    id: string,
    options?: Parameters<V2BaseClient['downloadWithProgress']>[1]
  ): Promise<Blob> {
    return this.downloadWithProgress(`/api/v2/analysis/jres/${id}`, options);
  }

  /**
   * Get server version information.
   * This endpoint may work without authentication for public instances.
   *
   * @returns Server version details
   * @since 10.3
   *
   * @example
   * ```typescript
   * const version = await client.analysis.getVersionV2();
   * console.log(`SonarQube ${version.version}`);
   * console.log(`Build: ${version.buildNumber}`);
   * ```
   */
  async getVersionV2(): Promise<VersionV2Response> {
    return this.request<VersionV2Response>('/api/v2/analysis/version');
  }
}
