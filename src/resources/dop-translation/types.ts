/**
 * DOP Translation API v2 types for SonarQube Web API Client
 * Handles DevOps platform integration and project binding
 */

// Import types for use in this file
import type {
  DevOpsPlatform,
  GitHubConfig,
  GitLabConfig,
  BitbucketConfig,
  AzureDevOpsConfig,
  ValidationResult,
} from '../../core/services/PlatformValidationService';

// Re-export platform configs for external consumers
export type {
  GitHubConfig,
  GitLabConfig,
  BitbucketConfig,
  AzureDevOpsConfig,
  ValidationResult,
} from '../../core/services/PlatformValidationService';

/**
 * Supported DevOps platforms for integration
 * Re-exported from PlatformValidationService for consistency
 */
export { DevOpsPlatform } from '../../core/services/PlatformValidationService';

/**
 * Project binding status after creation
 */
export enum ProjectBindingStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
  DISABLED = 'DISABLED',
}

/**
 * Platform connection status
 */
export enum PlatformStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  AUTHENTICATING = 'AUTHENTICATING',
}

/**
 * Synchronization status between platform and SonarQube
 */
export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  NeverSynced = 'NEVER_SYNCED',
}

/**
 * SonarQube project visibility
 */
export enum ProjectVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/**
 * Authentication type for DevOps platforms
 */
export enum AuthenticationType {
  OAUTH = 'oauth',
  PersonalAccessToken = 'personal_access_token',
  AppPassword = 'app_password',
  InstallationToken = 'installation_token',
}

// ============================================================================
// Core Request/Response Types
// ============================================================================

/**
 * Request to create a SonarQube project bound to a DevOps platform project
 */
export interface CreateBoundProjectV2Request {
  /** DevOps platform type */
  dopPlatform: DevOpsPlatform;
  /** Unique identifier for the project in the DevOps platform */
  projectIdentifier: string;
  /** Organization/namespace name (optional, can be extracted from projectIdentifier) */
  organizationName?: string;
  /** Repository name (optional, can be extracted from projectIdentifier) */
  repositoryName?: string;
  /** Full repository URL */
  repositoryUrl?: string;
  /** Main branch name (defaults to platform default) */
  mainBranchName?: string;
  /** Platform-specific configuration */
  platformSpecific?: PlatformSpecificConfig;
  /** SonarQube project configuration */
  sonarQubeProjectConfig?: SonarQubeProjectConfig;
}

/**
 * Response from creating a bound project
 */
export interface CreateBoundProjectV2Response {
  /** Unique identifier for the bound project */
  id: string;
  /** SonarQube project key */
  key: string;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** SonarQube project URL */
  url: string;
  /** DevOps platform binding information */
  dopBinding: DopBinding;
  /** SonarQube project details */
  sonarQubeProject: SonarQubeProjectDetails;
  /** Creation timestamp */
  createdAt: string;
  /** Current binding status */
  status: ProjectBindingStatus;
}

/**
 * Response containing all DevOps Platform Integration settings
 */
export interface DopSettingsV2Response {
  /** Array of configured platform settings */
  platforms: DopPlatformSetting[];
  /** Total number of configured platforms */
  totalCount: number;
  /** Key of the default platform (if any) */
  defaultPlatform?: string;
}

/**
 * DevOps platform setting configuration
 */
export interface DopPlatformSetting {
  /** Unique key for this platform configuration */
  key: string;
  /** Human-readable name */
  name: string;
  /** Whether this platform is enabled */
  enabled: boolean;
  /** Platform base URL (for self-hosted instances) */
  url?: string;
  /** Platform type */
  platform: DevOpsPlatform;
  /** Authentication configuration */
  authentication: AuthenticationConfig;
  /** Platform-specific configuration */
  configuration: PlatformConfiguration;
  /** Last synchronization timestamp */
  lastSync?: string;
  /** Current platform status */
  status: PlatformStatus;
}

// ============================================================================
// Platform-Specific Configuration Types
// ============================================================================

/**
 * Union type for platform-specific configurations
 */
export type PlatformSpecificConfig =
  | GitHubConfig
  | GitLabConfig
  | BitbucketConfig
  | AzureDevOpsConfig;

// Re-export validation types for convenience
export type {
  ValidationError,
  ValidationWarning,
} from '../../core/services/PlatformValidationService';

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Authentication configuration for DevOps platforms
 */
export interface AuthenticationConfig {
  /** Authentication method type */
  type: AuthenticationType;
  /** Credentials based on authentication type */
  credentials: AuthenticationCredentials;
  /** OAuth scopes (for OAuth authentication) */
  scopes?: string[];
  /** Token expiration timestamp */
  expiresAt?: string;
}

/**
 * Union type for different authentication credential types
 */
export type AuthenticationCredentials =
  | OAuthCredentials
  | PersonalAccessTokenCredentials
  | AppPasswordCredentials
  | InstallationTokenCredentials;

/**
 * OAuth authentication credentials
 */
