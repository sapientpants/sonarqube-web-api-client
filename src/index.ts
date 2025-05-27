import { AlmIntegrationsClient } from './resources/alm-integrations';
import { AlmSettingsClient } from './resources/alm-settings';
import { AnalysisCacheClient } from './resources/analysis-cache';
import { createErrorFromResponse, createNetworkError } from './errors';
import { ApplicationsClient } from './resources/applications';
import { ProjectsClient } from './resources/projects';
import { MetricsClient } from './resources/metrics';
import { MeasuresClient } from './resources/measures';
import { IssuesClient } from './resources/issues';
import { QualityGatesClient } from './resources/quality-gates';
import { SourcesClient } from './resources/sources';
import { SystemClient } from './resources/system';

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
  /** ALM Integrations API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly almIntegrations: AlmIntegrationsClient;
  /** ALM Settings API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly almSettings: AlmSettingsClient;
  /** Analysis Cache API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly analysisCache: AnalysisCacheClient;
  /** Applications API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly applications: ApplicationsClient;
  /** Issues API */
  public readonly issues: IssuesClient;
  /** Projects API */
  public readonly projects: ProjectsClient;
  /** Metrics API */
  public readonly metrics: MetricsClient;
  /** Measures API */
  public readonly measures: MeasuresClient;
  /** Quality Gates API */
  public readonly qualityGates: QualityGatesClient;
  /** Sources API */
  public readonly sources: SourcesClient;
  /** System API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly system: SystemClient;

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
    this.issues = new IssuesClient(this.baseUrl, this.token);
    this.projects = new ProjectsClient(this.baseUrl, this.token);
    this.metrics = new MetricsClient(this.baseUrl, this.token);
    this.measures = new MeasuresClient(this.baseUrl, this.token);
    this.qualityGates = new QualityGatesClient(this.baseUrl, this.token);
    this.sources = new SourcesClient(this.baseUrl, this.token);
    this.system = new SystemClient(this.baseUrl, this.token);
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
  ShowApplicationRequest,
  ShowApplicationResponse,
  UpdateApplicationRequest,
  UpdateBranchRequest,
  SetTagsRequest as ApplicationSetTagsRequest,
} from './resources/applications/types';

// Re-export types from projects
export type {
  BulkDeleteProjectsRequest,
  BulkUpdateProjectKeyRequest,
  BulkUpdateProjectKeyResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectRequest,
  ExportFindingsRequest,
  Finding,
  FindingSeverity,
  FindingStatus,
  FindingType,
  GetContainsAiCodeRequest,
  GetContainsAiCodeResponse,
  LicenseUsageResponse,
  Project,
  ProjectQualifier,
  ProjectSearchResult,
  ProjectVisibility,
  SearchProjectsRequest,
  SearchProjectsResponse,
  SetContainsAiCodeRequest,
  UpdateProjectKeyRequest,
  UpdateProjectVisibilityRequest,
} from './resources/projects/types';

// Re-export types from metrics
export type {
  Metric,
  MetricDomain,
  MetricType,
  MetricValueType,
  MetricDirection,
  SearchMetricsParams,
  SearchMetricsResponse,
  MetricTypesResponse,
  MetricDomainsResponse,
} from './resources/metrics/types';

// Re-export types from measures
export type {
  MeasuresAdditionalField,
  ComponentTreeStrategy,
  ComponentQualifier,
  Measure,
  ComponentMeasures,
  Period,
  ComponentMeasuresRequest,
  ComponentMeasuresResponse,
  ComponentTreeRequest,
  ComponentTreeResponse,
  HistoricalMeasure,
  ComponentMeasuresHistory,
  MeasuresHistoryRequest,
  MeasuresHistoryResponse,
} from './resources/measures/types';

// Re-export types from issues
export type {
  Issue,
  IssueComment,
  IssueFlow,
  IssueLocation,
  TextRange,
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueResolution,
  IssueTransition,
  ImpactSeverity,
  ImpactSoftwareQuality,
  CleanCodeAttributeCategory,
  IssueStatusNew,
  FacetMode,
  SearchIssuesRequest,
  SearchIssuesResponse,
  AddCommentRequest,
  AddCommentResponse,
  AssignIssueRequest,
  AssignIssueResponse,
  DoTransitionRequest,
  DoTransitionResponse,
  SetTagsRequest,
  SetTagsResponse,
} from './resources/issues/types';

// Re-export types from quality gates
export type {
  QualityGate,
  QualityGateCondition,
  QualityGateOperator,
  CreateQualityGateRequest,
  UpdateQualityGateRequest,
  DeleteQualityGateRequest,
  SetAsDefaultRequest,
  CopyQualityGateRequest,
  RenameQualityGateRequest,
  GetQualityGateRequest,
  ListQualityGatesResponse,
  SetConditionRequest,
  UpdateConditionRequest,
  DeleteConditionRequest,
  QualityGateProject,
  GetProjectsRequest,
  GetProjectsResponse,
  AssociateProjectsRequest,
  DissociateProjectsRequest,
  ProjectQualityGateStatus,
  QualityGateConditionStatus,
  GetProjectStatusRequest,
} from './resources/quality-gates/types';

// Re-export types from sources
export type {
  GetRawSourceRequest,
  GetRawSourceResponse,
  GetScmInfoRequest,
  GetScmInfoResponse,
  ScmInfo,
  ShowSourceRequest,
  ShowSourceResponse,
  SourceLine,
} from './resources/sources/types';

// Re-export types from system
export type {
  HealthStatus,
  SystemStatus,
  HealthResponse,
  StatusResponse,
  PingResponse,
  SystemInfo,
  InfoResponse,
} from './resources/system/types';

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
