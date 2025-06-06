import { AlmIntegrationsClient } from './resources/alm-integrations';
import { AlmSettingsClient } from './resources/alm-settings';
import { AnalysisCacheClient } from './resources/analysis-cache';
import { AnalysisClient } from './resources/analysis';
import { ScaClient } from './resources/sca';
import { FixSuggestionsClient } from './resources/fix-suggestions';
import { CleanCodePolicyClient } from './resources/clean-code-policy';
import { DopTranslationClient } from './resources/dop-translation';
import { createErrorFromResponse, createNetworkError } from './errors';
import { DeprecationManager } from './core/deprecation';
import { type ClientOptions } from './core/BaseClient';
import {
  type AuthProvider,
  BearerTokenAuthProvider,
  BasicAuthProvider,
  PasscodeAuthProvider,
} from './core/auth';
import { ApplicationsClient } from './resources/applications';
import { AuthenticationClient } from './resources/authentication';
import { AuthorizationsClient } from './resources/authorizations';
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
import { NewCodePeriodsClient } from './resources/new-code-periods';
import { AuditLogsClient } from './resources/audit-logs';
import { PluginsClient } from './resources/plugins';
import { ServerClient } from './resources/server';
import { EditionsClient } from './resources/editions';
import { ProjectDumpClient } from './resources/project-dump';
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
import { UserTokensClient } from './resources/user-tokens';
import { PermissionsClient } from './resources/permissions';
import { WebhooksClient } from './resources/webhooks';
import { WebservicesClient } from './resources/webservices';
import { ViewsClient } from './resources/views';

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
/* eslint-disable @typescript-eslint/member-ordering */
export class SonarQubeClient {
  /**
   * Create a client with Bearer token authentication
   */
  static withToken(baseUrl: string, token: string, options?: ClientOptions): SonarQubeClient {
    const authProvider = new BearerTokenAuthProvider(token);
    return new SonarQubeClient(baseUrl, authProvider, options);
  }

  /**
   * Create a client with HTTP Basic authentication
   *
   * @param baseUrl - The base URL of the SonarQube instance
   * @param username - The username or token
   * @param password - The password (optional, can be omitted for token authentication)
   * @param options - Additional client options
   */
  static withBasicAuth(
    baseUrl: string,
    username: string,
    password?: string,
    options?: ClientOptions
  ): SonarQubeClient {
    const authProvider = new BasicAuthProvider(username, password ?? '');
    return new SonarQubeClient(baseUrl, authProvider, options);
  }

  /**
   * Create a client with passcode authentication
   */
  static withPasscode(baseUrl: string, passcode: string, options?: ClientOptions): SonarQubeClient {
    const authProvider = new PasscodeAuthProvider(passcode);
    return new SonarQubeClient(baseUrl, authProvider, options);
  }

  /**
   * Create a client with custom authentication provider
   */
  static withAuth(
    baseUrl: string,
    authProvider: AuthProvider,
    options?: ClientOptions
  ): SonarQubeClient {
    return new SonarQubeClient(baseUrl, authProvider, options);
  }

