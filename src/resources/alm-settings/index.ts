export { AlmSettingsClient } from './AlmSettingsClient';

// Export builders
export {
  CreateGitHubBuilder,
  UpdateGitHubBuilder,
  CreateBitbucketCloudBuilder,
  UpdateBitbucketCloudBuilder,
  SetAzureBindingBuilder,
  SetBitbucketBindingBuilder,
  SetBitbucketCloudBindingBuilder,
  SetGitHubBindingBuilder,
  SetGitLabBindingBuilder,
} from './builders';

// Re-export all types explicitly for better compatibility
export type {
  // Platform types
  AlmPlatform,
  AlmSettingBase,
  AzureAlmSetting,
  BitbucketAlmSetting,
  BitbucketCloudAlmSetting,
  GitHubAlmSetting,
  GitLabAlmSetting,
  AlmSettingDefinition,

  // Create request types
  CreateAzureRequest,
  CreateBitbucketRequest,
  CreateBitbucketCloudRequest,
  CreateGitHubRequest,
  CreateGitLabRequest,

  // Update request types
  UpdateAzureRequest,
  UpdateBitbucketRequest,
  UpdateBitbucketCloudRequest,
  UpdateGitHubRequest,
  UpdateGitLabRequest,

  // Other request types
  DeleteAlmSettingRequest,
  CountBindingRequest,
  CountBindingResponse,
  ListAlmSettingsRequest,
  ListAlmSettingsResponse,
  ListDefinitionsResponse,
  GetBindingRequest,
  DeleteBindingRequest,
  ValidateAlmSettingRequest,
  ValidateAlmSettingResponse,

  // Binding types
  AzureProjectBinding,
  BitbucketProjectBinding,
  BitbucketCloudProjectBinding,
  GitHubProjectBinding,
  GitLabProjectBinding,
  ProjectBinding,

  // Binding request types
  SetAzureBindingRequest,
  SetBitbucketBindingRequest,
  SetBitbucketCloudBindingRequest,
  SetGitHubBindingRequest,
  SetGitLabBindingRequest,

  // Validation types
  AlmSettingValidationError,
} from './types';
