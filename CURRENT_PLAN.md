# Current Implementation Plan: SCA v2 API (Software Composition Analysis)

## Overview

This document outlines the comprehensive plan to implement the SCA v2 API, which provides Software Bill of Materials (SBOM) generation and vulnerability analysis for software composition analysis. This is the next high-priority item from the V2_API_IMPLEMENTATION_STATUS_AND_PLAN.md.

The SCA API is critical for security and compliance workflows that enable:
- Software Bill of Materials (SBOM) report generation
- Dependency vulnerability tracking
- License compliance monitoring
- Security supply chain management
- Regulatory compliance reporting (NTIA, EU Cyber Resilience Act)

## Timeline: 4 Days

### Phase 0: Research & Design (Day 1)

#### 1. API Endpoint Analysis

The SCA v2 API consists of 1 primary endpoint with multiple format options:

```
GET /api/v2/sca/sbom-reports - Get a software bill of materials (SBOM) report
```

**Key Parameters:**
- `projectKey` (required) - Project identifier
- `branch` (optional) - Specific branch analysis
- `pullRequest` (optional) - PR-specific analysis  
- `format` (optional) - Output format: 'json', 'spdx', 'cyclonedx'
- `includeVulnerabilities` (optional) - Include vulnerability data
- `includeLicenses` (optional) - Include license information
- `componentTypes` (optional) - Filter by component types

#### 2. Unique Challenges

- **Large Response Sizes**: SBOM reports can be several MB for complex projects
- **Multiple Formats**: Support for JSON, SPDX (JSON/RDF), CycloneDX formats
- **Streaming Support**: Large reports need streaming to avoid memory issues
- **Complex Data Models**: Rich component relationships and vulnerability data
- **Caching**: Reports are expensive to generate, need intelligent caching
- **Security Context**: Contains sensitive dependency and vulnerability information

#### 3. Industry Standards

**SPDX (Software Package Data Exchange)**
- ISO/IEC 5962:2021 international standard
- Supports JSON, YAML, RDF/XML, Tag formats
- Industry-standard for software composition data

**CycloneDX**
- OWASP-backed standard
- JSON and XML formats
- Designed for application security use cases
- Built-in vulnerability and dependency tracking

### Phase 1: Type System Design (Day 1-2)

#### 1. Core Request/Response Types

```typescript
// Request Types
export interface GetSbomReportV2Request {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  format?: SbomFormat;
  includeVulnerabilities?: boolean;
  includeLicenses?: boolean;
  componentTypes?: ComponentType[];
}

export type SbomFormat = 'json' | 'spdx-json' | 'spdx-rdf' | 'cyclonedx-json' | 'cyclonedx-xml';
export type ComponentType = 'library' | 'application' | 'framework' | 'operating-system' | 'device' | 'file';

// Core SBOM Response (JSON format)
export interface SbomReportV2Response {
  /** SBOM document metadata */
  document: SbomDocumentV2;
  /** Software components inventory */
  components: SbomComponentV2[];
  /** Component dependencies and relationships */
  dependencies: SbomDependencyV2[];
  /** Vulnerability information (if requested) */
  vulnerabilities?: SbomVulnerabilityV2[];
  /** License information (if requested) */
  licenses?: SbomLicenseV2[];
  /** Report generation metadata */
  metadata: SbomMetadataV2;
}
```

#### 2. Document and Metadata Types

```typescript
export interface SbomDocumentV2 {
  /** Unique SBOM document identifier */
  id: string;
  /** SBOM specification version */
  specVersion: string;
  /** Document creation timestamp */
  createdAt: string;
  /** SonarQube instance information */
  creator: {
    tool: string;
    version: string;
    vendor: 'SonarSource';
  };
  /** Main component being analyzed */
  primaryComponent: SbomComponentV2;
}

export interface SbomMetadataV2 {
  /** Project information */
  project: {
    key: string;
    name: string;
    branch?: string;
    pullRequest?: string;
  };
  /** Analysis context */
  analysis: {
    analysisId: string;
    completedAt: string;
    totalComponents: number;
    totalVulnerabilities?: number;
    totalLicenses?: number;
  };
  /** Report generation settings */
  generation: {
    format: SbomFormat;
    includeVulnerabilities: boolean;
    includeLicenses: boolean;
    requestedAt: string;
    generatedAt: string;
  };
}
```