  // Resource clients
  /** ALM Integrations API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly almIntegrations: AlmIntegrationsClient;
  /** ALM Settings API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly almSettings: AlmSettingsClient;
  /** Analysis Cache API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly analysisCache: AnalysisCacheClient;
  /** Analysis API v2 - Scanner management and project analysis - **Note**: Only available in SonarQube 10.3+ */
  public readonly analysis: AnalysisClient;
  /** SCA API v2 - Software Composition Analysis and SBOM generation - **Note**: Only available in SonarQube 10.6+ */
  public readonly sca: ScaClient;
  /** Fix Suggestions API v2 - AI-powered code fix suggestions - **Note**: Only available in SonarQube 10.7+ */
  public readonly fixSuggestions: FixSuggestionsClient;
  /** Clean Code Policy API v2 - Create custom code quality rules - **Note**: Only available in SonarQube 10.6+ */
  public readonly cleanCodePolicy: CleanCodePolicyClient;
  /** DOP Translation API v2 - DevOps platform integration and project binding - **Note**: Only available in SonarQube 10.6+ */
  public readonly dopTranslation: DopTranslationClient;
  /** Applications API - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly applications: ApplicationsClient;
  /** Authentication API */
  public readonly authentication: AuthenticationClient;
  /** Authorizations API v2 - Groups and permissions management - **Note**: Only available in SonarQube 10.5+ */
  public readonly authorizations: AuthorizationsClient;
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
  /** Permissions API */
  public readonly permissions: PermissionsClient;
  /** Metrics API */
  public readonly metrics: MetricsClient;
  /** Measures API */
  public readonly measures: MeasuresClient;
  /** New Code Periods API */
  public readonly newCodePeriods: NewCodePeriodsClient;
  /** Audit Logs API - **Note**: Only available in SonarQube Enterprise Edition */
  public readonly auditLogs: AuditLogsClient;
  /** Plugins API - Plugin management functionality - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly plugins: PluginsClient;
  /** Server API - Basic server information - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly server: ServerClient;
  /** Editions API - License management for commercial editions - **Note**: Only available in SonarQube, not in SonarCloud */
  public readonly editions: EditionsClient;
  /** Project Dump API - Project backup and restore operations - **Note**: Only available in SonarQube Enterprise Edition */
  public readonly projectDump: ProjectDumpClient;
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
  /** User Tokens API */
  public readonly userTokens: UserTokensClient;
  /** Webhooks API */
  public readonly webhooks: WebhooksClient;
  /** Webservices API - Get information on the web API supported on this instance */
  public readonly webservices: WebservicesClient;
  /** Views API - Manage portfolios and application views - **Note**: Only available in SonarQube Enterprise Edition and above */
  public readonly views: ViewsClient;

  private readonly baseUrl: string;
  private readonly authProvider: AuthProvider;
  private readonly options: ClientOptions;

  constructor(
    baseUrl: string,
    authProviderOrToken: AuthProvider | string,
    organizationOrOptions?: string | ClientOptions
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');

    // For backward compatibility, accept string token and convert to BearerTokenAuthProvider
    if (typeof authProviderOrToken === 'string') {
      this.authProvider = new BearerTokenAuthProvider(authProviderOrToken);
    } else {
      this.authProvider = authProviderOrToken;
    }

    // Handle backward compatibility
    if (typeof organizationOrOptions === 'string') {
      this.options = { organization: organizationOrOptions };
    } else {
      this.options = organizationOrOptions ?? {};
    }

    // Configure global deprecation settings
    DeprecationManager.configure(this.options);

    // Initialize resource clients
    this.almIntegrations = new AlmIntegrationsClient(this.baseUrl, this.authProvider, this.options);
    this.almSettings = new AlmSettingsClient(this.baseUrl, this.authProvider, this.options);
    this.analysisCache = new AnalysisCacheClient(this.baseUrl, this.authProvider, this.options);
    this.analysis = new AnalysisClient(this.baseUrl, this.authProvider, this.options);
    this.sca = new ScaClient(this.baseUrl, this.authProvider, this.options);
    this.fixSuggestions = new FixSuggestionsClient(this.baseUrl, this.authProvider, this.options);
    this.cleanCodePolicy = new CleanCodePolicyClient(this.baseUrl, this.authProvider, this.options);
    this.dopTranslation = new DopTranslationClient(this.baseUrl, this.authProvider, this.options);
    this.applications = new ApplicationsClient(this.baseUrl, this.authProvider, this.options);
    this.authentication = new AuthenticationClient(this.baseUrl, this.authProvider, this.options);
    this.authorizations = new AuthorizationsClient(this.baseUrl, this.authProvider, this.options);
    this.ce = new CEClient(this.baseUrl, this.authProvider, this.options);
    this.components = new ComponentsClient(this.baseUrl, this.authProvider, this.options);
    this.duplications = new DuplicationsClient(this.baseUrl, this.authProvider, this.options);
    this.favorites = new FavoritesClient(this.baseUrl, this.authProvider, this.options);
    this.issues = new IssuesClient(this.baseUrl, this.authProvider, this.options);
    this.languages = new LanguagesClient(this.baseUrl, this.authProvider, this.options);
    this.hotspots = new HotspotsClient(this.baseUrl, this.authProvider, this.options);
    this.projectBranches = new ProjectBranchesClient(this.baseUrl, this.authProvider, this.options);
    this.notifications = new NotificationsClient(this.baseUrl, this.authProvider, this.options);
    this.projects = new ProjectsClient(this.baseUrl, this.authProvider, this.options);
    this.projectBadges = new ProjectBadgesClient(this.baseUrl, this.authProvider, this.options);
    this.projectAnalyses = new ProjectAnalysesClient(this.baseUrl, this.authProvider, this.options);
    this.projectLinks = new ProjectLinksClient(this.baseUrl, this.authProvider, this.options);
    this.projectPullRequests = new ProjectPullRequestsClient(
      this.baseUrl,
      this.authProvider,
      this.options
    );
    this.permissions = new PermissionsClient(this.baseUrl, this.authProvider, this.options);
    this.metrics = new MetricsClient(this.baseUrl, this.authProvider, this.options);
    this.measures = new MeasuresClient(this.baseUrl, this.authProvider, this.options);
    this.newCodePeriods = new NewCodePeriodsClient(this.baseUrl, this.authProvider, this.options);
    this.auditLogs = new AuditLogsClient(this.baseUrl, this.authProvider, this.options);
    this.plugins = new PluginsClient(this.baseUrl, this.authProvider, this.options);
    this.server = new ServerClient(this.baseUrl, this.authProvider, this.options);
    this.editions = new EditionsClient(this.baseUrl, this.authProvider, this.options);
    this.projectDump = new ProjectDumpClient(this.baseUrl, this.authProvider, this.options);
    this.qualityGates = new QualityGatesClient(this.baseUrl, this.authProvider, this.options);
    this.qualityProfiles = new QualityProfilesClient(this.baseUrl, this.authProvider, this.options);
    this.rules = new RulesClient(this.baseUrl, this.authProvider, this.options);
    this.sources = new SourcesClient(this.baseUrl, this.authProvider, this.options);
    this.system = new SystemClient(this.baseUrl, this.authProvider, this.options);
    this.projectTags = new ProjectTagsClient(this.baseUrl, this.authProvider, this.options);
    this.settings = new SettingsClient(this.baseUrl, this.authProvider, this.options);
    this.users = new UsersClient(this.baseUrl, this.authProvider, this.options);
    this.userTokens = new UserTokensClient(this.baseUrl, this.authProvider, this.options);
    this.webhooks = new WebhooksClient(this.baseUrl, this.authProvider, this.options);
    this.webservices = new WebservicesClient(this.baseUrl, this.authProvider, this.options);
    this.views = new ViewsClient(this.baseUrl, this.authProvider, this.options);
  }

