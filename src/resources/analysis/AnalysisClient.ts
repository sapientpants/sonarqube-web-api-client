/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BaseClient } from '../../core/BaseClient';
import type {
  GetActiveRulesV2Request,
  GetActiveRulesV2Response,
  EngineMetadataV2,
  GetJresV2Response,
  JreMetadataV2,
  VersionV2Response,
  DownloadOptions,
  DownloadProgress,
} from './types';

/**
 * Client for interacting with the SonarQube Analysis API v2.
 * This API provides scanner management and project analysis functionality.
 *
 * @since 10.3
 */
export class AnalysisClient extends BaseClient {
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
  async downloadEngineV2(options?: DownloadOptions): Promise<Blob> {
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
  async downloadJreV2(id: string, options?: DownloadOptions): Promise<Blob> {
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

  /**
   * Download a file with progress tracking support.
   *
   * @param url - URL to download from
   * @param options - Download options
   * @returns Downloaded content as Blob
   * @private
   */
  private async downloadWithProgress(url: string, options?: DownloadOptions): Promise<Blob> {
    const headers: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/octet-stream',
    };

    if (this.token.length > 0) {
      Object.assign(headers, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${this.token}`,
      });
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${url}`, {
        headers,
        signal: options?.signal ?? null,
      });
    } catch (networkError: unknown) {
      const { createNetworkError } = await import('../../errors');
      throw createNetworkError(networkError);
    }

    if (!response.ok) {
      const { createErrorFromResponse } = await import('../../errors');
      throw await createErrorFromResponse(response);
    }

    // If no progress callback or no content length, just return blob
    const contentLengthHeader = response.headers.get('content-length');
    if (!options?.onProgress || contentLengthHeader === null || contentLengthHeader === '') {
      return response.blob();
    }

    // Stream the response for progress tracking
    const contentLength = parseInt(contentLengthHeader, 10);
    const reader = response.body?.getReader();

    if (!reader) {
      return response.blob();
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    try {
      let done = false;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (!done) {
        const result = await reader.read();

        if (result.done) {
          done = true;
          break;
        }

        if (result.value !== undefined && result.value instanceof Uint8Array) {
          const { value } = result;
          chunks.push(value);
          loaded += value.length;
        }

        const progress: DownloadProgress = {
          loaded,
          total: contentLength,
          percentage: contentLength > 0 ? Math.round((loaded / contentLength) * 100) : 0,
        };

        options.onProgress(progress);
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks into a single blob
    return new Blob(chunks);
  }
}
