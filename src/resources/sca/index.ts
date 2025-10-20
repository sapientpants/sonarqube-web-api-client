export { ScaClient } from './ScaClient.js';
export { SbomFormatConverter, SbomAnalyzer } from './utils.js';
export type {
  // Request types
  GetSbomReportV2Request,
  SbomDownloadOptions,

  // Response types
  SbomReportV2Response,
  SbomResponseV2,
  SbomMetadataV2,
  VulnerabilitySummaryV2,

  // Document and component types
  SbomDocumentV2,
  SbomComponentV2,
  SbomDependencyV2,

  // Security and vulnerability types
  SbomVulnerabilityV2,
  SecurityRiskAnalysis,

  // License and compliance types
  SbomLicenseV2,
  LicenseComplianceAnalysis,

  // Format and conversion types
  SbomFormat,
  ComponentType,
  SPDXDocument,
  CycloneDXDocument,

  // Cache types
  SbomCacheOptions,
} from './types.js';

// Re-export from V2BaseClient
export type { DownloadProgress } from '../../core/V2BaseClient.js';