  // Legacy methods for backward compatibility
  public async getProjects(): Promise<ProjectsResponse> {
    const params = new URLSearchParams();
    if (this.options.organization !== undefined && this.options.organization.length > 0) {
      params.append('organization', this.options.organization);
    }
    return this.request<ProjectsResponse>(`/projects/search?${params.toString()}`);
  }

  public async getIssues(projectKey?: string): Promise<IssuesResponse> {
    const params = new URLSearchParams();
    if (this.options.organization !== undefined && this.options.organization.length > 0) {
      params.append('organization', this.options.organization);
    }
    if (projectKey !== undefined && projectKey.length > 0) {
      params.append('componentKeys', projectKey);
    }
    return this.request<IssuesResponse>(`/issues/search?${params.toString()}`);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers = this.authProvider.applyAuth(headers);

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
/* eslint-enable @typescript-eslint/member-ordering */

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

// Re-export types from analysis v2
export type {
  // Request types
  GetActiveRulesV2Request,

  // Response types
  GetActiveRulesV2Response,
  EngineMetadataV2,
  GetJresV2Response,
  VersionV2Response,

  // Data types
  ActiveRuleV2,
  JreMetadataV2,
} from './resources/analysis/types';

// Re-export download types from analysis
export type {
  DownloadOptions,
  DownloadProgress as AnalysisDownloadProgress,
} from './resources/analysis';

// Re-export types from authentication
export type { ValidateResponse } from './resources/authentication/types';

// Re-export types from authorizations
export type {
  // Core v2 types
  GroupV2,
  GroupMembershipV2,
  GroupMemberV2,
  PermissionV2,
  PermissionTypeV2,
  PermissionScope,
  PermissionTemplateV2,
  EffectivePermissionsV2,

  // Request types
  CreateGroupV2Request,
  UpdateGroupV2Request,
  SearchGroupsV2Request,
  SearchGroupMembershipsV2Request,
  AddGroupMembershipV2Request,
  GetGroupPermissionsV2Request,
  GetUserPermissionsV2Request,
  GrantPermissionV2Request,
  SearchPermissionTemplatesV2Request,

  // Response types
  SearchGroupsV2Response,
  SearchGroupMembershipsV2Response,
  GetGroupPermissionsV2Response,
  GetUserPermissionsV2Response,
  SearchPermissionTemplatesV2Response,
} from './resources/authorizations/types';

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

// Re-export types from permissions
export type {
  GlobalPermission,
  ProjectPermission,
  Permission,
  BasePermissionParams,
  ProjectPermissionParams,
  TemplateParams,
  AddUserPermissionRequest,
  RemoveUserPermissionRequest,
  AddUserToTemplateRequest,
  RemoveUserFromTemplateRequest,
  AddGroupPermissionRequest,
  RemoveGroupPermissionRequest,
  AddGroupToTemplateRequest,
  RemoveGroupFromTemplateRequest,
  AddProjectCreatorToTemplateRequest,
  RemoveProjectCreatorFromTemplateRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  DeleteTemplateRequest,
  ApplyTemplateRequest,
  BulkApplyTemplateRequest,
  SetDefaultTemplateRequest,
  SearchGlobalPermissionsRequest,
  SearchProjectPermissionsRequest,
  SearchTemplatesRequest,
  PermissionTemplate,
  TemplatePermission,
  UserPermission,
  GroupPermission,
  CreateTemplateResponse,
  UpdateTemplateResponse,
  SearchGlobalPermissionsResponse,
  SearchProjectPermissionsResponse,
  SearchTemplatesResponse,
} from './resources/permissions/types';

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
  SystemInfo,
  InfoResponse,
} from './resources/system/types';

// Re-export types from system v2
export type {
  SystemInfoV2,
  SystemHealthV2,
  SystemStatusV2Response,
  SystemEdition,
  SystemFeature,
  SystemStatusV2,
  HealthStatus as SystemHealthStatus,
} from './resources/system/types-v2';

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
  // V1 API (deprecated)
  User,
  UserWithDetails,
  UserGroup as UsersUserGroup,
  GroupSelectionFilter,
  SearchUsersRequest,
  SearchUsersResponse,
  GetUserGroupsRequest,
  GetUserGroupsResponse,
  // V2 API
  UserV2,
  SearchUsersV2Request,
  SearchUsersV2Response,
} from './resources/users/types';

