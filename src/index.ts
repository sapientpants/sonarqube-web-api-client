import { AlmIntegrationsClient } from './resources/alm-integrations';
import { AlmSettingsClient } from './resources/alm-settings';
import { AnalysisCacheClient } from './resources/analysis-cache';
import { createErrorFromResponse, createNetworkError } from './errors';
import { ApplicationsClient } from './resources/applications';
import { AuthenticationClient } from './resources/authentication';
import { CEClient } from './resources/ce';
import { ComponentsClient } from './resources/components';
import { DuplicationsClient } from './resources/duplications';
import { FavoritesClient } from './resources/favorites';
import { LanguagesClient } from './resources/languages';
import { NotificationsClient } from './resources/notifications';
import { ProjectsClient } from './resources/projects';
import { ProjectBadgesClient } from './resources/project-badges';
import { ProjectAnalysesClient } from './resources/project-analyses';
import { ProjectLinksClient } from './resources/project-links';
import { MetricsClient } from './resources/metrics';
import { MeasuresClient } from './resources/measures';
import { IssuesClient } from './resources/issues';
import { QualityGatesClient } from './resources/quality-gates';
import { SourcesClient } from './resources/sources';
import { SystemClient } from './resources/system';
import { HotspotsClient } from './resources/hotspots';
import { ProjectBranchesClient } from './resources/project-branches';
import { ProjectPullRequestsClient } from './resources/project-pull-requests';
import { ProjectTagsClient } from './resources/project-tags';
import { QualityProfilesClient } from './resources/quality-profiles';
import { RulesClient } from './resources/rules';
import { SettingsClient } from './resources/settings';
import { UsersClient } from './resources/users';
import { UserGroupsClient } from './resources/user-groups';

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
  /** Authentication API */
  public readonly authentication: AuthenticationClient;
  /** Compute Engine (CE) API */
  public readonly ce: CEClient;
  /** Components API */
  public readonly components: ComponentsClient;
  /** Duplications API */
  public readonly duplications: DuplicationsClient;
  /** Favorites API */
  public readonly favorites: FavoritesClient;
  /** Issues API */
  public readonly issues: IssuesClient;
  /** Languages API */
  public readonly languages: LanguagesClient;
  /** Security Hotspots API */
  public readonly hotspots: HotspotsClient;
  /** Project Branches API - **Note**: Only available when the Branch plugin is installed */
  public readonly projectBranches: ProjectBranchesClient;
  /** Notifications API */
  public readonly notifications: NotificationsClient;
  /** Projects API */
  public readonly projects: ProjectsClient;
  /** Project Badges API */
  public readonly projectBadges: ProjectBadgesClient;
  /** Project Analyses API */
  public readonly projectAnalyses: ProjectAnalysesClient;
  /** Project Links API */
  public readonly projectLinks: ProjectLinksClient;
  /** Project Pull Requests API - **Note**: Only available when the Branch plugin is installed */
  public readonly projectPullRequests: ProjectPullRequestsClient;
  /** Metrics API */
  public readonly metrics: MetricsClient;
  /** Measures API */
  public readonly measures: MeasuresClient;
  /** Quality Gates API */
  public readonly qualityGates: QualityGatesClient;
  /** Quality Profiles API */
  public readonly qualityProfiles: QualityProfilesClient;
  /** Rules API */
  public readonly rules: RulesClient;
  /** Sources API */
  public readonly sources: SourcesClient;
  /** System API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly system: SystemClient;
  /** Project Tags API */
  public readonly projectTags: ProjectTagsClient;
  /** Settings API */
  public readonly settings: SettingsClient;
  /** Users API */
  public readonly users: UsersClient;
  /** User Groups API */
  public readonly userGroups: UserGroupsClient;

  private readonly baseUrl: string;
  private readonly token: string;
  private readonly organization: string | undefined;

  constructor(baseUrl: string, token: string, organization?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.organization = organization;

    // Initialize resource clients
    this.almIntegrations = new AlmIntegrationsClient(this.baseUrl, this.token, this.organization);
    this.almSettings = new AlmSettingsClient(this.baseUrl, this.token, this.organization);
    this.analysisCache = new AnalysisCacheClient(this.baseUrl, this.token, this.organization);
    this.applications = new ApplicationsClient(this.baseUrl, this.token, this.organization);
    this.authentication = new AuthenticationClient(this.baseUrl, this.token, this.organization);
    this.ce = new CEClient(this.baseUrl, this.token, this.organization);
    this.components = new ComponentsClient(this.baseUrl, this.token, this.organization);
    this.duplications = new DuplicationsClient(this.baseUrl, this.token, this.organization);
    this.favorites = new FavoritesClient(this.baseUrl, this.token, this.organization);
    this.issues = new IssuesClient(this.baseUrl, this.token, this.organization);
    this.languages = new LanguagesClient(this.baseUrl, this.token, this.organization);
    this.hotspots = new HotspotsClient(this.baseUrl, this.token, this.organization);
    this.projectBranches = new ProjectBranchesClient(this.baseUrl, this.token, this.organization);
    this.notifications = new NotificationsClient(this.baseUrl, this.token, this.organization);
    this.projects = new ProjectsClient(this.baseUrl, this.token, this.organization);
    this.projectBadges = new ProjectBadgesClient(this.baseUrl, this.token, this.organization);
    this.projectAnalyses = new ProjectAnalysesClient(this.baseUrl, this.token, this.organization);
    this.projectLinks = new ProjectLinksClient(this.baseUrl, this.token, this.organization);
    this.projectPullRequests = new ProjectPullRequestsClient(
      this.baseUrl,
      this.token,
      this.organization
    );
    this.metrics = new MetricsClient(this.baseUrl, this.token, this.organization);
    this.measures = new MeasuresClient(this.baseUrl, this.token, this.organization);
    this.qualityGates = new QualityGatesClient(this.baseUrl, this.token, this.organization);
    this.qualityProfiles = new QualityProfilesClient(this.baseUrl, this.token, this.organization);
    this.rules = new RulesClient(this.baseUrl, this.token, this.organization);
    this.sources = new SourcesClient(this.baseUrl, this.token, this.organization);
    this.system = new SystemClient(this.baseUrl, this.token, this.organization);
    this.projectTags = new ProjectTagsClient(this.baseUrl, this.token, this.organization);
    this.settings = new SettingsClient(this.baseUrl, this.token, this.organization);
    this.users = new UsersClient(this.baseUrl, this.token, this.organization);
    this.userGroups = new UserGroupsClient(this.baseUrl, this.token, this.organization);
  }

  // Legacy methods for backward compatibility
  public async getProjects(): Promise<ProjectsResponse> {
    const params = new URLSearchParams();
    if (this.organization !== undefined && this.organization.length > 0) {
      params.append('organization', this.organization);
    }
    return this.request<ProjectsResponse>(`/projects/search?${params.toString()}`);
  }

  public async getIssues(projectKey?: string): Promise<IssuesResponse> {
    const params = new URLSearchParams();
    if (this.organization !== undefined && this.organization.length > 0) {
      params.append('organization', this.organization);
    }
    if (projectKey !== undefined && projectKey.length > 0) {
      params.append('componentKeys', projectKey);
    }
    return this.request<IssuesResponse>(`/issues/search?${params.toString()}`);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.token.length > 0) {
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
  ListDefinitionsResponse as AlmListDefinitionsResponse,
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

// Re-export types from authentication
export type { ValidateResponse, LogoutResponse } from './resources/authentication/types';

// Re-export types from duplications
export type {
  ShowDuplicationsRequest,
  ShowDuplicationsResponse,
  DuplicationBlock,
  DuplicatedFile,
  Duplication,
} from './resources/duplications/types';

// Re-export types from favorites
export type {
  AddFavoriteRequest,
  Favorite,
  RemoveFavoriteRequest,
  SearchFavoritesRequest,
  SearchFavoritesResponse,
} from './resources/favorites/types';

// Re-export types from CE (Compute Engine)
export type {
  Task,
  ActivityTask,
  TaskStatus,
  TaskType,
  BranchType,
  ActivityRequest,
  ActivityResponse,
  ActivityStatusRequest,
  ActivityStatusResponse,
  ComponentTasksRequest,
  ComponentTasksResponse,
  TaskRequest,
  TaskResponse,
} from './resources/ce/types';

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

// Re-export types from components
export type {
  Component,
  ComponentShowRequest,
  ComponentShowResponse,
  ComponentSearchRequest,
  ComponentSearchResponse,
  ComponentTreeRequest as ComponentsTreeRequest,
  ComponentTreeResponse as ComponentsTreeResponse,
  BooleanString,
} from './resources/components/types';
export {
  ComponentQualifier as ComponentsQualifier,
  ComponentTreeStrategy as ComponentsTreeStrategy,
  ComponentSortField,
} from './resources/components/types';

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

// Re-export types from hotspots
export type {
  Hotspot,
  HotspotRule,
  HotspotStatus,
  HotspotResolution,
  SearchHotspotsRequest,
  SearchHotspotsResponse,
  ShowHotspotRequest,
  ShowHotspotResponse,
  ChangeHotspotStatusRequest,
  ChangeHotspotStatusResponse,
} from './resources/hotspots/types';

// Re-export types from languages
export type {
  Language,
  ListLanguagesParams,
  ListLanguagesResponse,
} from './resources/languages/types';

// Re-export types from project branches
export type {
  Branch,
  BranchStatusValue,
  ListBranchesParams,
  ListBranchesResponse,
  DeleteBranchParams,
  RenameMainBranchParams,
} from './resources/project-branches/types';

export { ProjectBranchType, QualityGateStatus } from './resources/project-branches/types';

// Re-export types from notifications
export type {
  NotificationAddRequest,
  NotificationListRequest,
  NotificationListResponse,
  NotificationModifyRequest,
  NotificationModifyResponse,
  NotificationRemoveRequest,
  Notification,
  NotificationType,
} from './resources/notifications/types';

export {
  NotificationChannel,
  GlobalNotificationType,
  ProjectNotificationType,
} from './resources/notifications/types';

// Re-export types from project badges
export type {
  BadgeMetric,
  BaseBadgeParams,
  AiCodeAssuranceBadgeParams,
  MeasureBadgeParams,
  QualityGateBadgeParams,
  BadgeResponse,
} from './resources/project-badges/types';

// Re-export types from project analyses
export type {
  AnalysisEvent,
  EventCategory,
  MutableEventCategory,
  ProjectAnalysis,
  CreateEventRequest,
  CreateEventResponse,
  DeleteEventRequest,
  SearchAnalysesRequest,
  SearchAnalysesResponse,
  SetBaselineRequest,
  UnsetBaselineRequest,
  UpdateEventRequest,
  UpdateEventResponse,
} from './resources/project-analyses/types';

// Re-export types from project links
export type {
  ProjectLink,
  CreateProjectLinkRequest,
  CreateProjectLinkResponse,
  DeleteProjectLinkRequest,
  SearchProjectLinksRequest,
  SearchProjectLinksResponse,
} from './resources/project-links/types';

// Re-export types from project pull requests
export type {
  DeletePullRequestRequest,
  ListPullRequestsRequest,
  ListPullRequestsResponse,
  PullRequest,
} from './resources/project-pull-requests/types';

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

// Re-export types from project tags
export type {
  SearchTagsParams,
  SearchTagsResponse,
  SetProjectTagsParams,
} from './resources/project-tags/types';

// Re-export types from quality profiles
export type {
  QualityProfile,
  Severity,
  RuleStatus,
  RuleType,
  ActivateRuleRequest,
  ActivateRulesRequest,
  ActivateRulesResponse,
  AddProjectRequest as QualityProfileAddProjectRequest,
  BackupRequest as QualityProfileBackupRequest,
  ChangeParentRequest,
  ChangelogRequest,
  ChangelogEntry,
  ChangelogResponse,
  CompareRequest as QualityProfileCompareRequest,
  RuleComparison,
  CompareResponse as QualityProfileCompareResponse,
  CopyRequest as QualityProfileCopyRequest,
  CopyResponse as QualityProfileCopyResponse,
  CreateRequest as CreateQualityProfileRequest,
  CreateResponse as CreateQualityProfileResponse,
  DeactivateRuleRequest,
  DeactivateRulesRequest,
  DeactivateRulesResponse,
  DeleteRequest as DeleteQualityProfileRequest,
  ExportRequest as QualityProfileExportRequest,
  Exporter,
  ExportersResponse,
  Importer,
  ImportersResponse,
  InheritanceRequest,
  ProfileInheritance,
  InheritanceResponse,
  ProjectsRequest as QualityProfileProjectsRequest,
  ProjectAssociation as QualityProfileProjectAssociation,
  ProjectsResponse as QualityProfileProjectsResponse,
  RemoveProjectRequest as QualityProfileRemoveProjectRequest,
  RenameRequest as RenameQualityProfileRequest,
  RestoreRequest as RestoreQualityProfileRequest,
  RestoreResponse as RestoreQualityProfileResponse,
  SearchRequest as SearchQualityProfilesRequest,
  SearchResponse as SearchQualityProfilesResponse,
  SetDefaultRequest as SetDefaultQualityProfileRequest,
} from './resources/quality-profiles/types';

// Re-export types from rules
export type {
  Rule,
  RuleRepository,
  RuleParameter,
  RuleDescriptionSection,
  RuleImpact,
  RuleActivation,
  RuleSeverity,
  RuleStatus as RuleStatusType,
  RuleType as RuleTypeEnum,
  CleanCodeAttributeCategory as RuleCleanCodeAttributeCategory,
  SoftwareQuality,
  ImpactSeverity as RuleImpactSeverity,
  RuleInheritance,
  RemediationFunctionType,
  FacetMode as RuleFacetMode,
  ListRepositoriesRequest,
  ListRepositoriesResponse,
  SearchRulesRequest,
  SearchRulesResponse,
  ShowRuleRequest,
  ShowRuleResponse,
  ListTagsRequest as ListRuleTagsRequest,
  ListTagsResponse as ListRuleTagsResponse,
  UpdateRuleRequest,
  UpdateRuleResponse,
} from './resources/rules/types';

// Re-export types from settings
export type {
  // Request types
  ListDefinitionsRequest as SettingsListDefinitionsRequest,
  ResetRequest as SettingsResetRequest,
  SetRequest as SettingsSetRequest,
  ValuesRequest as SettingsValuesRequest,

  // Response types
  ListDefinitionsResponse as SettingsListDefinitionsResponse,
  ValuesResponse as SettingsValuesResponse,

  // Entity types
  SettingDefinition,
  SettingField,
  SettingValue,
} from './resources/settings/types';

// Re-export types from users
export type {
  User,
  UserWithDetails,
  UserGroup as UsersUserGroup,
  GroupSelectionFilter,
  SearchUsersRequest,
  SearchUsersResponse,
  GetUserGroupsRequest,
  GetUserGroupsResponse,
} from './resources/users/types';

// Re-export types from user groups
export type {
  UserGroup,
  UserWithMembership,
  AddUserRequest,
  CreateGroupRequest,
  CreateGroupResponse,
  DeleteGroupRequest,
  RemoveUserRequest,
  SearchGroupsRequest,
  SearchGroupsResponse,
  UpdateGroupRequest,
  UsersRequest,
  UsersResponse,
} from './resources/user-groups/types';

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