#### 3. Component and Dependency Types

```typescript
export interface SbomComponentV2 extends V2Resource {
  /** Component name */
  name: string;
  /** Component type classification */
  type: ComponentType;
  /** Package manager or ecosystem */
  ecosystem: string;
  /** Component version */
  version: string;
  /** Package URL (PURL) */
  purl?: string;
  /** Package manager coordinates */
  coordinates: {
    groupId?: string;
    artifactId?: string;
    namespace?: string;
    name: string;
    version: string;
  };
  /** Component scope in the project */
  scope: 'required' | 'optional' | 'excluded';
  /** Source information */
  source?: {
    repository?: string;
    downloadUrl?: string;
    homepage?: string;
  };
  /** File information (for file-based components) */
  files?: Array<{
    path: string;
    checksum: string;
    size: number;
  }>;
  /** License information */
  licenses?: string[];
  /** Component description */
  description?: string;
  /** Copyright information */
  copyright?: string;
}

export interface SbomDependencyV2 {
  /** Reference to the dependent component */
  componentId: string;
  /** References to dependency components */
  dependsOn: string[];
  /** Dependency scope */
  scope: 'compile' | 'runtime' | 'test' | 'provided' | 'import';
  /** Dependency relationship type */
  relationship: 'direct' | 'transitive';
  /** Optional dependency indicator */
  optional: boolean;
}
```

#### 4. Security and License Types

```typescript
export interface SbomVulnerabilityV2 {
  /** Vulnerability identifier (CVE, etc.) */
  id: string;
  /** Vulnerability source */
  source: 'NVD' | 'OSV' | 'GHSA' | 'SONAR';
  /** CVSS score information */
  cvss?: {
    version: '2.0' | '3.0' | '3.1';
    score: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    vector?: string;
  };
  /** Vulnerability summary */
  summary: string;
  /** Vulnerability description */
  description?: string;
  /** Publication and update dates */
  dates: {
    published: string;
    updated?: string;
  };
  /** Affected components */
  affects: Array<{
    componentId: string;
    versionRange: string;
  }>;
  /** Available fixes */
  fixes?: Array<{
    version: string;
    description?: string;
  }>;
  /** Reference URLs */
  references?: Array<{
    type: 'advisory' | 'fix' | 'report' | 'web';
    url: string;
  }>;
}

export interface SbomLicenseV2 {
  /** SPDX license identifier */
  spdxId?: string;
  /** License name */
  name: string;
  /** License text or URL */
  text?: string;
  url?: string;
  /** OSI approved indicator */
  osiApproved?: boolean;
  /** License category */
  category: 'permissive' | 'copyleft' | 'proprietary' | 'public-domain' | 'unknown';
  /** Risk level for compliance */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Components using this license */
  components: string[];
}
```

#### 5. Response Format Handling

```typescript
// Different response types based on format
export type SbomResponseV2 = 
  | SbomReportV2Response  // JSON format
  | string               // SPDX/CycloneDX as text
  | Blob                 // Binary formats

export interface SbomDownloadOptions {
  /** Progress tracking for large reports */
  onProgress?: (progress: DownloadProgress) => void;
  /** Request timeout */
  timeout?: number;
  /** Abort signal */
  signal?: AbortSignal;
}
```

### Phase 2: Client Implementation (Day 2-3)

#### 1. Create ScaClient Structure

```
src/resources/sca/
├── ScaClient.ts
├── types.ts  
├── index.ts
└── __tests__/
    └── ScaClient.test.ts
```

#### 2. Implementation Strategy