// Re-export types from user tokens
export type {
  GenerateTokenRequest,
  GenerateTokenResponse,
  RevokeTokenRequest,
  SearchTokensRequest,
  SearchTokensResponse,
  UserToken,
} from './resources/user-tokens/types';

// Re-export types from webhooks
export type {
  Webhook,
  WebhookDelivery,
  CreateWebhookRequest,
  CreateWebhookResponse,
  DeleteWebhookRequest,
  UpdateWebhookRequest,
  ListWebhooksRequest,
  ListWebhooksResponse,
  GetWebhookDeliveriesRequest,
  GetWebhookDeliveriesResponse,
  GetWebhookDeliveryRequest,
  GetWebhookDeliveryResponse,
} from './resources/webhooks/types';

// Re-export types from webservices
export type {
  ResponseExampleRequest,
  WebServiceAction,
  WebService,
  ListWebservicesResponse,
  ResponseExampleResponse,
} from './resources/webservices/types';

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

// Re-export types from SCA (Software Composition Analysis) v2 API
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
} from './resources/sca/types';

// Re-export DownloadProgress from sca
export type { DownloadProgress } from './resources/sca';

// Re-export SCA utilities
export { SbomFormatConverter, SbomAnalyzer } from './resources/sca/utils';

// Re-export types from Fix Suggestions v2 API
export type {
  // Request types
  GetIssueAvailabilityV2Request,
  RequestAiSuggestionsV2Request,

  // Response types
  FixSuggestionAvailabilityV2Response,
  AiSuggestionResponseV2,
  AiFixSuggestionV2,
  AiCodeChangeV2,

  // Builder types
  GetIssueAvailabilityV2Builder,
  RequestAiSuggestionsV2Builder,

  // Utility types
  FixApplicationOptions,
  FixValidationResult,
  FixRankingCriteria,
  AiModelCapabilities,
  FixSuggestionStats,

  // Error types
  AiServiceError,
  FixGenerationFailure,

  // Integration types
  IssueIntegrationOptions,
  BatchProcessingOptions,
  BatchFixResult,

  // Convenience unions
  FixSuggestionUnavailableReason,
  FixStyle,
  FixComplexity,
  FixEffort,
  ChangeType,
  ValidationMode,
  ConflictResolution,
  Priority,
  RiskLevel,
} from './resources/fix-suggestions/types';

