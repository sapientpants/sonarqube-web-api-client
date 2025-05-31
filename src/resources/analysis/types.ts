/**
 * Types for SonarQube Analysis API v2
 * @since 10.3
 */

import type { V2Resource } from '../../core/types/v2-common';

/**
 * Request parameters for getting active rules
 */
export interface GetActiveRulesV2Request {
  /**
   * Project key
   */
  projectKey: string;

  /**
   * Branch name
   */
  branch?: string;

  /**
   * Pull request ID
   */
  pullRequest?: string;
}

/**
 * Active rule information for project analysis
 */
export interface ActiveRuleV2 {
  /**
   * Rule key (e.g., "java:S1125")
   */
  ruleKey: string;

  /**
   * Repository key (e.g., "java")
   */
  repository: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Programming language
   */
  language: string;

  /**
   * Rule severity
   */
  severity: 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';

  /**
   * Rule type
   */
  type: 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';

  /**
   * Rule parameters (key-value pairs)
   */
  params?: Record<string, string>;

  /**
   * Template key if rule is based on a template
   */
  templateKey?: string;

  /**
   * Internal key used by the rule engine
   */
  internalKey?: string;

  /**
   * Tags associated with the rule
   */
  tags?: string[];
}

/**
 * Response from getting active rules
 */
export interface GetActiveRulesV2Response {
  /**
   * List of active rules
   */
  rules: ActiveRuleV2[];

  /**
   * Total number of active rules
   */
  total: number;
}

/**
 * Scanner engine metadata
 */
export interface EngineMetadataV2 {
  /**
   * Engine filename
   */
  filename: string;

  /**
   * SHA-256 checksum of the engine file
   */
  sha256: string;

  /**
   * URL to download the engine
   */
  downloadUrl: string;

  /**
   * Minimum SonarQube version required
   */
  minimumSqVersion?: string;

  /**
   * File size in bytes
   */
  size?: number;
}

/**
 * JRE metadata for scanners
 */
export interface JreMetadataV2 extends V2Resource {
  /**
   * JRE filename
   */
  filename: string;

  /**
   * SHA-256 checksum of the JRE file
   */
  sha256: string;

  /**
   * Path to Java executable within the JRE
   */
  javaPath: string;

  /**
   * Operating system
   */
  os: 'windows' | 'linux' | 'macos' | 'alpine';

  /**
   * Architecture
   */
  arch: 'x64' | 'aarch64';

  /**
   * Minimum SonarQube version required
   */
  minimumSqVersion?: string;

  /**
   * File size in bytes
   */
  size?: number;

  /**
   * JRE version (e.g., "17.0.8")
   */
  version?: string;
}

/**
 * Response from listing JREs
 */
export interface GetJresV2Response {
  /**
   * List of available JREs
   */
  jres: JreMetadataV2[];
}

/**
 * Server version information
 */
export interface VersionV2Response {
  /**
   * Server version (e.g., "10.3.0")
   */
  version: string;

  /**
   * Build number
   */
  buildNumber?: string;

  /**
   * Git commit ID
   */
  commitId?: string;

  /**
   * Implementation version
   */
  implementationVersion?: string;
}