```typescript
/**
 * Client for interacting with the SonarQube SCA (Software Composition Analysis) API v2.
 * This API provides Software Bill of Materials (SBOM) generation and dependency analysis.
 *
 * @since 10.6
 */
export class ScaClient extends BaseClient {
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
   * ```
   */
  async getSbomReportV2(params: GetSbomReportV2Request): Promise<SbomReportV2Response> {
    const query = this.buildV2Query({
      ...params,
      format: 'json' // Force JSON for typed response
    } as Record<string, unknown>);
    
    return this.request<SbomReportV2Response>(`/api/v2/sca/sbom-reports?${query}`, {
      headers: { 
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: 'application/json' 
      }
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
    options?: SbomDownloadOptions
  ): Promise<string | Blob> {
    const format = params.format || 'json';
    const query = this.buildV2Query(params as Record<string, unknown>);
    
    // Determine content type based on format
    const isTextFormat = ['json', 'spdx-json', 'cyclonedx-json'].includes(format);
    const acceptHeader = isTextFormat ? 'application/json' : 'application/octet-stream';
    
    if (isTextFormat) {
      // Return as text for JSON-based formats
      return this.requestText(`/api/v2/sca/sbom-reports?${query}`, {
        headers: { 
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Accept: acceptHeader 
        },
        signal: options?.signal
      });
    } else {
      // Return as blob for binary formats
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
  async getSbomMetadataV2(params: Pick<GetSbomReportV2Request, 'projectKey' | 'branch' | 'pullRequest'>): Promise<SbomMetadataV2> {
    const query = this.buildV2Query({
      ...params,
      metadataOnly: true
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
  async streamSbomReportV2(params: GetSbomReportV2Request): Promise<ReadableStream<Uint8Array>> {
    const query = this.buildV2Query(params as Record<string, unknown>);
    
    const response = await fetch(`${this.baseUrl}/api/v2/sca/sbom-reports?${query}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const { createErrorFromResponse } = await import('../../errors');
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
   * ```
   */
  async getVulnerabilitySummaryV2(params: Pick<GetSbomReportV2Request, 'projectKey' | 'branch' | 'pullRequest'>): Promise<VulnerabilitySummaryV2> {
    const query = this.buildV2Query(params as Record<string, unknown>);
    
    return this.request<VulnerabilitySummaryV2>(`/api/v2/sca/vulnerabilities/summary?${query}`);
  }

  // Helper methods
  private async requestText(url: string, options?: RequestInit): Promise<string> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers
      }
    });

    if (!response.ok) {
      const { createErrorFromResponse } = await import('../../errors');
      throw await createErrorFromResponse(response);
    }

    return response.text();
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.token.length > 0) {
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${this.token}`
      };
    }
    return {};
  }
}
```

#### 3. Additional Helper Types

```typescript
export interface VulnerabilitySummaryV2 {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byComponent: Array<{
    componentId: string;
    componentName: string;
    vulnerabilityCount: number;
    highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```

### Phase 3: Testing Strategy (Day 3)

#### 1. Unit Tests Structure

```typescript
describe('ScaClient', () => {
  describe('getSbomReportV2', () => {
    it('should fetch SBOM report for a project');
    it('should handle branch parameter');
    it('should handle pull request parameter');
    it('should include vulnerabilities when requested');
    it('should include licenses when requested');
    it('should filter by component types');
    it('should handle empty dependency reports');
    it('should handle authentication errors');
  });

  describe('downloadSbomReportV2', () => {
    it('should download SBOM in JSON format');
    it('should download SBOM in SPDX JSON format');
    it('should download SBOM in CycloneDX format');
    it('should download SBOM in binary formats');
    it('should track download progress for large reports');
    it('should handle download timeouts');
    it('should support abort signals');
  });

  describe('getSbomMetadataV2', () => {
    it('should fetch report metadata');
    it('should show component and vulnerability counts');
    it('should handle missing reports');
  });

  describe('streamSbomReportV2', () => {
    it('should return readable stream');
    it('should handle streaming errors');
    it('should support all formats');
  });

  describe('getVulnerabilitySummaryV2', () => {
    it('should return vulnerability counts by severity');
    it('should list vulnerable components');
    it('should handle projects with no vulnerabilities');
  });
});
```

#### 2. MSW Handlers for Complex Responses

```typescript
// Mock SBOM report response
const mockSbomReport: SbomReportV2Response = {
  document: {
    id: 'sbom-my-project-main-20250130',
    specVersion: '2.3',
    createdAt: '2025-01-30T10:00:00Z',
    creator: {
      tool: 'SonarQube',
      version: '10.6.0',
      vendor: 'SonarSource'
    },
    primaryComponent: {
      id: 'my-project',
      name: 'My Project',
      type: 'application',
      ecosystem: 'maven',
      version: '1.0.0',
      coordinates: {
        groupId: 'com.example',
        artifactId: 'my-project',
        name: 'my-project',
        version: '1.0.0'
      },
      scope: 'required'
    }
  },
  components: [
    {
      id: 'junit-junit-4.13.2',
      name: 'junit',
      type: 'library',
      ecosystem: 'maven',
      version: '4.13.2',
      purl: 'pkg:maven/junit/junit@4.13.2',
      coordinates: {
        groupId: 'junit',
        artifactId: 'junit',
        name: 'junit',
        version: '4.13.2'
      },
      scope: 'required',
      licenses: ['EPL-1.0'],
      description: 'JUnit testing framework'
    }
  ],
  dependencies: [
    {
      componentId: 'my-project',
      dependsOn: ['junit-junit-4.13.2'],
      scope: 'test',
      relationship: 'direct',
      optional: false
    }
  ],
  vulnerabilities: [
    {
      id: 'CVE-2020-15250',
      source: 'NVD',
      cvss: {
        version: '3.1',
        score: 5.5,
        severity: 'MEDIUM',
        vector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H'
      },
      summary: 'JUnit4 vulnerable to temp directory hijacking',
      description: 'JUnit4 writes temporary files to the system temporary directory...',
      dates: {
        published: '2020-10-12T13:15:00Z',
        updated: '2021-07-21T11:39:00Z'
      },
      affects: [
        {
          componentId: 'junit-junit-4.13.2',
          versionRange: '< 4.13.1'
        }
      ],
      fixes: [
        {
          version: '4.13.1',
          description: 'Fixed temporary directory handling'
        }
      ],
      references: [
        {
          type: 'advisory',
          url: 'https://github.com/junit-team/junit4/security/advisories/GHSA-269g-pwp5-87pp'
        }
      ]
    }
  ],
  licenses: [
    {
      spdxId: 'EPL-1.0',
      name: 'Eclipse Public License 1.0',
      url: 'https://opensource.org/licenses/EPL-1.0',
      osiApproved: true,
      category: 'copyleft',
      riskLevel: 'MEDIUM',
      components: ['junit-junit-4.13.2']
    }
  ],
  metadata: {
    project: {
      key: 'my-project',
      name: 'My Project',
      branch: 'main'
    },
    analysis: {
      analysisId: 'analysis-123',
      completedAt: '2025-01-30T09:45:00Z',
      totalComponents: 25,
      totalVulnerabilities: 3,
      totalLicenses: 8
    },
    generation: {
      format: 'json',
      includeVulnerabilities: true,
      includeLicenses: true,
      requestedAt: '2025-01-30T10:00:00Z',
      generatedAt: '2025-01-30T10:00:05Z'
    }
  }
};

// MSW handlers
http.get('*/api/v2/sca/sbom-reports', ({ request }) => {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  const acceptHeader = request.headers.get('accept');

  if (format === 'json' || acceptHeader?.includes('application/json')) {
    return HttpResponse.json(mockSbomReport);
  } else if (format === 'spdx-json') {
    // Return SPDX-formatted JSON
    return HttpResponse.text(JSON.stringify(convertToSpdx(mockSbomReport)), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (format === 'cyclonedx-json') {
    // Return CycloneDX-formatted JSON
    return HttpResponse.text(JSON.stringify(convertToCycloneDx(mockSbomReport)), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // Return binary format
    return new HttpResponse(new ArrayBuffer(1024), {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }
});
```

#### 3. Integration Testing Considerations

- Test large SBOM report generation (1000+ components)
- Test streaming functionality with mock large responses
- Test vulnerability filtering and sorting
- Test license compliance scenarios
- Test error handling for missing projects
- Test authentication requirements
- Test format conversion accuracy

### Phase 4: Advanced Features & Polish (Day 4)

#### 1. SBOM Format Converters

```typescript
// Utility functions for format conversion
export class SbomFormatConverter {
  /**
   * Convert SonarQube SBOM to SPDX format
   */
  static toSpdx(sbom: SbomReportV2Response): SPDXDocument {
    return {
      spdxVersion: 'SPDX-2.3',
      creationInfo: {
        created: sbom.document.createdAt,
        creators: [`Tool: ${sbom.document.creator.tool}`]
      },
      name: sbom.document.primaryComponent.name,
      packages: sbom.components.map(component => ({
        SPDXID: `SPDXRef-${component.id}`,
        name: component.name,
        versionInfo: component.version,
        downloadLocation: component.source?.downloadUrl || 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: component.licenses?.[0] || 'NOASSERTION',
        copyrightText: component.copyright || 'NOASSERTION'
      })),
      relationships: sbom.dependencies.map(dep => ({
        spdxElementId: `SPDXRef-${dep.componentId}`,
        relationshipType: 'DEPENDS_ON',
        relatedSpdxElement: dep.dependsOn.map(id => `SPDXRef-${id}`)
      }))
    };
  }

  /**
   * Convert SonarQube SBOM to CycloneDX format
   */
  static toCycloneDx(sbom: SbomReportV2Response): CycloneDXDocument {
    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${sbom.document.id}`,
      version: 1,
      metadata: {
        timestamp: sbom.document.createdAt,
        tools: [{
          vendor: sbom.document.creator.vendor,
          name: sbom.document.creator.tool,
          version: sbom.document.creator.version
        }],
        component: {
          type: 'application',
          name: sbom.document.primaryComponent.name,
          version: sbom.document.primaryComponent.version
        }
      },
      components: sbom.components.map(component => ({
        type: component.type,
        name: component.name,
        version: component.version,
        purl: component.purl,
        licenses: component.licenses?.map(license => ({ license: { id: license } })),
        externalReferences: component.source ? [{
          type: 'website',
          url: component.source.homepage || component.source.repository || ''
        }] : undefined
      })),
      dependencies: sbom.dependencies.map(dep => ({
        ref: dep.componentId,
        dependsOn: dep.dependsOn
      })),
      vulnerabilities: sbom.vulnerabilities?.map(vuln => ({
        id: vuln.id,
        source: { name: vuln.source },
        ratings: vuln.cvss ? [{
          source: { name: vuln.source },
          score: vuln.cvss.score,
          severity: vuln.cvss.severity.toLowerCase(),
          method: `CVSSv${vuln.cvss.version}`,
          vector: vuln.cvss.vector
        }] : undefined,
        description: vuln.description,
        published: vuln.dates.published,
        updated: vuln.dates.updated,
        affects: vuln.affects.map(affect => ({
          ref: affect.componentId,
          versions: [{ version: affect.versionRange }]
        }))
      }))
    };
  }
}
```

#### 2. Caching and Performance Optimizations

```typescript
export interface SbomCacheOptions {
  /** Cache duration in milliseconds */
  ttl?: number;
  /** Cache key prefix */
  keyPrefix?: string;
  /** Enable/disable caching */
  enabled?: boolean;
}

export class SbomCache {
  private cache = new Map<string, { data: any; expires: number }>();

  generateKey(params: GetSbomReportV2Request): string {
    const key = `${params.projectKey}-${params.branch || 'main'}-${params.pullRequest || ''}-${params.format || 'json'}`;
    return key.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  set<T>(key: string, data: T, ttl = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }
}
```

#### 3. Component Analysis Utilities

```typescript
export class SbomAnalyzer {
  /**
   * Analyze SBOM for security risks
   */
  static analyzeSecurityRisks(sbom: SbomReportV2Response): SecurityRiskAnalysis {
    const criticalVulns = sbom.vulnerabilities?.filter(v => v.cvss?.severity === 'CRITICAL') || [];
    const highVulns = sbom.vulnerabilities?.filter(v => v.cvss?.severity === 'HIGH') || [];
    const outdatedComponents = sbom.components.filter(c => this.isOutdated(c));
    
    return {
      riskLevel: this.calculateRiskLevel(criticalVulns.length, highVulns.length),
      criticalVulnerabilities: criticalVulns.length,
      highVulnerabilities: highVulns.length,
      outdatedComponents: outdatedComponents.length,
      recommendations: this.generateRecommendations(criticalVulns, outdatedComponents)
    };
  }

  /**
   * Analyze SBOM for license compliance
   */
  static analyzeLicenseCompliance(sbom: SbomReportV2Response): LicenseComplianceAnalysis {
    const licenses = sbom.licenses || [];
    const riskLicenses = licenses.filter(l => l.riskLevel === 'HIGH');
    const copyleftLicenses = licenses.filter(l => l.category === 'copyleft');
    
    return {
      totalLicenses: licenses.length,
      highRiskLicenses: riskLicenses.length,
      copyleftLicenses: copyleftLicenses.length,
      complianceStatus: riskLicenses.length === 0 ? 'COMPLIANT' : 'AT_RISK',
      recommendations: this.generateLicenseRecommendations(riskLicenses, copyleftLicenses)
    };
  }

  private static isOutdated(component: SbomComponentV2): boolean {
    // Implementation would check against known latest versions
    return false; // Placeholder
  }

  private static calculateRiskLevel(critical: number, high: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (critical > 0) return 'CRITICAL';
    if (high > 5) return 'HIGH';
    if (high > 0) return 'MEDIUM';
    return 'LOW';
  }

  private static generateRecommendations(vulns: SbomVulnerabilityV2[], outdated: SbomComponentV2[]): string[] {
    const recommendations = [];
    if (vulns.length > 0) {
      recommendations.push(`Update ${vulns.length} components with critical/high vulnerabilities`);
    }
    if (outdated.length > 0) {
      recommendations.push(`Update ${outdated.length} outdated components`);
    }
    return recommendations;
  }

  private static generateLicenseRecommendations(risk: SbomLicenseV2[], copyleft: SbomLicenseV2[]): string[] {
    const recommendations = [];
    if (risk.length > 0) {
      recommendations.push(`Review ${risk.length} high-risk licenses`);
    }
    if (copyleft.length > 0) {
      recommendations.push(`Verify compliance requirements for ${copyleft.length} copyleft licenses`);
    }
    return recommendations;
  }
}

export interface SecurityRiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  outdatedComponents: number;
  recommendations: string[];
}

export interface LicenseComplianceAnalysis {
  totalLicenses: number;
  highRiskLicenses: number;
  copyleftLicenses: number;
  complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  recommendations: string[];
}
```

### Phase 5: Documentation & Examples (Day 4)

#### 1. Comprehensive Documentation

```typescript
/**
 * # SCA (Software Composition Analysis) API v2
 * 
 * The SCA API provides comprehensive software bill of materials (SBOM) generation
 * and vulnerability analysis for projects. This API is essential for:
 * 
 * - Security compliance and vulnerability management
 * - License compliance and risk assessment  
 * - Supply chain security analysis
 * - Regulatory reporting (NTIA, EU Cyber Resilience Act)
 * 
 * ## Supported SBOM Formats
 * 
 * - **JSON**: SonarQube native format with full feature support
 * - **SPDX**: Industry standard (ISO/IEC 5962:2021) in JSON and RDF formats
 * - **CycloneDX**: OWASP standard optimized for security use cases
 * 
 * ## Authentication
 * 
 * All SCA endpoints require authentication. Users need 'Browse' permission
 * on the project to generate SBOM reports.
 * 
 * @since SonarQube 10.6
 */
```

#### 2. Usage Examples

```typescript
// Example 1: Basic SBOM Generation
const client = new SonarQubeClient('https://sonarqube.company.com', 'token');

// Get structured SBOM data
const sbom = await client.sca.getSbomReportV2({
  projectKey: 'my-web-app',
  includeVulnerabilities: true,
  includeLicenses: true
});

console.log(`Found ${sbom.components.length} components`);
console.log(`Found ${sbom.vulnerabilities?.length || 0} vulnerabilities`);

// Example 2: SPDX Format for Compliance
const spdxReport = await client.sca.downloadSbomReportV2({
  projectKey: 'my-web-app',
  format: 'spdx-json',
  includeVulnerabilities: true,
  includeLicenses: true
});

// Save to file for compliance reporting
fs.writeFileSync('sbom-spdx.json', spdxReport);

// Example 3: CycloneDX for Security Tools
const cycloneDxReport = await client.sca.downloadSbomReportV2({
  projectKey: 'my-web-app', 
  format: 'cyclonedx-json',
  includeVulnerabilities: true
});

// Import into security scanning tools

// Example 4: Large Project Streaming
const stream = await client.sca.streamSbomReportV2({
  projectKey: 'large-enterprise-app',
  format: 'json',
  includeVulnerabilities: true
});

// Process stream to avoid memory issues
const reader = stream.getReader();
let result = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  result += new TextDecoder().decode(value);
}

// Example 5: Security Risk Analysis
const sbom = await client.sca.getSbomReportV2({
  projectKey: 'my-app'
});

const riskAnalysis = SbomAnalyzer.analyzeSecurityRisks(sbom);
console.log(`Risk Level: ${riskAnalysis.riskLevel}`);
console.log(`Critical Vulnerabilities: ${riskAnalysis.criticalVulnerabilities}`);

// Example 6: License Compliance Check
const licenseAnalysis = SbomAnalyzer.analyzeLicenseCompliance(sbom);
console.log(`Compliance Status: ${licenseAnalysis.complianceStatus}`);
console.log(`High Risk Licenses: ${licenseAnalysis.highRiskLicenses}`);

// Example 7: Vulnerability Summary for Dashboard
const vulnSummary = await client.sca.getVulnerabilitySummaryV2({
  projectKey: 'my-app'
});

console.log(`Total Vulnerabilities: ${vulnSummary.total}`);
console.log(`Critical: ${vulnSummary.critical}, High: ${vulnSummary.high}`);

// Example 8: Branch-Specific Analysis
const branchSbom = await client.sca.getSbomReportV2({
  projectKey: 'my-app',
  branch: 'feature/new-dependencies',
  includeVulnerabilities: true
});

// Compare with main branch for dependency changes

// Example 9: Pull Request Security Check
const prSbom = await client.sca.getSbomReportV2({
  projectKey: 'my-app',
  pullRequest: '123',
  includeVulnerabilities: true
});

// Analyze new vulnerabilities introduced in PR

// Example 10: Progress Tracking for Large Reports
await client.sca.downloadSbomReportV2({
  projectKey: 'enterprise-monolith',
  format: 'spdx-json',
  includeVulnerabilities: true,
  includeLicenses: true
}, {
  onProgress: (progress) => {
    console.log(`Generating SBOM: ${progress.percentage}%`);
    updateProgressBar(progress.percentage);
  },
  timeout: 300000 // 5 minutes for large projects
});
```

#### 3. Best Practices Guide

```markdown
## SCA API Best Practices

### 1. Performance Considerations

- **Use metadata endpoint first**: Check `getSbomMetadataV2()` to understand report size
- **Enable streaming for large reports**: Use `streamSbomReportV2()` for projects with 500+ components
- **Cache SBOM reports**: Reports are expensive to generate, cache for 30+ minutes
- **Filter unnecessary data**: Only include vulnerabilities/licenses when needed

### 2. Security Considerations

- **Protect SBOM data**: Contains sensitive dependency information
- **Use appropriate permissions**: Ensure users have 'Browse' project permission
- **Sanitize external sharing**: Remove sensitive paths/internal URLs before sharing

### 3. Compliance Workflows

- **Regular automated generation**: Generate SBOMs on each release
- **Format selection**: Use SPDX for regulatory compliance, CycloneDX for security tools
- **Version tracking**: Store SBOMs with version tags for historical analysis
- **License review**: Include license analysis in compliance workflows

### 4. Error Handling

- **Handle large timeouts**: Set appropriate timeouts for enterprise projects
- **Implement retry logic**: SBOM generation can be resource-intensive
- **Graceful degradation**: Fall back to metadata-only when full reports fail
```

## Implementation Checklist

### Day 1: Research & Type Design
- [ ] Research SCA API documentation thoroughly
- [ ] Design comprehensive type system for SBOM data
- [ ] Plan multi-format response handling strategy
- [ ] Create module structure and basic interfaces

### Day 2: Core Implementation
- [ ] Implement getSbomReportV2 with structured response
- [ ] Implement downloadSbomReportV2 with format support
- [ ] Implement getSbomMetadataV2 for report information
- [ ] Add proper error handling for large reports
- [ ] Add streaming support for large SBOMs

### Day 3: Testing & Advanced Features
- [ ] Unit tests for all endpoints
- [ ] MSW handlers for complex SBOM responses
- [ ] Test large report scenarios
- [ ] Test format conversion accuracy
- [ ] Implement getVulnerabilitySummaryV2
- [ ] Add format converter utilities
- [ ] Add SBOM analysis utilities

### Day 4: Polish & Documentation
- [x] Add comprehensive JSDoc documentation
- [x] Create usage examples for all scenarios
- [ ] Add best practices guide
- [x] Update main SonarQubeClient integration
- [x] Update exports in index.ts
- [x] Update CHANGELOG.md

## Technical Considerations

### 1. Large Response Handling
- SBOM reports can be several MB for complex projects
- Implement streaming and chunked processing
- Support progress tracking for user experience
- Handle memory efficiently in browser environments

### 2. Format Conversion
- Support multiple industry-standard formats
- Ensure lossless conversion between formats
- Validate format compliance with specifications
- Handle format-specific features appropriately

### 3. Security and Performance
- Cache reports intelligently (expensive to generate)
- Protect sensitive dependency information
- Handle authentication and authorization properly
- Optimize for different project sizes

### 4. Cross-Platform Compatibility
- Support Node.js and browser environments
- Handle different streaming APIs appropriately
- Consider file system access differences
- Test with various JavaScript engines

## Success Criteria

1. **Complete API Coverage**: All SCA v2 endpoints implemented
2. **Multi-Format Support**: JSON, SPDX, and CycloneDX formats working
3. **Performance**: Efficient handling of large reports (1000+ components)
4. **Analysis Tools**: Built-in security and license analysis utilities
5. **Documentation**: Comprehensive documentation with real-world examples
6. **Testing**: Full test coverage including large report scenarios

## Risk Mitigation

### 1. Large Response Sizes
- Implement streaming to avoid memory issues
- Add progress tracking and timeout handling
- Support chunked processing
- Provide size estimates before generation

### 2. Format Complexity
- Validate format compliance thoroughly
- Test with real SBOM analysis tools
- Handle edge cases in format conversion
- Support format-specific metadata

### 3. Performance Impact
- Implement intelligent caching strategies
- Provide metadata-only endpoints for quick checks
- Support filtered reports to reduce size
- Optimize for common use cases

## Next Steps After Completion

1. **Integration**: Update main SonarQubeClient with ScaClient
2. **CLI Tools**: Consider adding command-line SBOM generation utilities
3. **Security Integration**: Integrate with security scanning workflows
4. **Compliance Tools**: Add regulatory compliance report generators
5. **Future APIs**: Plan implementation of remaining v2 APIs (Fix Suggestions, Clean Code Policy)

## References

- [SPDX Specification 2.3](https://spdx.github.io/spdx-spec/)
- [CycloneDX Specification 1.4](https://cyclonedx.org/docs/1.4/)
- [NTIA Minimum Elements for SBOM](https://www.ntia.doc.gov/files/ntia/publications/sbom_minimum_elements_report.pdf)
- [SonarQube Web API v2 Documentation](https://next.sonarqube.com/sonarqube/web_api_v2)
- [EU Cyber Resilience Act](https://digital-strategy.ec.europa.eu/en/library/cyber-resilience-act)