// Re-export Fix Suggestions utilities
export { FixSuggestionUtils, FixSuggestionIntegration } from './resources/fix-suggestions/utils';

// Re-export types from DOP Translation v2 API
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
  QualityGateStatus as DopQualityGateStatus,
  QualityGateCondition as DopQualityGateCondition,
  BranchInfo as DopBranchInfo,

  // Binding and platform types
  DopBinding,
  PlatformConfiguration,
  PlatformEndpoints,
  RateLimitConfig,
  WebhookConfig,

  // Builder interfaces
  CreateBoundProjectV2Builder,

  // Validation types
  ValidationResult as DopValidationResult,
  ValidationError as DopValidationError,
  ValidationWarning as DopValidationWarning,
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
} from './resources/dop-translation/types';

// Re-export DOP Translation enums
export {
  DevOpsPlatform,
  ProjectBindingStatus,
  PlatformStatus,
  SyncStatus,
  ProjectVisibility as DopProjectVisibility,
  AuthenticationType,
} from './resources/dop-translation/types';

// Re-export DOP Translation utilities
export {
  PlatformDetector,
  ConfigurationValidator,
  ProjectMapper,
  AuthenticationHelper,
  ConfigurationTemplates,
} from './resources/dop-translation/utils';

// Re-export New Code Periods types and enums
export type {
  NewCodePeriod,
  BranchNewCodePeriod,
  ListNewCodePeriodsRequest,
  ListNewCodePeriodsResponse,
  SetNewCodePeriodRequest,
  SetNewCodePeriodResponse,
  UnsetNewCodePeriodRequest,
} from './resources/new-code-periods/types';

export { NewCodePeriodType } from './resources/new-code-periods/types';

// Re-export Audit Logs types
export type {
  AuditEventCategory,
  AuditEventAction,
  AuditLogEntry,
  SearchAuditLogsRequest,
  SearchAuditLogsResponse,
  DownloadAuditLogsRequest,
  DownloadAuditLogsResponse,
} from './resources/audit-logs/types';

// Re-export Plugins types
export type {
  PluginUpdateStatus,
  Plugin,
  AvailablePlugin,
  InstalledPlugin,
  PendingPlugin,
  PluginUpdate,
  GetAvailablePluginsRequest,
  GetAvailablePluginsResponse,
  InstallPluginRequest,
  GetInstalledPluginsRequest,
  GetInstalledPluginsResponse,
  GetPendingPluginsResponse,
  UninstallPluginRequest,
  UpdatePluginRequest,
  GetPluginUpdatesResponse,
} from './resources/plugins/types';

// Re-export Editions types
export type { ActivateGracePeriodRequest, SetLicenseRequest } from './resources/editions/types';

// Re-export Project Dump types
export type {
  ExportProjectDumpRequest,
  ImportProjectDumpRequest,
} from './resources/project-dump/types';

// Re-export Views types
export type {
  AddApplicationRequest,
  AddApplicationBranchRequest,
  ShowPortfolioRequest,
  ShowPortfolioResponse,
  UpdatePortfolioRequest,
  PortfolioComponent,
} from './resources/views/types';

// Re-export deprecation management
export { DeprecationManager, deprecated } from './core/deprecation';
export type { DeprecationContext, DeprecationOptions } from './core/deprecation';
export type { ClientOptions } from './core/BaseClient';

// Re-export authentication
export type { AuthProvider } from './core/auth';
export {
  BearerTokenAuthProvider,
  BasicAuthProvider,
  PasscodeAuthProvider,
  NoAuthProvider,
} from './core/auth';