export interface OAuthCredentials {
  type: 'oauth';
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** Access token */
  accessToken?: string;
  /** Refresh token */
  refreshToken?: string;
  /** OAuth redirect URI */
  redirectUri?: string;
}

/**
 * Personal Access Token credentials
 */
export interface PersonalAccessTokenCredentials {
  type: 'personal_access_token';
  /** Personal access token */
  token: string;
  /** Username (optional, for some platforms) */
  username?: string;
}

/**
 * App Password credentials (primarily for Bitbucket)
 */
export interface AppPasswordCredentials {
  type: 'app_password';
  /** Username */
  username: string;
  /** App password */
  password: string;
}

/**
 * Installation Token credentials (for GitHub Apps)
 */
export interface InstallationTokenCredentials {
  type: 'installation_token';
  /** GitHub App installation ID */
  installationId: string;
  /** GitHub App ID */
  appId: string;
  /** Private key for signing JWT */
  privateKey: string;
}

// ============================================================================
// SonarQube Project Configuration
// ============================================================================

/**
 * SonarQube project configuration
 */
export interface SonarQubeProjectConfig {
  /** Project key (auto-generated if not provided) */
  key?: string;
  /** Project name */
  name?: string;
  /** Project description */
  description?: string;
  /** Project visibility */
  visibility?: ProjectVisibility;
  /** Quality gate to apply */
  qualityGate?: string;
  /** Quality profiles per language */
  qualityProfile?: Record<string, string>;
  /** Project tags */
  tags?: string[];
  /** Additional project settings */
  settings?: Record<string, string>;
}

// ============================================================================
// Binding and Project Details
// ============================================================================

/**
 * DevOps platform binding information
 */
export interface DopBinding {
  /** Unique binding ID */
  id: string;
  /** Platform type */
  platform: DevOpsPlatform;
  /** External project identifier */
  externalProjectId: string;
  /** External project URL */
  externalUrl: string;
  /** Last synchronization timestamp */
  lastSync: string;
  /** Synchronization status */
  syncStatus: SyncStatus;
  /** Webhook URL (if configured) */
  webhookUrl?: string;
  /** Platform-specific configuration */
  configuration: PlatformSpecificConfig;
}

/**
 * SonarQube project details
 */
export interface SonarQubeProjectDetails {
  /** Project key */
  key: string;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Project URL in SonarQube */
  url: string;
  /** Project visibility */
  visibility: ProjectVisibility;
  /** Creation timestamp */
  createdAt: string;
  /** Last analysis timestamp */
  lastAnalysis?: string;
  /** Quality gate status */
  qualityGate?: QualityGateStatus;
  /** Main branch information */
  branch?: BranchInfo;
}

/**
 * Quality gate status information
 */
export interface QualityGateStatus {
  /** Overall quality gate status */
  status: 'OK' | 'WARN' | 'ERROR';
  /** Quality gate name */
  name: string;
  /** Individual condition results */
  conditions: QualityGateCondition[];
}

/**
 * Individual quality gate condition
 */
export interface QualityGateCondition {
  /** Condition status */
  status: 'OK' | 'WARN' | 'ERROR';
  /** Metric key */
  metricKey: string;
  /** Actual metric value */
  actualValue: string;
  /** Error threshold (if applicable) */
  errorThreshold?: string;
  /** Warning threshold (if applicable) */
  warningThreshold?: string;
}

/**
 * Branch information
 */
export interface BranchInfo {
  /** Branch name */
  name: string;
  /** Whether this is the main branch */
  isMain: boolean;
  /** Branch type */
  type: 'BRANCH' | 'PULL_REQUEST';
  /** Branch URL in SonarQube */
  url?: string;
}

// ============================================================================
// Platform Configuration
// ============================================================================

/**
 * Generic platform configuration
 */
export interface PlatformConfiguration {
  /** Platform-specific settings */
  settings: Record<string, unknown>;
  /** API endpoints configuration */
  endpoints?: PlatformEndpoints;
  /** Rate limiting configuration */
  rateLimits?: RateLimitConfig;
  /** Webhook configuration */
  webhooks?: WebhookConfig;
}

/**
 * Platform API endpoints
 */
export interface PlatformEndpoints {
  /** Base API URL */
  apiUrl: string;
  /** Authentication endpoint */
  authUrl?: string;
  /** Webhook endpoint */
  webhookUrl?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Requests per hour */
  requestsPerHour: number;
  /** Burst limit */
  burstLimit?: number;
  /** Retry after seconds when rate limited */
  retryAfter?: number;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** Secret for signature verification */
  secret?: string;
  /** Events to subscribe to */
  events: string[];
  /** Whether webhook is active */
  active: boolean;
}

// ============================================================================
// Builder Interfaces
// ============================================================================

/**
 * Fluent builder interface for creating bound projects
 */
