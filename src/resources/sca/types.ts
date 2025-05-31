/**
 * Types for SonarQube SCA (Software Composition Analysis) API v2
 * @since 10.6
 */

import type { V2Resource } from '../../core/types/v2-common';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ===== Core Request Types =====

/**
 * Request parameters for getting SBOM reports
 */
export interface GetSbomReportV2Request {
  /** Project key (required) */
  projectKey: string;
  /** Branch name (optional) */
  branch?: string;
  /** Pull request ID (optional) */
  pullRequest?: string;
  /** Output format (optional) - defaults to 'json' */
  format?: SbomFormat;
  /** Include vulnerability data (optional) */
  includeVulnerabilities?: boolean;
  /** Include license information (optional) */
  includeLicenses?: boolean;
  /** Filter by component types (optional) */
  componentTypes?: ComponentType[];
}

/**
 * Supported SBOM output formats
 */
export type SbomFormat =
  | 'json' // SonarQube native format
  | 'spdx-json' // SPDX JSON format
  | 'spdx-rdf' // SPDX RDF/XML format
  | 'cyclonedx-json' // CycloneDX JSON format
  | 'cyclonedx-xml'; // CycloneDX XML format

/**
 * Component type classifications
 */
export type ComponentType =
  | 'library' // Third-party library
  | 'application' // Main application component
  | 'framework' // Framework or platform
  | 'operating-system' // OS-level component
  | 'device' // Hardware/device component
  | 'file'; // Individual file component

// ===== Core Response Types =====

/**
 * Main SBOM report response structure (JSON format)
 */
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

/**
 * Different response types based on format parameter
 */
export type SbomResponseV2 =
  | SbomReportV2Response // JSON format
  | string // SPDX/CycloneDX as text
  | Blob; // Binary formats

// ===== Document and Metadata Types =====

/**
 * SBOM document header information
 */
export interface SbomDocumentV2 {
  /** Unique SBOM document identifier */
  id: string;
  /** SBOM specification version */
  specVersion: string;
  /** Document creation timestamp (ISO 8601) */
  createdAt: string;
  /** SonarQube instance information */
  creator: {
    /** Tool name */
    tool: string;
    /** Tool version */
    version: string;
    /** Tool vendor */
    vendor: 'SonarSource';
  };
  /** Main component being analyzed */
  primaryComponent: SbomComponentV2;
}

/**
 * SBOM generation and analysis metadata
 */
export interface SbomMetadataV2 {
  /** Project information */
  project: {
    /** Project key */
    key: string;
    /** Project display name */
    name: string;
    /** Branch name (if applicable) */
    branch?: string;
    /** Pull request ID (if applicable) */
    pullRequest?: string;
  };
  /** Analysis context information */
  analysis: {
    /** Analysis run identifier */
    analysisId: string;
    /** Analysis completion timestamp */
    completedAt: string;
    /** Total number of components found */
    totalComponents: number;
    /** Total number of vulnerabilities (if included) */
    totalVulnerabilities?: number;
    /** Total number of unique licenses (if included) */
    totalLicenses?: number;
  };
  /** Report generation settings and timing */
  generation: {
    /** Requested output format */
    format: SbomFormat;
    /** Whether vulnerabilities were included */
    includeVulnerabilities: boolean;
    /** Whether licenses were included */
    includeLicenses: boolean;
    /** Report request timestamp */
    requestedAt: string;
    /** Report generation completion timestamp */
    generatedAt: string;
  };
}

// ===== Component and Dependency Types =====

/**
 * Software component information
 */
export interface SbomComponentV2 extends V2Resource {
  /** Component display name */
  name: string;
  /** Component type classification */
  type: ComponentType;
  /** Package manager or ecosystem (e.g., 'maven', 'npm', 'pypi') */
  ecosystem: string;
  /** Component version */
  version: string;
  /** Package URL (PURL) - standardized package identifier */
  purl?: string;
  /** Package manager specific coordinates */
  coordinates: {
    /** Group/organization ID (Maven groupId, npm scope) */
    groupId?: string;
    /** Artifact/package ID (Maven artifactId, npm name) */
    artifactId?: string;
    /** Namespace (for some package managers) */
    namespace?: string;
    /** Component name (always present) */
    name: string;
    /** Component version (always present) */
    version: string;
  };
  /** Component scope in the project */
  scope: 'required' | 'optional' | 'excluded';
  /** Source repository and download information */
  source?: {
    /** Source code repository URL */
    repository?: string;
    /** Direct download URL */
    downloadUrl?: string;
    /** Project homepage URL */
    homepage?: string;
  };
  /** File information for file-based components */
  files?: Array<{
    /** File path relative to project root */
    path: string;
    /** File checksum (SHA-256) */
    checksum: string;
    /** File size in bytes */
    size: number;
  }>;
  /** Associated license identifiers */
  licenses?: string[];
  /** Component description */
  description?: string;
  /** Copyright information */
  copyright?: string;
}

/**
 * Component dependency relationship
 */
export interface SbomDependencyV2 {
  /** Reference to the dependent component ID */
  componentId: string;
  /** List of component IDs this component depends on */
  dependsOn: string[];
  /** Dependency scope in build/runtime context */
  scope: 'compile' | 'runtime' | 'test' | 'provided' | 'import';
  /** Dependency relationship type */
  relationship: 'direct' | 'transitive';
  /** Whether this dependency is optional */
  optional: boolean;
}

// ===== Security and Vulnerability Types =====

/**
 * Security vulnerability information
 */
