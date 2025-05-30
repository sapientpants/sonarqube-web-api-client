/**
 * DOP Translation API v2 module exports
 * Provides comprehensive DevOps platform integration for SonarQube
 */

// Main client
export { DopTranslationClient } from './DopTranslationClient';

// Type definitions
export type {
  // Core request/response types
  CreateBoundProjectV2Request,
  CreateBoundProjectV2Response,
  DopSettingsV2Response,
  DopPlatformSetting,

  // Platform configuration types
  PlatformSpecificConfig,
  GitHubConfig,
  GitLabConfig,
  BitbucketConfig,
  AzureDevOpsConfig,

  // Authentication types
  AuthenticationConfig,
  AuthenticationCredentials,
  OAuthCredentials,
  PersonalAccessTokenCredentials,
  AppPasswordCredentials,
  InstallationTokenCredentials,

  // SonarQube project types
  SonarQubeProjectConfig,
  SonarQubeProjectDetails,
  QualityGateStatus,
  QualityGateCondition,
  BranchInfo,

  // Binding and platform types
  DopBinding,
  PlatformConfiguration,
  PlatformEndpoints,
  RateLimitConfig,
  WebhookConfig,

  // Builder interfaces
  CreateBoundProjectV2Builder,

  // Validation types
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PlatformValidationResult,

  // Platform detection types
  PlatformDetectionResult,
  ExtractedPlatformInfo,

  // Batch operation types
  BatchCreateRequest,
  BatchCreateResponse,
  BatchProjectResult,
  BatchSummary,
  BatchSettings,

  // Error types
  DopTranslationError,
  PlatformAuthenticationError,
  RepositoryNotFoundError,
  InsufficientPermissionsError,
} from './types';

// Enums
export {
  DevOpsPlatform,
  ProjectBindingStatus,
  PlatformStatus,
  SyncStatus,
  ProjectVisibility,
  AuthenticationType,
} from './types';

// Builder implementations
export { CreateBoundProjectV2BuilderImpl } from './builders';

// Utility classes
export {
  PlatformDetector,
  ConfigurationValidator,
  ProjectMapper,
  AuthenticationHelper,
  ConfigurationTemplates,
} from './utils';
