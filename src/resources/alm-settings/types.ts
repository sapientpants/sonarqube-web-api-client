/**
 * ALM (Application Lifecycle Management) platform types
 */
export type AlmPlatform = 'azure' | 'bitbucket' | 'bitbucketcloud' | 'github' | 'gitlab';

/**
 * Common ALM setting properties
 */
export interface AlmSettingBase {
  key: string;
  alm: AlmPlatform;
}

/**
 * Azure DevOps setting
 */
export interface AzureAlmSetting extends AlmSettingBase {
  alm: 'azure';
  url: string;
  personalAccessToken?: string;
}

/**
 * Bitbucket Server setting
 */
export interface BitbucketAlmSetting extends AlmSettingBase {
  alm: 'bitbucket';
  url: string;
  personalAccessToken?: string;
}

/**
 * Bitbucket Cloud setting
 */
export interface BitbucketCloudAlmSetting extends AlmSettingBase {
  alm: 'bitbucketcloud';
  workspace: string;
  clientId: string;
  clientSecret?: string;
}

/**
 * GitHub setting
 */
export interface GitHubAlmSetting extends AlmSettingBase {
  alm: 'github';
  url: string;
  appId: string;
  clientId: string;
  clientSecret?: string;
  privateKey?: string;
  webhookSecret?: string;
}

/**
 * GitLab setting
 */
export interface GitLabAlmSetting extends AlmSettingBase {
  alm: 'gitlab';
  url: string;
  personalAccessToken?: string;
}

/**
 * Union type for all ALM settings
 */
export type AlmSettingDefinition =
  | AzureAlmSetting
  | BitbucketAlmSetting
  | BitbucketCloudAlmSetting
  | GitHubAlmSetting
  | GitLabAlmSetting;

/**
 * Request parameters for creating Azure ALM setting
 */
export interface CreateAzureRequest {
  key: string;
  personalAccessToken: string;
  url: string;
}

/**
 * Request parameters for creating Bitbucket Server ALM setting
 */
export interface CreateBitbucketRequest {
  key: string;
  personalAccessToken: string;
  url: string;
}

/**
 * Request parameters for creating Bitbucket Cloud ALM setting
 */
export interface CreateBitbucketCloudRequest {
  clientId: string;
  clientSecret: string;
  key: string;
  workspace: string;
}

/**
 * Request parameters for creating GitHub ALM setting
 */
export interface CreateGitHubRequest {
  appId: string;
  clientId: string;
  clientSecret: string;
  key: string;
  privateKey: string;
  url: string;
  webhookSecret?: string;
}

/**
 * Request parameters for creating GitLab ALM setting
 */
export interface CreateGitLabRequest {
  key: string;
  personalAccessToken: string;
  url: string;
}

/**
 * Request parameters for updating Azure ALM setting
 */
export interface UpdateAzureRequest {
  key: string;
  newKey?: string;
  personalAccessToken?: string;
  url?: string;
}

/**
 * Request parameters for updating Bitbucket Server ALM setting
 */
export interface UpdateBitbucketRequest {
  key: string;
  newKey?: string;
  personalAccessToken?: string;
  url?: string;
}

/**
 * Request parameters for updating Bitbucket Cloud ALM setting
 */
export interface UpdateBitbucketCloudRequest {
  clientId?: string;
  clientSecret?: string;
  key: string;
  newKey?: string;
  workspace?: string;
}

/**
 * Request parameters for updating GitHub ALM setting
 */
export interface UpdateGitHubRequest {
  appId?: string;
  clientId?: string;
  clientSecret?: string;
  key: string;
  newKey?: string;
  privateKey?: string;
  url?: string;
  webhookSecret?: string;
}

/**
 * Request parameters for updating GitLab ALM setting
 */
export interface UpdateGitLabRequest {
  key: string;
  newKey?: string;
  personalAccessToken?: string;
  url?: string;
}