export interface SbomVulnerabilityV2 {
  /** Vulnerability identifier (CVE, GHSA, etc.) */
  id: string;
  /** Vulnerability database source */
  source: 'NVD' | 'OSV' | 'GHSA' | 'SONAR';
  /** CVSS scoring information */
  cvss?: {
    /** CVSS version */
    version: '2.0' | '3.0' | '3.1';
    /** CVSS base score (0-10) */
    score: number;
    /** Severity classification */
    severity: SeverityLevel;
    /** CVSS vector string */
    vector?: string;
  };
  /** Short vulnerability summary */
  summary: string;
  /** Detailed vulnerability description */
  description?: string;
  /** Publication and update timestamps */
  dates: {
    /** Initial publication date */
    published: string;
    /** Last update date */
    updated?: string;
  };
  /** Components affected by this vulnerability */
  affects: Array<{
    /** Affected component ID */
    componentId: string;
    /** Vulnerable version range */
    versionRange: string;
  }>;
  /** Available fixes for this vulnerability */
  fixes?: Array<{
    /** Fixed version */
    version: string;
    /** Fix description */
    description?: string;
  }>;
  /** Reference URLs for more information */
  references?: Array<{
    /** Reference type */
    type: 'advisory' | 'fix' | 'report' | 'web';
    /** Reference URL */
    url: string;
  }>;
}

/**
 * Vulnerability summary statistics
 */
export interface VulnerabilitySummaryV2 {
  /** Total number of vulnerabilities */
  total: number;
  /** Number of critical severity vulnerabilities */
  critical: number;
  /** Number of high severity vulnerabilities */
  high: number;
  /** Number of medium severity vulnerabilities */
  medium: number;
  /** Number of low severity vulnerabilities */
  low: number;
  /** Vulnerability breakdown by component */
  byComponent: Array<{
    /** Component identifier */
    componentId: string;
    /** Component display name */
    componentName: string;
    /** Total vulnerabilities in this component */
    vulnerabilityCount: number;
    /** Highest severity level found */
    highestSeverity: SeverityLevel;
  }>;
}

// ===== License and Compliance Types =====

/**
 * Software license information
 */
export interface SbomLicenseV2 {
  /** SPDX license identifier (if standardized) */
  spdxId?: string;
  /** License name */
  name: string;
  /** License text content */
  text?: string;
  /** License information URL */
  url?: string;
  /** OSI (Open Source Initiative) approval status */
  osiApproved?: boolean;
  /** License category classification */
  category: 'permissive' | 'copyleft' | 'proprietary' | 'public-domain' | 'unknown';
  /** Compliance risk level */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Component IDs using this license */
  components: string[];
}

// ===== Download and Progress Types =====

/**
 * Options for downloading SBOM reports
 */
// Re-import DownloadProgress from V2BaseClient
import type { DownloadProgress } from '../../core/V2BaseClient';

export interface SbomDownloadOptions {
  /** Progress tracking callback for large reports */
  onProgress?: (progress: DownloadProgress) => void;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancelling downloads */
  signal?: AbortSignal;
}

// ===== Analysis and Risk Assessment Types =====

/**
 * Security risk analysis results
 */
export interface SecurityRiskAnalysis {
  /** Overall risk level assessment */
  riskLevel: SeverityLevel;
  /** Number of critical vulnerabilities */
  criticalVulnerabilities: number;
  /** Number of high vulnerabilities */
  highVulnerabilities: number;
  /** Number of outdated components */
  outdatedComponents: number;
  /** Actionable recommendations */
  recommendations: string[];
}

/**
 * License compliance analysis results
 */
export interface LicenseComplianceAnalysis {
  /** Total number of unique licenses */
  totalLicenses: number;
  /** Number of high-risk licenses */
  highRiskLicenses: number;
  /** Number of copyleft licenses */
  copyleftLicenses: number;
  /** Overall compliance status */
  complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  /** Compliance recommendations */
  recommendations: string[];
}

// ===== Format Conversion Types =====

/**
 * SPDX document structure (simplified)
 */
export interface SPDXDocument {
  spdxVersion: string;
  creationInfo: {
    created: string;
    creators: string[];
  };
  name: string;
  packages: Array<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SPDXID: string;
    name: string;
    versionInfo: string;
    downloadLocation: string;
    filesAnalyzed: boolean;
    licenseConcluded: string;
    copyrightText: string;
  }>;
  relationships: Array<{
    spdxElementId: string;
    relationshipType: string;
    relatedSpdxElement: string[];
  }>;
}

/**
 * CycloneDX document structure (simplified)
 */
export interface CycloneDXDocument {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools: Array<{
      vendor: string;
      name: string;
      version: string;
    }>;
    component: {
      type: string;
      name: string;
      version: string;
    };
  };
  components: Array<{
    type: string;
    name: string;
    version: string;
    purl?: string;
    licenses?: Array<{ license: { id: string } }>;
    externalReferences?: Array<{
      type: string;
      url: string;
    }>;
  }>;
  dependencies: Array<{
    ref: string;
    dependsOn: string[];
  }>;
  vulnerabilities?: Array<{
    id: string;
    source: { name: string };
    ratings?: Array<{
      source: { name: string };
      score: number;
      severity: string;
      method: string;
      vector?: string;
    }>;
    description?: string;
    published?: string;
    updated?: string;
    affects: Array<{
      ref: string;
      versions: Array<{ version: string }>;
    }>;
  }>;
}

// ===== Cache Types =====

/**
 * SBOM caching configuration options
 */
export interface SbomCacheOptions {
  /** Cache duration in milliseconds */
  ttl?: number;
  /** Cache key prefix */
  keyPrefix?: string;
  /** Enable/disable caching */
  enabled?: boolean;
}
