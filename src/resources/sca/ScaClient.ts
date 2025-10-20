import { V2BaseClient } from '../../core/V2BaseClient.js';
import { createErrorFromResponse } from '../../errors/index.js';
import type {
  GetSbomReportV2Request,
  SbomReportV2Response,
  SbomMetadataV2,
  VulnerabilitySummaryV2,
  SbomDownloadOptions,
} from './types.js';

/**
 * Client for interacting with the SonarQube SCA (Software Composition Analysis) API v2.
 * This API provides Software Bill of Materials (SBOM) generation and dependency analysis.
 *
 * The SCA API is essential for:
 * - Security compliance and vulnerability management
 * - License compliance and risk assessment
 * - Supply chain security analysis
 * - Regulatory reporting (NTIA, EU Cyber Resilience Act)
 *
 * @since 10.6
 */
export class ScaClient extends V2BaseClient {
  /**
   * Generate SBOM report for a project in JSON format.
   * Returns structured data for programmatic use.
   *
   * @param params - SBOM report parameters
   * @returns Structured SBOM report data
   * @since 10.6
   *
   * @example
   * ```typescript
   * // Basic SBOM report
   * const sbom = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project'
   * });
   *
   * // SBOM with vulnerabilities for specific branch
   * const sbomWithVulns = await client.sca.getSbomReportV2({
   *   projectKey: 'my-project',
   *   branch: 'main',
   *   includeVulnerabilities: true,
   *   includeLicenses: true
   * });
   *
   * console.log(`Found ${sbom.components.length} components`);
   * console.log(`Found ${sbom.vulnerabilities?.length || 0} vulnerabilities`);
   * ```
   */
  async getSbomReportV2(params: GetSbomReportV2Request): Promise<SbomReportV2Response> {
    const query = this.buildV2Query({
      ...params,
      format: 'json', // Force JSON for typed response
    } as Record<string, unknown>);

    return this.request<SbomReportV2Response>(`/api/v2/sca/sbom-reports?${query}`, {
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /**
   * Download SBOM report in specified format.
   * Supports industry-standard formats like SPDX and CycloneDX.
   *
   * @param params - SBOM report parameters with format specification
   * @param options - Download options for large reports
   * @returns SBOM report as text or binary data
   * @since 10.6
   *
   * @example
   * ```typescript
   * // Download SPDX format report
   * const spdxReport = await client.sca.downloadSbomReportV2({
   *   projectKey: 'my-project',
   *   format: 'spdx-json',
   *   includeVulnerabilities: true
   * });
   *
   * // Save to file for compliance reporting
   * fs.writeFileSync('sbom-spdx.json', spdxReport);
   *
   * // Download with progress tracking
   * const cycloneDxReport = await client.sca.downloadSbomReportV2({
   *   projectKey: 'my-project',
   *   format: 'cyclonedx-json'
   * }, {
   *   onProgress: (progress) => {
   *     console.log(`Downloaded ${progress.percentage}%`);
   *   }
   * });
   * ```
   */
  async downloadSbomReportV2(
    params: GetSbomReportV2Request,
    options?: SbomDownloadOptions,
  ): Promise<string | Blob> {
    const format = params.format ?? 'json';
    const query = this.buildV2Query(params as unknown as Record<string, unknown>);

    // Determine content type based on format
    const isTextFormat = ['json', 'spdx-json', 'cyclonedx-json'].includes(format);

    if (isTextFormat) {
      // Return as text for JSON-based formats
      return this.requestText(`/api/v2/sca/sbom-reports?${query}`, {
        headers: {
          Accept: 'application/json',
        },
        ...(options?.signal ? { signal: options.signal } : {}),
      });
    } else {
      // Return as blob for binary formats (XML, RDF)
      return this.downloadWithProgress(`/api/v2/sca/sbom-reports?${query}`, options);
    }
  }

  /**
   * Get SBOM report generation status and metadata.
   * Useful for checking if a report is ready or still processing.
   *
   * @param params - Project identification parameters
   * @returns SBOM generation metadata
   * @since 10.6
   *
   * @example
   * ```typescript
   * const metadata = await client.sca.getSbomMetadataV2({
   *   projectKey: 'my-project',
   *   branch: 'main'
   * });
   *
   * console.log(`Components: ${metadata.analysis.totalComponents}`);
   * console.log(`Vulnerabilities: ${metadata.analysis.totalVulnerabilities}`);
   * ```
   */
  async getSbomMetadataV2(
    params: Pick<GetSbomReportV2Request, 'projectKey' | 'branch' | 'pullRequest'>,
  ): Promise<SbomMetadataV2> {
    const query = this.buildV2Query({
      ...params,
      metadataOnly: true,
    } as Record<string, unknown>);

    return this.request<SbomMetadataV2>(`/api/v2/sca/sbom-reports/metadata?${query}`);
  }

  /**
   * Stream large SBOM reports to avoid memory issues.
   * Recommended for projects with many dependencies.
   *
   * @param params - SBOM report parameters
   * @returns Readable stream of SBOM data
   * @since 10.6
   *
   * @example
   * ```typescript
   * const stream = await client.sca.streamSbomReportV2({
   *   projectKey: 'large-project',
   *   format: 'spdx-json'
   * });
   *
   * // Process stream chunk by chunk
   * const reader = stream.getReader();
   * while (true) {
   *   const { done, value } = await reader.read();
   *   if (done) break;
   *   // Process chunk
   * }
   * ```
   */
  async streamSbomReportV2(
    params: GetSbomReportV2Request,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const query = this.buildV2Query(params as unknown as Record<string, unknown>);

    let headers = new Headers();
    headers.set('Accept', 'application/octet-stream');
    headers = this.authProvider.applyAuth(headers);

    const response = await fetch(`${this.baseUrl}/api/v2/sca/sbom-reports?${query}`, {
      headers,
      signal: signal ?? null,
    });

    if (!response.ok) {
      throw await createErrorFromResponse(response);
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    return response.body;
  }

  /**
   * Get vulnerability summary for a project's dependencies.
   * Provides quick overview without full SBOM generation.
   *
   * @param params - Project identification parameters
   * @returns Vulnerability summary statistics
   * @since 10.6
   *
   * @example
   * ```typescript
   * const vulnSummary = await client.sca.getVulnerabilitySummaryV2({
   *   projectKey: 'my-project'
   * });
   *
   * console.log(`Critical: ${vulnSummary.critical}`);
   * console.log(`High: ${vulnSummary.high}`);
   * console.log(`Total: ${vulnSummary.total}`);
   *
   * // Show components with vulnerabilities
   * vulnSummary.byComponent.forEach(comp => {
   *   console.log(`${comp.componentName}: ${comp.vulnerabilityCount} vulns`);
   * });
   * ```
   */
  async getVulnerabilitySummaryV2(
    params: Pick<GetSbomReportV2Request, 'projectKey' | 'branch' | 'pullRequest'>,
  ): Promise<VulnerabilitySummaryV2> {
    const query = this.buildV2Query(params as unknown as Record<string, unknown>);

    return this.request<VulnerabilitySummaryV2>(`/api/v2/sca/vulnerabilities/summary?${query}`);
  }
}