/**
 * Request parameters for deleting ALM setting
 */
export interface DeleteAlmSettingRequest {
  key: string;
}

/**
 * Request parameters for counting bindings
 */
export interface CountBindingRequest {
  almSetting: string;
}

/**
 * Response for counting bindings
 */
export interface CountBindingResponse {
  projects: number;
}

/**
 * Request parameters for listing ALM settings
 */
export interface ListAlmSettingsRequest {
  project?: string;
}

/**
 * Response for listing ALM settings
 */
export interface ListAlmSettingsResponse {
  almSettings: AlmSettingDefinition[];
}

/**
 * Response for listing ALM definitions
 */
export interface ListDefinitionsResponse {
  azure: AzureAlmSetting[];
  bitbucket: BitbucketAlmSetting[];
  bitbucketcloud: BitbucketCloudAlmSetting[];
  github: GitHubAlmSetting[];
  gitlab: GitLabAlmSetting[];
}

/**
 * Request parameters for getting project binding
 */
export interface GetBindingRequest {
  project: string;
}

/**
 * Azure project binding
 */
export interface AzureProjectBinding {
  alm: 'azure';
  key: string;
  projectName: string;
  repository: string;
  url: string;
  slug?: string;
}

/**
 * Bitbucket Server project binding
 */
export interface BitbucketProjectBinding {
  alm: 'bitbucket';
  key: string;
  repository: string;
  slug: string;
  url: string;
}

/**
 * Bitbucket Cloud project binding
 */
export interface BitbucketCloudProjectBinding {
  alm: 'bitbucketcloud';
  key: string;
  repository: string;
  workspace: string;
}

/**
 * GitHub project binding
 */
export interface GitHubProjectBinding {
  alm: 'github';
  key: string;
  repository: string;
  url: string;
  summaryCommentEnabled?: boolean;
}

/**
 * GitLab project binding
 */
export interface GitLabProjectBinding {
  alm: 'gitlab';
  key: string;
  repository: string;
  url: string;
}

/**
 * Union type for all project bindings
 */
export type ProjectBinding =
  | AzureProjectBinding
  | BitbucketProjectBinding
  | BitbucketCloudProjectBinding
  | GitHubProjectBinding
  | GitLabProjectBinding;

/**
 * Request parameters for deleting project binding
 */
export interface DeleteBindingRequest {
  project: string;
}

/**
 * Request parameters for setting Azure binding
 */
export interface SetAzureBindingRequest {
  almSetting: string;
  project: string;
  projectName: string;
  repositoryName: string;
  monorepo?: boolean;
}

/**
 * Request parameters for setting Bitbucket Server binding
 */
export interface SetBitbucketBindingRequest {
  almSetting: string;
  project: string;
  repository: string;
  slug: string;
  monorepo?: boolean;
}

/**
 * Request parameters for setting Bitbucket Cloud binding
 */
export interface SetBitbucketCloudBindingRequest {
  almSetting: string;
  project: string;
  repository: string;
  monorepo?: boolean;
}

/**
 * Request parameters for setting GitHub binding
 */
export interface SetGitHubBindingRequest {
  almSetting: string;
  project: string;
  repository: string;
  monorepo?: boolean;
  summaryCommentEnabled?: boolean;
}

/**
 * Request parameters for setting GitLab binding
 */
export interface SetGitLabBindingRequest {
  almSetting: string;
  project: string;
  repository: string;
  monorepo?: boolean;
}

/**
 * Request parameters for validating ALM setting
 */
export interface ValidateAlmSettingRequest {
  key: string;
}

/**
 * ALM configuration validation error details
 */
export interface AlmSettingValidationError {
  message: string;
  details?: string;
}

/**
 * Response for validating ALM setting
 */
export interface ValidateAlmSettingResponse {
  errors: AlmSettingValidationError[];
  validationStatus: 'success' | 'failure' | 'warning';
}
