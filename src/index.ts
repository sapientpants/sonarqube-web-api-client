import { AlmIntegrationsClient } from './resources/alm-integrations';
import { AlmSettingsClient } from './resources/alm-settings';
import { AnalysisCacheClient } from './resources/analysis-cache';
import { createErrorFromResponse, createNetworkError } from './errors';
import { ApplicationsClient } from './resources/applications';

interface ProjectsResponse {
  [key: string]: unknown;
  components: unknown[];
}

interface IssuesResponse {
  [key: string]: unknown;
  issues: unknown[];
}

/**
 * Main SonarQube API client
 */
export class SonarQubeClient {
  // Resource clients
  public readonly almIntegrations: AlmIntegrationsClient;
  public readonly almSettings: AlmSettingsClient;
  public readonly analysisCache: AnalysisCacheClient;
  public readonly applications: ApplicationsClient;

  private readonly baseUrl: string;
  private readonly token: string | undefined;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;

    // Initialize resource clients
    this.almIntegrations = new AlmIntegrationsClient(this.baseUrl, this.token);
    this.almSettings = new AlmSettingsClient(this.baseUrl, this.token);
    this.analysisCache = new AnalysisCacheClient(this.baseUrl, this.token);
    this.applications = new ApplicationsClient(this.baseUrl, this.token);
  }

  // Legacy methods for backward compatibility
  public async getProjects(): Promise<ProjectsResponse> {
    return this.request<ProjectsResponse>('/projects/search');
  }

  public async getIssues(projectKey?: string): Promise<IssuesResponse> {
    const params = new URLSearchParams();
    if (projectKey !== undefined && projectKey.length > 0) {
      params.append('componentKeys', projectKey);
    }
    return this.request<IssuesResponse>(`/issues/search?${params.toString()}`);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.token !== undefined && this.token.length > 0) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw createNetworkError(error);
    }

    if (!response.ok) {
      throw await createErrorFromResponse(response);
    }

    return response.json() as Promise<T>;
  }
}

export default SonarQubeClient;

// Re-export types from ALM integrations
export * from './resources/alm-integrations/types';

// Re-export types from ALM settings
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
} from './resources/alm-settings/types';

// Re-export types from analysis cache
export type {
  GetAnalysisCacheRequest,
  GetAnalysisCacheResponse,
} from './resources/analysis-cache/types';

// Re-export types from applications
export type {
  Application,
  ApplicationBranch,
  ApplicationProject,
  ApplicationVisibility,
  AddProjectRequest,
  CreateApplicationRequest,
  CreateApplicationResponse,
  CreateBranchRequest,
  DeleteApplicationRequest,
  DeleteBranchRequest,
  RemoveProjectRequest,
  SetTagsRequest,
  ShowApplicationRequest,
  ShowApplicationResponse,
  UpdateApplicationRequest,
  UpdateBranchRequest,
} from './resources/applications/types';

// Re-export error classes
export {
  SonarQubeError,
  ApiError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  TimeoutError,
  ServerError,
} from './errors';