export interface CreateBoundProjectV2Builder {
  /** Set the DevOps platform */
  forPlatform: (platform: DevOpsPlatform) => this;
  /** Set the project identifier */
  withProjectIdentifier: (identifier: string) => this;
  /** Set the organization name */
  withOrganization: (organization: string) => this;
  /** Set the repository name */
  withRepository: (repository: string) => this;
  /** Set the repository URL */
  withRepositoryUrl: (url: string) => this;
  /** Set the main branch name */
  withMainBranch: (branch: string) => this;
  /** Configure GitHub-specific settings */
  withGitHubConfig: (config: Partial<GitHubConfig>) => this;
  /** Configure GitLab-specific settings */
  withGitLabConfig: (config: Partial<GitLabConfig>) => this;
  /** Configure Bitbucket-specific settings */
  withBitbucketConfig: (config: Partial<BitbucketConfig>) => this;
  /** Configure Azure DevOps-specific settings */
  withAzureDevOpsConfig: (config: Partial<AzureDevOpsConfig>) => this;
  /** Configure SonarQube project settings */
  withSonarQubeProject: (config: Partial<SonarQubeProjectConfig>) => this;
  /** Set SonarQube project key */
  withProjectKey: (key: string) => this;
  /** Set SonarQube project name */
  withProjectName: (name: string) => this;
  /** Set SonarQube project description */
  withProjectDescription: (description: string) => this;
  /** Set project visibility */
  withVisibility: (visibility: ProjectVisibility) => this;
  /** Set quality gate */
  withQualityGate: (qualityGate: string) => this;
  /** Set project tags */
  withTags: (tags: string[]) => this;
  /** Validate the current configuration */
  validate: () => Promise<ValidationResult>;
  /** Execute the project creation */
  execute: () => Promise<CreateBoundProjectV2Response>;
}

// ============================================================================
// Extended Validation Types
// ============================================================================

/**
 * Platform-specific validation result
 */
export interface PlatformValidationResult {
  /** Platform being validated */
  platform: DevOpsPlatform;
  /** Whether authentication is valid */
  authenticated: boolean;
  /** Whether the repository exists */
  repositoryExists: boolean;
  /** Whether permissions are sufficient */
  permissionsValid: boolean;
  /** Whether webhook is configured (optional) */
  webhookConfigured?: boolean;
}

// ============================================================================
// Platform Detection Types
// ============================================================================

/**
 * Platform detection result
 */
export interface PlatformDetectionResult {
  /** Detected platform */
  platform: DevOpsPlatform;
  /** Confidence level (0-1) */
  confidence: number;
  /** Extracted information from URL/identifier */
  extractedInfo: ExtractedPlatformInfo;
}

/**
 * Information extracted from platform URL or identifier
 */
export interface ExtractedPlatformInfo {
  /** Organization/namespace */
  organization?: string;
  /** Repository name */
  repository?: string;
  /** Full URL */
  url: string;
  /** Whether this is an enterprise/self-hosted instance */
  isEnterprise?: boolean;
  /** API URL (for enterprise instances) */
  apiUrl?: string;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Request for batch project creation
 */
export interface BatchCreateRequest {
  /** Array of project creation requests */
  projects: CreateBoundProjectV2Request[];
  /** Batch operation settings */
  settings: BatchSettings;
}

/**
 * Batch operation settings
 */
export interface BatchSettings {
  /** Continue processing on error */
  continueOnError: boolean;
  /** Maximum parallel operations */
  parallelLimit: number;
  /** Timeout per operation (ms) */
  timeout: number;
}

/**
 * Response from batch project creation
 */
export interface BatchCreateResponse {
  /** Individual operation results */
  results: BatchProjectResult[];
  /** Summary of batch operation */
  summary: BatchSummary;
}

/**
 * Result of a single operation in batch
 */
export interface BatchProjectResult {
  /** Original request */
  request: CreateBoundProjectV2Request;
  /** Whether the operation succeeded */
  success: boolean;
  /** Result (if successful) */
  result?: CreateBoundProjectV2Response;
  /** Error (if failed) */
  error?: Error;
}

/**
 * Summary of batch operation
 */
export interface BatchSummary {
  /** Total number of operations */
  total: number;
  /** Number of successful operations */
  successful: number;
  /** Number of failed operations */
  failed: number;
  /** Total duration (ms) */
  duration: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base DOP Translation error
 */
export interface DopTranslationError extends Error {
  /** Platform context */
  platform?: DevOpsPlatform;
  /** Platform-specific error details */
  platformError?: unknown;
}

/**
 * Platform authentication error
 */
export interface PlatformAuthenticationError extends DopTranslationError {
  /** Authentication type that failed */
  authenticationType: AuthenticationType;
  /** Details about the failure */
  details: string;
}

/**
 * Repository not found error
 */
export interface RepositoryNotFoundError extends DopTranslationError {
  /** Repository identifier */
  repository: string;
  /** Organization/namespace */
  organization?: string;
}

/**
 * Insufficient permissions error
 */
export interface InsufficientPermissionsError extends DopTranslationError {
  /** Required permissions */
  requiredPermissions: string[];
  /** Current permissions (if available) */
  currentPermissions?: string[];
}
