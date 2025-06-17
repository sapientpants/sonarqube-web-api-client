# SonarQube Web API Client - Comprehensive API Reference for LLMs

This document provides complete API documentation for the sonarqube-web-api-client TypeScript library, optimized for consumption by LLMs and AI agents.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Client Initialization](#client-initialization)
4. [Complete API Reference](#complete-api-reference)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Builder Patterns](#builder-patterns)
8. [Advanced Patterns](#advanced-patterns)
9. [API Compatibility Matrix](#api-compatibility-matrix)

## Quick Start

### Installation

```bash
npm install sonarqube-web-api-client
# or
pnpm add sonarqube-web-api-client
# or
yarn add sonarqube-web-api-client
```

### Basic Usage

```typescript
import { SonarQubeClient } from 'sonarqube-web-api-client';

// Initialize with Bearer token (SonarQube 10.0+)
const client = SonarQubeClient.withToken('https://sonarqube.example.com', 'your-token');

// Initialize with Basic Auth (SonarQube < 10.0)
const client = SonarQubeClient.withBasicAuth('https://sonarqube.example.com', 'token-as-username');

// Initialize for SonarCloud with organization
const client = SonarQubeClient.withToken('https://sonarcloud.io', 'your-token', {
  organization: 'your-org'
});

// Basic API calls
const projects = await client.projects.search().execute();
const issues = await client.issues.search().withProjects(['my-project']).execute();
```

## Authentication

### Authentication Methods

#### 1. Bearer Token (Recommended for SonarQube 10.0+)

```typescript
const client = SonarQubeClient.withToken('https://sonarqube.example.com', 'your-token');
```

#### 2. Basic Authentication

```typescript
// Token as username (SonarQube < 10.0)
const client = SonarQubeClient.withBasicAuth('https://sonarqube.example.com', 'your-token');

// Username and password
const client = SonarQubeClient.withBasicAuth('https://sonarqube.example.com', 'username', 'password');
```

#### 3. System Passcode

```typescript
const client = SonarQubeClient.withPasscode('https://sonarqube.example.com', 'system-passcode');
```

#### 4. Custom Authentication

```typescript
import { AuthProvider } from 'sonarqube-web-api-client';

const customAuth: AuthProvider = {
  applyAuth(headers: Headers): Headers {
    headers.set('X-Custom-Auth', 'custom-value');
    return headers;
  },
  getAuthType(): 'bearer' | 'basic' | 'passcode' | 'none' {
    return 'bearer';
  }
};

const client = SonarQubeClient.withAuth('https://sonarqube.example.com', customAuth);
```

### Client Options

```typescript
interface ClientOptions {
  organization?: string; // For SonarCloud
  suppressDeprecationWarnings?: boolean;
  deprecationHandler?: (context: DeprecationContext) => void;
}

// Example with options
const client = SonarQubeClient.withToken('https://sonarcloud.io', 'token', {
  organization: 'my-org',
  suppressDeprecationWarnings: true
});
```

## Client Initialization

### Main Client Class

```typescript
class SonarQubeClient {
  // Factory methods
  static withToken(baseUrl: string, token: string, options?: ClientOptions): SonarQubeClient;
  static withBasicAuth(baseUrl: string, username: string, password?: string, options?: ClientOptions): SonarQubeClient;
  static withPasscode(baseUrl: string, passcode: string, options?: ClientOptions): SonarQubeClient;
  static withAuth(baseUrl: string, authProvider: AuthProvider, options?: ClientOptions): SonarQubeClient;

  // Resource clients (45+ available)
  almIntegrations: AlmIntegrationsClient;
  almSettings: AlmSettingsClient;
  analysisCache: AnalysisCacheClient;
  analysis: AnalysisClient;
  applications: ApplicationsClient;
  auditLogs: AuditLogsClient;
  authentication: AuthenticationClient;
  authorizations: AuthorizationsClient;
  ce: CEClient;
  cleanCodePolicy: CleanCodePolicyClient;
  components: ComponentsClient;
  dopTranslation: DopTranslationClient;
  duplications: DuplicationsClient;
  editions: EditionsClient;
  favorites: FavoritesClient;
  fixSuggestions: FixSuggestionsClient;
  hotspots: HotspotsClient;
  issues: IssuesClient;
  languages: LanguagesClient;
  measures: MeasuresClient;
  metrics: MetricsClient;
  newCodePeriods: NewCodePeriodsClient;
  notifications: NotificationsClient;
  permissions: PermissionsClient;
  plugins: PluginsClient;
  projectAnalyses: ProjectAnalysesClient;
  projectBadges: ProjectBadgesClient;
  projectBranches: ProjectBranchesClient;
  projectDump: ProjectDumpClient;
  projectLinks: ProjectLinksClient;
  projectPullRequests: ProjectPullRequestsClient;
  projectTags: ProjectTagsClient;
  projects: ProjectsClient;
  qualityGates: QualityGatesClient;
  qualityProfiles: QualityProfilesClient;
  rules: RulesClient;
  sca: ScaClient;
  server: ServerClient;
  settings: SettingsClient;
  sources: SourcesClient;
  system: SystemClient;
  userTokens: UserTokensClient;
  users: UsersClient;
  views: ViewsClient;
  webhooks: WebhooksClient;
  webservices: WebservicesClient;
}
```

## Complete API Reference

### ALM Integrations API
**Availability**: SonarQube only  
**Client**: `client.almIntegrations`

#### Methods

##### searchAzureRepos()
Search Azure DevOps repositories.

```typescript
const repos = await client.almIntegrations.searchAzureRepos()
  .almSetting('azure-config-key')
  .projectName('MyProject')
  .searchName('api')
  .execute();
```

**Builder Methods**:
- `almSetting(key: string)` - ALM setting key (required)
- `projectName(name: string)` - Azure project name
- `searchName(query: string)` - Repository search query

**Returns**: `Promise<SearchAzureReposResponse>`

##### searchBitbucketRepos()
Search Bitbucket Data Center repositories.

```typescript
const repos = await client.almIntegrations.searchBitbucketRepos()
  .almSetting('bitbucket-config-key')
  .projectName('PROJ')
  .repositoryName('api')
  .execute();
```

**Builder Methods**:
- `almSetting(key: string)` - ALM setting key (required)
- `projectName(name: string)` - Bitbucket project key
- `repositoryName(name: string)` - Repository search query

**Returns**: `Promise<SearchBitbucketReposResponse>`

##### searchBitbucketCloudRepos()
Search Bitbucket Cloud repositories.

```typescript
const repos = await client.almIntegrations.searchBitbucketCloudRepos()
  .almSetting('bitbucket-cloud-key')
  .repositoryName('api')
  .pageSize(50)
  .page(1)
  .execute();
```

**Builder Methods**:
- `almSetting(key: string)` - ALM setting key (required)
- `repositoryName(name: string)` - Repository search query
- `pageSize(size: number)` - Page size (1-100)
- `page(page: number)` - Page number

**Returns**: `Promise<SearchBitbucketCloudReposResponse>`

##### importAzureProject(params)
Import a project from Azure DevOps.

```typescript
await client.almIntegrations.importAzureProject({
  almSetting: 'azure-config-key',
  projectName: 'MyAzureProject',
  repositoryName: 'my-repo',
  newCodeDefinitionType: 'NUMBER_OF_DAYS',
  newCodeDefinitionValue: '30'
});
```

**Parameters**:
```typescript
interface ImportAzureProjectRequest {
  almSetting: string;
  projectName: string;
  repositoryName: string;
  newCodeDefinitionType?: NewCodeDefinitionType;
  newCodeDefinitionValue?: string;
}
```

##### importBitbucketProject(params)
Import a project from Bitbucket Data Center.

```typescript
await client.almIntegrations.importBitbucketProject({
  almSetting: 'bitbucket-config-key',
  projectKey: 'PROJ',
  repositorySlug: 'my-repo'
});
```

##### importBitbucketCloudRepo(params)
Import a repository from Bitbucket Cloud.

```typescript
await client.almIntegrations.importBitbucketCloudRepo({
  almSetting: 'bitbucket-cloud-key',
  repositorySlug: 'my-repo'
});
```

##### importGitHubProject(params)
Import a project from GitHub.

```typescript
await client.almIntegrations.importGitHubProject({
  almSetting: 'github-config-key',
  repositoryKey: 'myorg/myrepo'
});
```

##### importGitLabProject(params)
Import a project from GitLab.

```typescript
await client.almIntegrations.importGitLabProject({
  almSetting: 'gitlab-config-key',
  gitlabProjectId: '12345'
});
```

### ALM Settings API
**Availability**: SonarQube only  
**Client**: `client.almSettings`

#### Methods

##### createAzure(params)
Create Azure DevOps ALM settings.

```typescript
const setting = await client.almSettings.createAzure({
  key: 'azure-prod',
  personalAccessToken: 'token',
  url: 'https://dev.azure.com/myorg'
});
```

##### createBitbucket(params)
Create Bitbucket Data Center ALM settings.

```typescript
const setting = await client.almSettings.createBitbucket({
  key: 'bitbucket-dc',
  url: 'https://bitbucket.company.com',
  personalAccessToken: 'token'
});
```

##### createBitbucketCloud(params)
Create Bitbucket Cloud ALM settings.

```typescript
const setting = await client.almSettings.createBitbucketCloud({
  key: 'bitbucket-cloud',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  workspace: 'my-workspace'
});
```

##### createGitHub(params)
Create GitHub ALM settings.

```typescript
const setting = await client.almSettings.createGitHub({
  key: 'github-prod',
  url: 'https://github.com',
  appId: '12345',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  privateKey: 'private-key-content',
  webhookSecret: 'webhook-secret'
});
```

##### createGitLab(params)
Create GitLab ALM settings.

```typescript
const setting = await client.almSettings.createGitLab({
  key: 'gitlab-prod',
  url: 'https://gitlab.com',
  personalAccessToken: 'token'
});
```

##### list(params?)
List ALM settings.

```typescript
const settings = await client.almSettings.list({ project: 'my-project' });
```

##### countBinding(params)
Count project bindings for an ALM setting.

```typescript
const count = await client.almSettings.countBinding({ almSetting: 'github-prod' });
console.log(`${count.projects} projects bound`);
```

##### getBinding(params)
Get ALM binding for a project.

```typescript
const binding = await client.almSettings.getBinding({ project: 'my-project' });
```

##### deleteBinding(params)
Delete ALM binding for a project.

```typescript
await client.almSettings.deleteBinding({ project: 'my-project' });
```

##### setAzureBinding(params)
Set Azure DevOps binding for a project.

```typescript
await client.almSettings.setAzureBinding({
  almSetting: 'azure-prod',
  project: 'my-project',
  projectName: 'MyAzureProject',
  repositoryName: 'my-repo'
});
```

##### validate(params)
Validate ALM settings configuration.

```typescript
const validation = await client.almSettings.validate({ almSetting: 'github-prod' });
if (validation.errors) {
  console.log('Validation errors:', validation.errors);
}
```

### Analysis API (v2)
**Availability**: SonarQube 10.3+  
**Client**: `client.analysis`

#### Methods

##### getActiveRules(params)
Get active rules for project analysis.

```typescript
const rules = await client.analysis.getActiveRules({
  project: 'my-project',
  branch: 'main',
  language: 'java'
});
```

##### downloadScannerEngine(options?)
Download scanner engine with progress tracking.

```typescript
const download = await client.analysis.downloadScannerEngine({
  version: 'latest',
  onProgress: (loaded, total) => {
    console.log(`Progress: ${Math.round(loaded/total*100)}%`);
  }
});
```

##### getScannerEngineMetadata(params?)
Get scanner engine metadata.

```typescript
const metadata = await client.analysis.getScannerEngineMetadata({
  version: '4.8.0.2856'
});
```

##### listJreVersions(params?)
List available JRE versions.

```typescript
const jres = await client.analysis.listJreVersions({
  platform: 'linux-x64'
});
```

##### downloadJre(options)
Download JRE for scanner.

```typescript
const jre = await client.analysis.downloadJre({
  version: '11.0.19',
  platform: 'linux-x64',
  onProgress: (loaded, total) => {
    console.log(`JRE download: ${Math.round(loaded/total*100)}%`);
  }
});
```

##### getServerVersion()
Get server version information.

```typescript
const version = await client.analysis.getServerVersion();
console.log(`SonarQube ${version.version} (${version.build})`);
```

### Analysis Cache API
**Availability**: SonarQube only  
**Client**: `client.analysisCache`

#### Methods

##### get(params)
Get analysis cache data.

```typescript
const cache = await client.analysisCache.get({
  project: 'my-project',
  branch: 'main'
});
```

### Applications API
**Availability**: SonarQube only  
**Client**: `client.applications`

#### Methods

##### create(params)
Create a new application.

```typescript
const app = await client.applications.create({
  name: 'My Application',
  key: 'my-app',
  description: 'Application portfolio',
  visibility: 'private'
});
```

##### delete(params)
Delete an application.

```typescript
await client.applications.delete({ application: 'my-app' });
```

##### show(params)
Get application details.

```typescript
const app = await client.applications.show({ 
  application: 'my-app',
  branch: 'main' 
});
```

##### update(params)
Update application properties.

```typescript
await client.applications.update({
  application: 'my-app',
  name: 'Updated Application Name',
  description: 'Updated description'
});
```

##### addProject(params)
Add a project to an application.

```typescript
await client.applications.addProject({
  application: 'my-app',
  project: 'my-project'
});
```

##### removeProject(params)
Remove a project from an application.

```typescript
await client.applications.removeProject({
  application: 'my-app',
  project: 'my-project'
});
```

##### createBranch(params)
Create an application branch.

```typescript
await client.applications.createBranch({
  application: 'my-app',
  branch: 'release-1.0',
  project: ['project1:branch1', 'project2:branch2']
});
```

##### deleteBranch(params)
Delete an application branch.

```typescript
await client.applications.deleteBranch({
  application: 'my-app',
  branch: 'old-branch'
});
```

##### updateBranch(params)
Update application branch configuration.

```typescript
await client.applications.updateBranch({
  application: 'my-app',
  branch: 'release-1.0',
  name: 'release-1.1',
  project: ['project1:new-branch']
});
```

##### setTags(params)
Set tags on an application.

```typescript
await client.applications.setTags({
  application: 'my-app',
  tags: 'production,critical'
});
```

### Audit Logs API
**Availability**: SonarQube Enterprise Edition only  
**Client**: `client.auditLogs`

#### Methods

##### isAvailable()
Check if audit logs are available.

```typescript
const available = await client.auditLogs.isAvailable();
if (!available) {
  console.log('Audit logs require Enterprise Edition');
}
```

##### search(params?)
Search audit logs with filtering.

```typescript
const logs = await client.auditLogs.search({
  from: '2024-01-01',
  to: '2024-12-31',
  category: 'PROJECT',
  pageSize: 50
});
```

##### searchAll(params?)
Iterate through all audit logs.

```typescript
for await (const log of client.auditLogs.searchAll({
  from: '2024-01-01',
  category: 'USER'
})) {
  console.log(`${log.date}: ${log.action} by ${log.author}`);
}
```

##### download(params?)
Download audit logs as file.

```typescript
const auditData = await client.auditLogs.download({
  from: '2024-01-01',
  to: '2024-12-31',
  format: 'JSON'
});
```

### Authentication API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.authentication`

#### Methods

##### validate()
Validate current authentication.

```typescript
const validation = await client.authentication.validate();
if (validation.valid) {
  console.log('Authentication is valid');
}
```

##### logout()
Logout current user session.

```typescript
await client.authentication.logout();
```

### Authorizations API (v2)
**Availability**: SonarQube 10.5+  
**Client**: `client.authorizations`

#### Methods

##### searchGroupsV2()
Search groups with advanced filtering.

```typescript
const groups = await client.authorizations.searchGroupsV2()
  .query('developers')
  .managed(false)
  .includeDefault(true)
  .pageSize(50)
  .execute();
```

**Builder Methods**:
- `query(q: string)` - Search query
- `managed(value: boolean)` - Filter managed groups
- `includeDefault(value: boolean)` - Include default groups
- `externalProvider(provider: string)` - Filter by external provider
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### createGroupV2(params)
Create a new group.

```typescript
const group = await client.authorizations.createGroupV2({
  name: 'frontend-team',
  description: 'Frontend development team',
  default: false
});
```

##### updateGroupV2(id, params)
Update an existing group.

```typescript
const updated = await client.authorizations.updateGroupV2('group-uuid', {
  name: 'senior-frontend-team',
  description: 'Senior frontend developers'
});
```

##### deleteGroupV2(id)
Delete a group.

```typescript
await client.authorizations.deleteGroupV2('group-uuid');
```

##### searchGroupMembershipsV2()
Search group memberships.

```typescript
const memberships = await client.authorizations.searchGroupMembershipsV2()
  .groupId('group-uuid')
  .execute();
```

##### addGroupMembershipV2(params)
Add user to group.

```typescript
const membership = await client.authorizations.addGroupMembershipV2({
  groupId: 'group-uuid',
  userId: 'user-uuid'
});
```

##### removeGroupMembershipV2(id)
Remove user from group.

```typescript
await client.authorizations.removeGroupMembershipV2('membership-uuid');
```

##### getGroupPermissionsV2(params)
Get permissions for a group.

```typescript
const permissions = await client.authorizations.getGroupPermissionsV2({
  groupId: 'group-uuid',
  project: 'my-project'
});
```

##### getGroupPermissionsV2(params)
Get permissions for a user.

```typescript
const permissions = await client.authorizations.getUserPermissionsV2({
  userId: 'user-uuid',
  project: 'my-project'
});
```

##### grantPermissionV2(params)
Grant permission to group or user.

```typescript
await client.authorizations.grantPermissionV2({
  permission: 'admin',
  groupId: 'group-uuid',
  project: 'my-project'
});
```

##### searchPermissionTemplatesV2()
Search permission templates.

```typescript
const templates = await client.authorizations.searchPermissionTemplatesV2()
  .query('mobile')
  .execute();
```

### CE (Compute Engine) API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.ce`

#### Methods

##### activity()
Get background task activity.

```typescript
const activity = await client.ce.activity()
  .component('my-project')
  .type('REPORT')
  .status('FAILED')
  .pageSize(50)
  .execute();
```

**Builder Methods**:
- `component(key: string)` - Component key
- `type(type: TaskType)` - Task type
- `status(status: TaskStatus)` - Task status
- `onlyCurrents(value: boolean)` - Only current tasks
- `minSubmittedAt(date: string)` - Minimum submission date
- `maxExecutedAt(date: string)` - Maximum execution date
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### activityStatus(params?)
Get activity statistics.

```typescript
const status = await client.ce.activityStatus({ component: 'my-project' });
console.log(`${status.pending} pending, ${status.inProgress} in progress`);
```

##### task(params)
Get details of a specific task.

```typescript
const task = await client.ce.task({
  id: 'AU-Tpxb--iU5OvuD2FLy'
});
```

##### componentTasks(params?)
Get tasks for a component.

```typescript
const tasks = await client.ce.componentTasks({
  component: 'my-project'
});
```

### Clean Code Policy API (v2)
**Availability**: SonarQube 10.6+  
**Client**: `client.cleanCodePolicy`

#### Methods

##### getSettings()
Get clean code policy settings.

```typescript
const settings = await client.cleanCodePolicy.getSettings();
```

##### listRules()
List clean code policy rules.

```typescript
const rules = await client.cleanCodePolicy.listRules();
```

##### createRule(params)
Create a custom clean code rule.

```typescript
const rule = await client.cleanCodePolicy.createRule({
  name: 'Custom Rule',
  key: 'custom-rule',
  description: 'Custom clean code rule',
  severity: 'MAJOR'
});
```

##### updateRule(id, params)
Update a clean code rule.

```typescript
await client.cleanCodePolicy.updateRule('rule-id', {
  severity: 'CRITICAL',
  description: 'Updated description'
});
```

##### deleteRule(id)
Delete a clean code rule.

```typescript
await client.cleanCodePolicy.deleteRule('rule-id');
```

### Components API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.components`

#### Methods

##### show(key)
Get component details with ancestors.

```typescript
const result = await client.components.show('my-project:src/main.ts');
console.log('Component:', result.component);
console.log('Ancestors:', result.ancestors);
```

##### search()
Search for components.

```typescript
const components = await client.components.search()
  .qualifiers(['TRK', 'APP'])
  .query('api')
  .pageSize(50)
  .execute();
```

**Builder Methods**:
- `qualifiers(qualifiers: ComponentQualifier[])` - Component types
- `query(q: string)` - Search query
- `language(lang: string)` - Programming language
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### tree()
Navigate component tree.

```typescript
const files = await client.components.tree()
  .component('my-project')
  .filesOnly()
  .sortByPath()
  .execute();

// Iterate all files
for await (const file of client.components.tree()
  .component('my-project')
  .filesOnly()
  .all()) {
  console.log(file.path);
}
```

**Builder Methods**:
- `component(key: string)` - Root component (required)
- `branch(name: string)` - Branch name
- `pullRequest(id: string)` - Pull request ID
- `query(q: string)` - Search query
- `qualifiers(qualifiers: ComponentQualifier[])` - Filter by type
- `strategy(strategy: ComponentTreeStrategy)` - Tree strategy
- `asc(value: boolean)` - Sort ascending
- `metricSort(metric: string)` - Sort by metric
- `metricPeriodSort(value: number)` - Sort by period
- `metricSortFilter(filter: 'all' | 'withMeasuresOnly')` - Metric filter
- `sortField(field: ComponentSortField)` - Sort field
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number
- `filesOnly()` - Only files
- `directoriesOnly()` - Only directories
- `leavesOnly()` - Only leaf components
- `childrenOnly()` - Direct children only
- `sortByName()` - Sort by name
- `sortByPath()` - Sort by path
- `sortByQualifier()` - Sort by type

### DOP Translation API (v2)
**Availability**: SonarQube 10.4+  
**Client**: `client.dopTranslation`

#### Methods

##### getDopSettings()
Get DevOps platform settings.

```typescript
const settings = await client.dopTranslation.getDopSettings();
```

##### createBoundProject()
Create project binding to DevOps platform.

```typescript
const project = await client.dopTranslation.createBoundProject()
  .dopSettingId('github-setting-id')
  .repositoryIdentifier('myorg/myrepo')
  .projectKey('my-project')
  .projectName('My Project')
  .execute();
```

**Builder Methods**:
- `dopSettingId(id: string)` - DevOps platform setting ID
- `repositoryIdentifier(id: string)` - Repository identifier
- `projectKey(key: string)` - SonarQube project key
- `projectName(name: string)` - SonarQube project name
- `mainBranchName(name: string)` - Main branch name
- `newCodeDefinition(type: string, value?: string)` - New code definition

### Duplications API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.duplications`

#### Methods

##### show(params)
Get duplications for a file.

```typescript
const duplications = await client.duplications.show({
  key: 'my-project:src/main.ts',
  branch: 'main'
});

console.log(`Found ${duplications.duplications.length} duplication sets`);
duplications.duplications.forEach(dup => {
  console.log(`Duplication: ${dup.blocks.length} blocks`);
});
```

### Editions API
**Availability**: SonarQube only  
**Client**: `client.editions`

#### Methods

##### setLicense(params)
Set SonarQube license.

```typescript
await client.editions.setLicense({
  license: 'license-key-content'
});
```

##### activateGracePeriod()
Activate grace period for license expiration.

```typescript
await client.editions.activateGracePeriod();
```

### Favorites API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.favorites`

#### Methods

##### add(params)
Add component to favorites.

```typescript
await client.favorites.add({ component: 'my-project' });
```

##### remove(params)
Remove component from favorites.

```typescript
await client.favorites.remove({ component: 'my-project' });
```

##### search()
Search favorites with pagination.

```typescript
const favorites = await client.favorites.search()
  .pageSize(50)
  .execute();

// Iterate all favorites
for await (const favorite of client.favorites.searchAll()) {
  console.log(`Favorite: ${favorite.name} (${favorite.key})`);
}
```

### Fix Suggestions API (v2)
**Availability**: SonarQube 10.2+  
**Client**: `client.fixSuggestions`

#### Methods

##### checkAvailability()
Check if fix suggestions are available for an issue.

```typescript
const available = await client.fixSuggestions.checkAvailability()
  .issueId('issue-uuid')
  .execute();

if (available.isAvailable) {
  console.log('Fix suggestions available');
}
```

##### requestAiSuggestions()
Request AI-powered fix suggestions.

```typescript
const suggestions = await client.fixSuggestions.requestAiSuggestions()
  .issueId('issue-uuid')
  .execute();

suggestions.aiSuggestions.forEach(suggestion => {
  console.log(`Suggestion: ${suggestion.explanation}`);
  suggestion.changes.forEach(change => {
    console.log(`  File: ${change.filePath}`);
    console.log(`  Code: ${change.newCode}`);
  });
});
```

### Hotspots API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.hotspots`

#### Methods

##### search()
Search security hotspots.

```typescript
const hotspots = await client.hotspots.search()
  .forProject('my-project')
  .needingReview()
  .onlyMine()
  .sinceLeakPeriod()
  .pageSize(50)
  .execute();

// Iterate all hotspots
for await (const hotspot of client.hotspots.search()
  .forProject('my-project')
  .needingReview()
  .all()) {
  console.log(`Hotspot: ${hotspot.message}`);
}
```

**Builder Methods**:
- `forProject(key: string)` - Project key (required)
- `withBranch(branch: string)` - Branch name
- `withPullRequest(pr: string)` - Pull request ID
- `withStatus(status: 'TO_REVIEW' | 'REVIEWED')` - Status filter
- `withResolution(resolution: 'FIXED' | 'SAFE')` - Resolution filter
- `inFiles(files: string[])` - File paths filter
- `onlyMine()` - Only assigned to current user
- `sinceLeakPeriod()` - Since new code period
- `inNewCodePeriod()` - In new code period
- `needingReview()` - Status TO_REVIEW
- `reviewed()` - Status REVIEWED
- `fixed()` - Resolution FIXED
- `safe()` - Resolution SAFE
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### show(params)
Get hotspot details.

```typescript
const hotspot = await client.hotspots.show({
  hotspot: 'hotspot-key-123'
});
```

##### changeStatus(params)
Change hotspot status.

```typescript
await client.hotspots.changeStatus({
  hotspot: 'hotspot-key-123',
  status: 'REVIEWED',
  resolution: 'FIXED',
  comment: 'Issue has been addressed'
});
```

### Issues API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.issues`

#### Methods

##### search()
Search issues with advanced filtering.

```typescript
const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL', 'MAJOR'])
  .withTypes(['BUG', 'VULNERABILITY'])
  .createdAfter('2024-01-01')
  .assignedTo('john.doe')
  .sortBy('SEVERITY')
  .execute();

// Iterate all issues
for await (const issue of client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL'])
  .all()) {
  console.log(`Issue: ${issue.key} - ${issue.message}`);
}
```

**Builder Methods**:
- `withAdditionalFields(fields: string[])` - Additional fields to return
- `asc(value: boolean)` - Sort ascending
- `assigned(value: boolean)` - Filter assigned/unassigned
- `withAssignees(assignees: string[])` - Filter by assignees
- `withAuthors(authors: string[])` - Filter by authors
- `withBranch(branch: string)` - Branch name
- `withComponentKeys(keys: string[])` - Component keys
- `withComponents(components: string[])` - Component keys (alias)
- `withFiles(files: string[])` - File paths
- `withDirectories(dirs: string[])` - Directory paths
- `createdAfter(date: string)` - Created after date
- `createdAt(date: string)` - Created at date
- `createdBefore(date: string)` - Created before date
- `createdInLast(period: string)` - Created in last period
- `withCwe(cwe: string[])` - CWE identifiers
- `facetMode(mode: FacetMode)` - Facet computation mode
- `withFacets(facets: string[])` - Enable facets
- `withImpactSeverities(severities: ImpactSeverity[])` - Impact severities
- `withImpactSoftwareQualities(qualities: ImpactSoftwareQuality[])` - Software qualities
- `inNewCodePeriod(value: boolean)` - In new code period
- `withIssues(keys: string[])` - Specific issue keys
- `withLanguages(languages: string[])` - Programming languages
- `onComponentOnly(value: boolean)` - Only on specified components
- `withOwaspTop10(categories: string[])` - OWASP Top 10
- `withOwaspTop10_2021(categories: string[])` - OWASP Top 10 2021
- `withPullRequest(pr: string)` - Pull request ID
- `resolved(value: boolean)` - Resolved status
- `withResolutions(resolutions: IssueResolution[])` - Resolutions
- `withRules(rules: string[])` - Rule keys
- `withSansTop25(categories: string[])` - SANS Top 25
- `withScopes(scopes: IssueScope[])` - Issue scopes
- `withSeverities(severities: IssueSeverity[])` - Severities
- `sinceLeakPeriod(value: boolean)` - Since leak period
- `withSonarsourceSecurity(categories: string[])` - Security categories
- `withStatuses(statuses: IssueStatus[])` - Issue statuses
- `withTags(tags: string[])` - Issue tags
- `withTypes(types: IssueType[])` - Issue types
- `assignedToMe()` - Assigned to current user
- `sortBy(field: string)` - Sort field
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### addComment(params)
Add comment to issue.

```typescript
const response = await client.issues.addComment({
  issue: 'issue-key-123',
  text: 'This needs immediate attention'
});
```

##### assign(params)
Assign or unassign issue.

```typescript
// Assign to user
await client.issues.assign({
  issue: 'issue-key-123',
  assignee: 'john.doe'
});

// Unassign
await client.issues.assign({
  issue: 'issue-key-123'
});
```

##### doTransition(params)
Perform workflow transition.

```typescript
await client.issues.doTransition({
  issue: 'issue-key-123',
  transition: 'confirm'
});

// Available transitions: 'confirm', 'unconfirm', 'reopen', 'resolve', 'falsepositive', 'wontfix', 'close'
```

##### setTags(params)
Set issue tags.

```typescript
await client.issues.setTags({
  issue: 'issue-key-123',
  tags: ['security', 'critical', 'production']
});
```

### Languages API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.languages`

#### Methods

##### list(params?)
List supported programming languages.

```typescript
const languages = await client.languages.list();

// Filter languages
const javaLangs = await client.languages.list({ q: 'java' });

// Limit results
const someLanguages = await client.languages.list({ ps: 10 });
```

##### listAll(params?)
Iterate all languages.

```typescript
for await (const language of client.languages.listAll()) {
  console.log(`Language: ${language.name} (${language.key})`);
}
```

### Measures API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.measures`

#### Methods

##### component(params)
Get measures for a component.

```typescript
const measures = await client.measures.component({
  component: 'my-project',
  metricKeys: ['coverage', 'bugs', 'vulnerabilities', 'code_smells']
});

measures.component.measures.forEach(measure => {
  console.log(`${measure.metric}: ${measure.value}`);
});
```

##### componentsTree()
Get measures for component tree.

```typescript
const tree = await client.measures.componentsTree()
  .component('my-project')
  .metricKeys(['coverage', 'lines'])
  .filesOnly()
  .sortByMetric('coverage')
  .metricSortFilter('withMeasuresOnly')
  .execute();
```

**Builder Methods**:
- `component(key: string)` - Root component (required)
- `metricKeys(keys: string[])` - Metrics to retrieve (required)
- `additionalFields(fields: MeasuresAdditionalField[])` - Additional fields
- `branch(name: string)` - Branch name
- `pullRequest(id: string)` - Pull request ID
- `query(q: string)` - Search query
- `qualifiers(qualifiers: ComponentQualifier[])` - Component types
- `strategy(strategy: ComponentTreeStrategy)` - Tree strategy
- `asc(value: boolean)` - Sort ascending
- `metricPeriodSort(value: number)` - Sort by period
- `metricSort(metric: string)` - Sort by metric
- `metricSortFilter(filter: 'all' | 'withMeasuresOnly')` - Metric filter
- `sortField(field: string)` - Sort field
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number
- `filesOnly()` - Only files
- `directoriesOnly()` - Only directories
- `leavesOnly()` - Only leaves
- `sortByMetric(metric: string)` - Sort by specific metric
- `sortByName()` - Sort by name
- `sortByPath()` - Sort by path
- `sortByQualifier()` - Sort by qualifier

##### history(params)
Get measure history.

```typescript
const history = await client.measures.history({
  component: 'my-project',
  metrics: ['coverage', 'bugs'],
  from: '2024-01-01',
  to: '2024-12-31'
});

history.measures.forEach(measure => {
  console.log(`${measure.metric} history:`);
  measure.history.forEach(point => {
    console.log(`  ${point.date}: ${point.value}`);
  });
});
```

### Metrics API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.metrics`

#### Methods

##### search(params?)
Search available metrics.

```typescript
const metrics = await client.metrics.search({
  f: 'name,description,domain,type',
  ps: 100
});

metrics.metrics.forEach(metric => {
  console.log(`${metric.key}: ${metric.name} (${metric.type})`);
});
```

##### types()
Get metric types.

```typescript
const types = await client.metrics.types();
console.log('Available metric types:', types.types);
```

##### domains()
Get metric domains (deprecated).

```typescript
const domains = await client.metrics.domains();
console.log('Metric domains:', domains.domains);
```

### New Code Periods API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.newCodePeriods`

#### Methods

##### list(params?)
List new code period settings.

```typescript
const periods = await client.newCodePeriods.list({
  project: 'my-project'
});
```

##### set(params)
Set new code period.

```typescript
// Project-level
await client.newCodePeriods.set({
  project: 'my-project',
  type: 'NUMBER_OF_DAYS',
  value: '30'
});

// Branch-level
await client.newCodePeriods.set({
  project: 'my-project',
  branch: 'main',
  type: 'SPECIFIC_ANALYSIS',
  value: 'analysis-uuid'
});

// Organization default
await client.newCodePeriods.set({
  organization: 'my-org',
  type: 'PREVIOUS_VERSION'
});
```

##### unset(params)
Remove new code period setting.

```typescript
// Remove project-specific setting
await client.newCodePeriods.unset({
  project: 'my-project'
});

// Remove branch-specific setting
await client.newCodePeriods.unset({
  project: 'my-project',
  branch: 'feature-branch'
});
```

### Notifications API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.notifications`

#### Methods

##### list(params?)
List user notifications.

```typescript
const result = await client.notifications.list();
console.log('Notifications:', result.notifications);
console.log('Available channels:', result.channels);
console.log('Global types:', result.globalTypes);
console.log('Per-project types:', result.perProjectTypes);
```

##### add(params)
Add notification.

```typescript
// Global notification
await client.notifications.add({
  type: GlobalNotificationType.ChangesOnMyIssue
});

// Project-specific notification
await client.notifications.add({
  type: ProjectNotificationType.NewAlerts,
  project: 'my-project',
  channel: NotificationChannel.Email
});
```

##### remove(params)
Remove notification.

```typescript
await client.notifications.remove({
  type: GlobalNotificationType.ChangesOnMyIssue
});
```

### Permissions API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.permissions`

#### Methods

##### addUserPermission(params)
Add permission to user.

```typescript
await client.permissions.addUserPermission({
  login: 'john.doe',
  permission: 'admin',
  projectKey: 'my-project'
});
```

##### removeUserPermission(params)
Remove permission from user.

```typescript
await client.permissions.removeUserPermission({
  login: 'john.doe',
  permission: 'admin',
  projectKey: 'my-project'
});
```

##### addGroupPermission(params)
Add permission to group.

```typescript
await client.permissions.addGroupPermission({
  groupName: 'developers',
  permission: 'codeviewer',
  projectKey: 'my-project'
});
```

##### removeGroupPermission(params)
Remove permission from group.

```typescript
await client.permissions.removeGroupPermission({
  groupName: 'developers',
  permission: 'codeviewer',
  projectKey: 'my-project'
});
```

##### createTemplate(params)
Create permission template.

```typescript
const template = await client.permissions.createTemplate({
  name: 'Mobile Projects',
  description: 'Template for mobile apps',
  projectKeyPattern: '.*mobile.*'
});
```

##### updateTemplate(params)
Update permission template.

```typescript
await client.permissions.updateTemplate({
  id: 'template-id',
  name: 'Updated Mobile Projects',
  description: 'Updated description'
});
```

##### deleteTemplate(params)
Delete permission template.

```typescript
await client.permissions.deleteTemplate({
  templateId: 'template-id'
});
```

##### applyTemplate(params)
Apply template to projects.

```typescript
await client.permissions.applyTemplate({
  templateId: 'template-id',
  projectKey: 'my-project'
});
```

##### bulkApplyTemplate()
Bulk apply template to projects.

```typescript
await client.permissions.bulkApplyTemplate()
  .templateId('template-id')
  .query('mobile')
  .qualifiers(['TRK'])
  .execute();
```

##### addUserToTemplate(params)
Add user to permission template.

```typescript
await client.permissions.addUserToTemplate({
  templateId: 'template-id',
  login: 'john.doe',
  permission: 'admin'
});
```

##### removeUserFromTemplate(params)
Remove user from permission template.

```typescript
await client.permissions.removeUserFromTemplate({
  templateId: 'template-id',
  login: 'john.doe',
  permission: 'admin'
});
```

##### addGroupToTemplate(params)
Add group to permission template.

```typescript
await client.permissions.addGroupToTemplate({
  templateId: 'template-id',
  groupName: 'developers',
  permission: 'codeviewer'
});
```

##### removeGroupFromTemplate(params)
Remove group from permission template.

```typescript
await client.permissions.removeGroupFromTemplate({
  templateId: 'template-id',
  groupName: 'developers',
  permission: 'codeviewer'
});
```

##### addProjectCreatorToTemplate(params)
Add project creator to template.

```typescript
await client.permissions.addProjectCreatorToTemplate({
  templateId: 'template-id',
  permission: 'admin'
});
```

##### removeProjectCreatorFromTemplate(params)
Remove project creator from template.

```typescript
await client.permissions.removeProjectCreatorFromTemplate({
  templateId: 'template-id',
  permission: 'admin'
});
```

##### setDefaultTemplate(params)
Set default permission template.

```typescript
await client.permissions.setDefaultTemplate({
  templateId: 'template-id',
  qualifier: 'TRK'
});
```

##### searchGlobalPermissions(params?)
Search global permissions.

```typescript
const permissions = await client.permissions.searchGlobalPermissions();
```

##### searchProjectPermissions()
Search project permissions.

```typescript
const permissions = await client.permissions.searchProjectPermissions()
  .projectKey('my-project')
  .query('john')
  .permission('admin')
  .execute();
```

##### searchTemplates(params?)
Search permission templates.

```typescript
const templates = await client.permissions.searchTemplates({
  q: 'mobile'
});
```

### Plugins API
**Availability**: SonarQube only  
**Client**: `client.plugins`

#### Methods

##### getAvailable(params?)
Get available plugins from update center.

```typescript
const available = await client.plugins.getAvailable();
console.log(`${available.plugins.length} plugins available`);
```

##### install(params)
Install a plugin.

```typescript
await client.plugins.install({
  key: 'sonar-java'
});
```

##### getInstalled(params?)
Get installed plugins.

```typescript
const installed = await client.plugins.getInstalled();
```

##### getPending()
Get pending plugin operations.

```typescript
const pending = await client.plugins.getPending();
if (pending.installing.length > 0) {
  console.log('Installing:', pending.installing);
}
```

##### uninstall(params)
Uninstall a plugin.

```typescript
await client.plugins.uninstall({
  key: 'old-plugin'
});
```

##### update(params)
Update a plugin.

```typescript
await client.plugins.update({
  key: 'sonar-java'
});
```

##### getUpdates()
Get available plugin updates.

```typescript
const updates = await client.plugins.getUpdates();
console.log(`${updates.plugins.length} updates available`);
```

### Project Analyses API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.projectAnalyses`

#### Methods

##### search()
Search project analyses.

```typescript
const analyses = await client.projectAnalyses.search()
  .project('my-project')
  .branch('main')
  .category('VERSION')
  .from('2024-01-01')
  .to('2024-12-31')
  .execute();

// Iterate all analyses
for await (const analysis of client.projectAnalyses.searchAll('my-project')) {
  console.log(`Analysis ${analysis.key} on ${analysis.date}`);
}
```

**Builder Methods**:
- `project(key: string)` - Project key (required for builder)
- `branch(name: string)` - Branch name
- `pullRequest(id: string)` - Pull request ID
- `category(category: EventCategory)` - Event category filter
- `from(date: string)` - From date
- `to(date: string)` - To date
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### createEvent(params)
Create analysis event.

```typescript
const event = await client.projectAnalyses.createEvent({
  analysis: 'analysis-uuid',
  category: 'VERSION',
  name: '1.0.0'
});
```

##### updateEvent(params)
Update analysis event.

```typescript
const updated = await client.projectAnalyses.updateEvent({
  event: 'event-uuid',
  name: '1.0.1'
});
```

##### deleteEvent(params)
Delete analysis event.

```typescript
await client.projectAnalyses.deleteEvent({
  event: 'event-uuid'
});
```

##### deleteAnalysis(params)
Delete an analysis.

```typescript
await client.projectAnalyses.deleteAnalysis({
  analysis: 'analysis-uuid'
});
```

##### setBaseline(params)
Set analysis as new code baseline.

```typescript
await client.projectAnalyses.setBaseline({
  analysis: 'analysis-uuid',
  project: 'my-project',
  branch: 'main'
});
```

##### unsetBaseline(params)
Remove manual baseline.

```typescript
await client.projectAnalyses.unsetBaseline({
  project: 'my-project'
});
```

### Project Badges API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.projectBadges`

#### Methods

##### qualityGate(params)
Generate quality gate badge.

```typescript
const badge = await client.projectBadges.qualityGate({
  project: 'my-project',
  branch: 'main',
  token: 'badge-token' // Optional for private projects
});
// Returns SVG content
```

##### measure(params)
Generate metric badge.

```typescript
const badge = await client.projectBadges.measure({
  project: 'my-project',
  metric: 'coverage',
  branch: 'main'
});

// Available metrics: 'coverage', 'ncloc', 'code_smells', 'sqale_rating',
// 'security_rating', 'bugs', 'vulnerabilities', 'duplicated_lines_density',
// 'reliability_rating', 'alert_status', 'sqale_index'
```

##### aiCodeAssurance(params)
Generate AI code assurance badge.

```typescript
const badge = await client.projectBadges.aiCodeAssurance({
  project: 'my-project'
});
```

### Project Branches API
**Availability**: Both SonarQube and SonarCloud (requires Branch plugin)  
**Client**: `client.projectBranches`

#### Methods

##### list()
List project branches.

```typescript
const branches = await client.projectBranches.list()
  .withProject('my-project')
  .execute();

// List specific branches by IDs
const specific = await client.projectBranches.list()
  .withBranchIds(['uuid1', 'uuid2'])
  .execute();
```

##### delete(params)
Delete a branch.

```typescript
await client.projectBranches.delete({
  project: 'my-project',
  branch: 'old-feature'
});
```

##### rename(params)
Rename the main branch.

```typescript
await client.projectBranches.rename({
  project: 'my-project',
  name: 'main'
});
```

### Project Dump API
**Availability**: SonarQube Enterprise Edition only  
**Client**: `client.projectDump`

#### Methods

##### export(params)
Export project for backup.

```typescript
await client.projectDump.export({
  key: 'my-project'
});
```

##### import(params)
Import project from dump.

```typescript
const file = new File([dumpData], 'project-dump.zip');
await client.projectDump.import({
  key: 'target-project',
  file: file
});
```

### Project Links API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.projectLinks`

#### Methods

##### search()
Search project links.

```typescript
const links = await client.projectLinks.search()
  .projectKey('my-project')
  .execute();
```

##### create(params)
Create project link.

```typescript
const link = await client.projectLinks.create({
  projectKey: 'my-project',
  name: 'Documentation',
  url: 'https://docs.example.com'
});
```

##### delete(params)
Delete project link.

```typescript
await client.projectLinks.delete({
  id: 'link-id'
});
```

### Project Pull Requests API
**Availability**: Both SonarQube and SonarCloud (requires Branch plugin)  
**Client**: `client.projectPullRequests`

#### Methods

##### list(params)
List pull requests.

```typescript
const pullRequests = await client.projectPullRequests.list({
  project: 'my-project'
});

pullRequests.pullRequests.forEach(pr => {
  console.log(`PR #${pr.key}: ${pr.title}`);
  console.log(`  Quality Gate: ${pr.status.qualityGateStatus}`);
});
```

##### delete(params)
Delete pull request data.

```typescript
await client.projectPullRequests.delete({
  project: 'my-project',
  pullRequest: '123'
});
```

### Project Tags API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.projectTags`

#### Methods

##### search(params?)
Search available tags.

```typescript
const tags = await client.projectTags.search({
  q: 'production',
  ps: 20
});
```

##### set(params)
Set project tags.

```typescript
await client.projectTags.set({
  project: 'my-project',
  tags: 'production, critical, backend'
});
```

### Projects API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.projects`

#### Methods

##### create(params)
Create a project.

```typescript
const project = await client.projects.create({
  key: 'my-new-project',
  name: 'My New Project',
  visibility: 'private',
  mainBranch: 'main'
});
```

##### delete(params)
Delete a project.

```typescript
await client.projects.delete({
  project: 'old-project'
});
```

##### bulkDelete(params)
Delete multiple projects.

```typescript
await client.projects.bulkDelete({
  projects: ['project1', 'project2', 'project3']
});
```

##### search()
Search projects.

```typescript
const projects = await client.projects.search()
  .query('mobile')
  .visibility('private')
  .qualifiers(['TRK'])
  .pageSize(50)
  .execute();

// Iterate all projects
for await (const project of client.projects.searchAll()) {
  console.log(`Project: ${project.name} (${project.key})`);
}
```

**Builder Methods**:
- `analyzedBefore(date: string)` - Last analysis before date
- `onProvisionedOnly(value: boolean)` - Only provisioned projects
- `projects(keys: string[])` - Specific project keys
- `query(q: string)` - Search query
- `qualifiers(qualifiers: ProjectQualifier[])` - Project types
- `visibility(visibility: ProjectVisibility)` - Visibility filter
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### updateKey(params)
Update project key.

```typescript
await client.projects.updateKey({
  from: 'old-key',
  to: 'new-key'
});
```

##### bulkUpdateKey(params)
Bulk update project keys.

```typescript
const result = await client.projects.bulkUpdateKey({
  from: 'old-prefix',
  to: 'new-prefix',
  dryRun: true
});
console.log(`Would update ${result.keys.length} projects`);
```

##### updateVisibility(params)
Update project visibility.

```typescript
await client.projects.updateVisibility({
  project: 'my-project',
  visibility: 'public'
});
```

##### exportFindings(params)
Export project findings.

```typescript
const findings = await client.projects.exportFindings({
  project: 'my-project',
  branch: 'main'
});
// Returns raw export data
```

##### getContainsAiCode(params)
Check if project contains AI-generated code.

```typescript
const result = await client.projects.getContainsAiCode({
  project: 'my-project'
});
console.log(`Contains AI code: ${result.containsAiCode}`);
```

##### setContainsAiCode(params)
Set AI code flag for project.

```typescript
await client.projects.setContainsAiCode({
  project: 'my-project',
  containsAiCode: true
});
```

##### getLicenseUsage()
Get license usage information.

```typescript
const usage = await client.projects.getLicenseUsage();
console.log(`Using ${usage.linesOfCode} lines of code`);
```

### Quality Gates API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.qualityGates`

#### Methods

##### list()
List quality gates.

```typescript
const gates = await client.qualityGates.list();
console.log(`Default gate: ${gates.default}`);
```

##### create(params)
Create quality gate.

```typescript
const gate = await client.qualityGates.create({
  name: 'Strict Quality Gate'
});
```

##### destroy(params)
Delete quality gate.

```typescript
await client.qualityGates.destroy({
  id: 'gate-id'
});
```

##### show(params)
Get quality gate details.

```typescript
const gate = await client.qualityGates.show({
  id: 'gate-id'
});
```

##### rename(params)
Rename quality gate.

```typescript
await client.qualityGates.rename({
  id: 'gate-id',
  name: 'New Gate Name'
});
```

##### copy(params)
Copy quality gate.

```typescript
const newGate = await client.qualityGates.copy({
  id: 'source-gate-id',
  name: 'Copy of Gate'
});
```

##### setAsDefault(params)
Set default quality gate.

```typescript
await client.qualityGates.setAsDefault({
  id: 'gate-id'
});
```

##### createCondition(params)
Add condition to quality gate.

```typescript
await client.qualityGates.createCondition({
  gateId: 'gate-id',
  metric: 'coverage',
  error: '80',
  op: 'LT'
});
```

##### updateCondition(params)
Update quality gate condition.

```typescript
await client.qualityGates.updateCondition({
  id: 'condition-id',
  metric: 'coverage',
  error: '85',
  warning: '75',
  op: 'LT'
});
```

##### deleteCondition(params)
Delete quality gate condition.

```typescript
await client.qualityGates.deleteCondition({
  id: 'condition-id'
});
```

##### select(params)
Associate project with quality gate.

```typescript
await client.qualityGates.select({
  gateId: 'gate-id',
  projectKey: 'my-project'
});
```

##### deselect(params)
Remove project from quality gate.

```typescript
await client.qualityGates.deselect({
  projectKey: 'my-project'
});
```

##### getProjects()
Get projects using a quality gate.

```typescript
const projects = await client.qualityGates.getProjects()
  .gateId('gate-id')
  .selected('selected')
  .query('mobile')
  .execute();
```

##### getProjectStatus(params)
Get project quality gate status.

```typescript
const status = await client.qualityGates.getProjectStatus({
  projectKey: 'my-project',
  branch: 'main'
});
console.log(`Quality Gate: ${status.projectStatus.status}`);
```

### Quality Profiles API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.qualityProfiles`

#### Methods

##### search()
Search quality profiles.

```typescript
const profiles = await client.qualityProfiles.search()
  .language('java')
  .defaults(true)
  .execute();
```

##### create(params)
Create quality profile.

```typescript
const profile = await client.qualityProfiles.create({
  name: 'Strict Java Rules',
  language: 'java'
});
```

##### copy(params)
Copy quality profile.

```typescript
const copy = await client.qualityProfiles.copy({
  fromKey: 'source-profile',
  toName: 'Copy of Profile'
});
```

##### delete(params)
Delete quality profile.

```typescript
await client.qualityProfiles.delete({
  key: 'profile-key'
});
```

##### rename(params)
Rename quality profile.

```typescript
await client.qualityProfiles.rename({
  key: 'profile-key',
  name: 'New Profile Name'
});
```

##### setDefault(params)
Set default quality profile.

```typescript
await client.qualityProfiles.setDefault({
  key: 'profile-key'
});
```

##### changeParent(params)
Change profile parent.

```typescript
await client.qualityProfiles.changeParent({
  key: 'child-profile',
  parentKey: 'parent-profile'
});
```

##### activateRule(params)
Activate rule in profile.

```typescript
await client.qualityProfiles.activateRule({
  key: 'profile-key',
  rule: 'java:S1234',
  severity: 'CRITICAL',
  params: 'param1=value1;param2=value2'
});
```

##### activateRules()
Bulk activate rules.

```typescript
const result = await client.qualityProfiles.activateRules()
  .targetProfile('profile-key')
  .severities('CRITICAL,MAJOR')
  .types('BUG,VULNERABILITY')
  .targetSeverity('BLOCKER')
  .execute();
console.log(`Activated ${result.succeeded} rules`);
```

##### deactivateRule(params)
Deactivate rule from profile.

```typescript
await client.qualityProfiles.deactivateRule({
  key: 'profile-key',
  rule: 'java:S1234'
});
```

##### deactivateRules()
Bulk deactivate rules.

```typescript
const result = await client.qualityProfiles.deactivateRules()
  .targetProfile('profile-key')
  .severities('INFO,MINOR')
  .execute();
```

##### addProject(params)
Associate project with profile.

```typescript
await client.qualityProfiles.addProject({
  key: 'profile-key',
  project: 'my-project'
});
```

##### removeProject(params)
Remove project from profile.

```typescript
await client.qualityProfiles.removeProject({
  key: 'profile-key',
  project: 'my-project'
});
```

##### backup(params)
Export quality profile.

```typescript
const backup = await client.qualityProfiles.backup({
  key: 'profile-key'
});
// Returns profile XML content
```

##### restore(params)
Import quality profile.

```typescript
const restored = await client.qualityProfiles.restore({
  backup: xmlContent
});
```

##### compare(params)
Compare two profiles.

```typescript
const comparison = await client.qualityProfiles.compare({
  leftKey: 'profile1',
  rightKey: 'profile2'
});
console.log(`Rules only in left: ${comparison.inLeft.length}`);
console.log(`Rules only in right: ${comparison.inRight.length}`);
console.log(`Modified rules: ${comparison.modified.length}`);
```

##### changelog()
Get profile change history.

```typescript
for await (const change of client.qualityProfiles.changelog()
  .profile('profile-key')
  .since('2024-01-01')
  .all()) {
  console.log(`${change.date}: ${change.action} - ${change.ruleName}`);
}
```

##### exporters()
Get available exporters.

```typescript
const exporters = await client.qualityProfiles.exporters();
```

##### export(params)
Export profile using specific exporter.

```typescript
const exported = await client.qualityProfiles.export({
  key: 'profile-key',
  exporter: 'pmd'
});
```

##### importers()
Get available importers.

```typescript
const importers = await client.qualityProfiles.importers();
```

##### inheritance(params)
Get profile inheritance tree.

```typescript
const tree = await client.qualityProfiles.inheritance({
  key: 'profile-key'
});
```

##### projects()
Get projects using profile.

```typescript
for await (const project of client.qualityProfiles.projects()
  .profile('profile-key')
  .selected('selected')
  .all()) {
  console.log(`Project: ${project.name}`);
}
```

### Rules API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.rules`

#### Methods

##### search()
Search rules with filtering.

```typescript
const rules = await client.rules.search()
  .withTypes(['BUG', 'VULNERABILITY'])
  .withSeverities(['CRITICAL', 'BLOCKER'])
  .withLanguages(['java'])
  .withTags(['security'])
  .includeExternal()
  .execute();

// Iterate all rules
for await (const rule of client.rules.search()
  .withTypes(['BUG'])
  .all()) {
  console.log(`Rule: ${rule.key} - ${rule.name}`);
}
```

**Builder Methods**:
- `withActivation(value: boolean)` - Include activation details
- `inQualityProfile(key: string)` - Rules in specific profile
- `withAvailableSince(date: string)` - Available since date
- `asc(value: boolean)` - Sort ascending
- `withCleanCodeAttributeCategories(categories: CleanCodeAttributeCategory[])` - Clean code categories
- `compareToProfile(key: string)` - Compare to profile
- `withCwe(cwe: string[])` - CWE identifiers
- `facetMode(mode: FacetMode)` - Facet mode
- `withFacets(facets: string[])` - Enable facets
- `includeExternal(value: boolean)` - Include external rules
- `withImpactSeverities(severities: ImpactSeverity[])` - Impact severities
- `withImpactSoftwareQualities(qualities: ImpactSoftwareQuality[])` - Software qualities
- `withInheritance(inheritance: RuleInheritance[])` - Inheritance filter
- `isTemplate(value: boolean)` - Template rules only
- `withLanguages(languages: string[])` - Programming languages
- `withOwaspTop10(categories: string[])` - OWASP Top 10
- `withOwaspTop10_2021(categories: string[])` - OWASP Top 10 2021
- `query(q: string)` - Search query
- `inRepositories(repos: string[])` - Rule repositories
- `withRuleKey(key: string)` - Specific rule key
- `sortBy(field: string)` - Sort field
- `withSansTop25(categories: string[])` - SANS Top 25
- `withSeverities(severities: RuleSeverity[])` - Rule severities
- `withSonarsourceSecurity(categories: string[])` - Security categories
- `withStatuses(statuses: RuleStatus[])` - Rule statuses
- `withTags(tags: string[])` - Rule tags
- `withTemplateKey(key: string)` - Template key
- `withTypes(types: RuleType[])` - Rule types
- `pageSize(size: number)` - Page size
- `page(page: number)` - Page number

##### show(params)
Get rule details.

```typescript
const rule = await client.rules.show({
  key: 'java:S1234',
  actives: true
});
```

##### listRepositories(params?)
List rule repositories.

```typescript
const repos = await client.rules.listRepositories({
  language: 'java',
  q: 'sonar'
});
```

##### listTags(params?)
List available rule tags.

```typescript
const tags = await client.rules.listTags({
  q: 'security',
  ps: 50
});
```

##### update(params)
Update custom rule.

```typescript
const updated = await client.rules.update({
  key: 'custom:rule1',
  name: 'Updated Rule Name',
  severity: 'CRITICAL',
  tags: 'security,owasp-a1',
  markdown_description: 'Updated description'
});
```

### SCA API (v2)
**Availability**: SonarQube 10.6+  
**Client**: `client.sca`

#### Methods

##### generateSbom(params)
Generate Software Bill of Materials.

```typescript
// Generate JSON format
const sbomJson = await client.sca.generateSbom({
  project: 'my-project',
  format: 'JSON',
  branch: 'main'
});

// Generate SPDX format
const sbomSpdx = await client.sca.generateSbom({
  project: 'my-project',
  format: 'SPDX_JSON',
  includeVulnerabilities: true
});

// Generate CycloneDX format
const sbomCyclone = await client.sca.generateSbom({
  project: 'my-project',
  format: 'CYCLONEDX_XML',
  includeLicenses: true,
  includeMetrics: true
});
```

##### downloadSbom(options)
Download large SBOM with progress tracking.

```typescript
const sbom = await client.sca.downloadSbom({
  project: 'my-project',
  format: 'CYCLONEDX_JSON',
  onProgress: (loaded, total) => {
    console.log(`Downloaded ${Math.round(loaded/total*100)}%`);
  },
  signal: abortController.signal
});
```

##### analyzeSbom(params)
Analyze SBOM for security insights.

```typescript
const analysis = await client.sca.analyzeSbom({
  project: 'my-project'
});
console.log(`Critical vulnerabilities: ${analysis.vulnerabilities.critical}`);
console.log(`License compliance: ${analysis.licenses.compliant ? 'OK' : 'Issues'}`);
```

##### convertSbomFormat(params)
Convert between SBOM formats.

```typescript
const converted = await client.sca.convertSbomFormat({
  sbomData: jsonSbom,
  fromFormat: 'JSON',
  toFormat: 'SPDX_JSON'
});
```

### Server API
**Availability**: SonarQube only  
**Client**: `client.server`

#### Methods

##### version()
Get server version.

```typescript
const version = await client.server.version();
console.log(`SonarQube ${version}`);
```

##### getSamlValidationUrl()
Get SAML validation URL.

```typescript
const samlUrl = await client.server.getSamlValidationUrl();
```

### Settings API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.settings`

#### Methods

##### listDefinitions(params?)
List setting definitions.

```typescript
const definitions = await client.settings.listDefinitions({
  component: 'my-project'
});
```

##### values()
Get setting values.

```typescript
const values = await client.settings.values()
  .keys(['sonar.exclusions', 'sonar.test.inclusions'])
  .component('my-project')
  .execute();
```

##### set()
Set a setting value.

```typescript
// Simple string value
await client.settings.set()
  .key('sonar.links.scm')
  .value('https://github.com/org/repo')
  .execute();

// Multiple values
await client.settings.set()
  .key('sonar.exclusions')
  .values(['**/test/**', '**/vendor/**'])
  .execute();

// Field values
await client.settings.set()
  .key('sonar.issue.ignore.multicriteria')
  .fieldValues([
    { ruleKey: 'java:S1135', resourceKey: '**/test/**' }
  ])
  .execute();

// Component-specific
await client.settings.set()
  .key('sonar.coverage.exclusions')
  .value('**/test/**')
  .component('my-project')
  .execute();
```

##### reset()
Reset settings to defaults.

```typescript
await client.settings.reset()
  .keys(['sonar.links.scm', 'sonar.exclusions'])
  .component('my-project')
  .execute();
```

### Sources API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.sources`

#### Methods

##### getRaw(params)
Get raw source file content.

```typescript
const content = await client.sources.getRaw({
  key: 'my-project:src/main.ts',
  branch: 'main'
});
```

##### show(params)
Get source with line numbers and metadata.

```typescript
const source = await client.sources.show({
  key: 'my-project:src/main.ts',
  from: 10,
  to: 50
});

source.sources.forEach(line => {
  console.log(`${line.line}: ${line.code}`);
  if (line.isNew) console.log('  (new code)');
});
```

##### getScmInfo(params)
Get SCM blame information.

```typescript
const scmInfo = await client.sources.getScmInfo({
  key: 'my-project:src/main.ts',
  from: 1,
  to: 100,
  commits_by_line: true
});

scmInfo.scm.forEach(line => {
  console.log(`Line ${line.line}: ${line.author} on ${line.date}`);
});
```

### System API
**Availability**: SonarQube only  
**Client**: `client.system`

#### Methods

##### health()
Get system health status.

```typescript
const health = await client.system.health();
if (health.health === 'RED') {
  console.error('System unhealthy:', health.causes);
}
```

##### getHealthV2()
Get detailed system health (v2).

```typescript
const health = await client.system.getHealthV2();
console.log(`Status: ${health.status}`);
console.log(`Nodes: ${health.nodes.length}`);
```

##### status()
Get system status.

```typescript
const status = await client.system.status();
console.log(`Status: ${status.status}`);
console.log(`Version: ${status.version}`);
```

##### ping()
Ping system.

```typescript
const pong = await client.system.ping();
console.log(pong); // 'pong'
```

##### info()
Get system information.

```typescript
const info = await client.system.info();
console.log(`Version: ${info.version}`);
console.log(`Database: ${info.database}`);
```

##### getSystemStatus()
Get system status (v2).

```typescript
const status = await client.system.getSystemStatus();
console.log(`Status: ${status.status}`);
console.log(`Edition: ${status.edition}`);
```

### User Tokens API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.userTokens`

#### Methods

##### generate(params)
Generate access token.

```typescript
const token = await client.userTokens.generate({
  name: 'CI Pipeline Token'
});
console.log('Token:', token.token);
// Save this token - it cannot be retrieved again!
```

##### search(params?)
List user tokens.

```typescript
const tokens = await client.userTokens.search({
  login: 'john.doe'
});
```

##### revoke(params)
Revoke a token.

```typescript
await client.userTokens.revoke({
  name: 'Old Token'
});
```

### Users API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.users`

#### Methods

##### search()
Search users (deprecated).

```typescript
const users = await client.users.search()
  .query('john')
  .pageSize(50)
  .execute();

// Iterate all users
for await (const user of client.users.searchAll()) {
  console.log(`User: ${user.name} (${user.login})`);
}
```

##### groups()
Get user groups.

```typescript
const groups = await client.users.groups()
  .login('john.doe')
  .organization('my-org')
  .query('admin')
  .selected('all')
  .execute();

// Iterate all groups
for await (const group of client.users.groupsAll('john.doe', 'my-org')) {
  console.log(`Group: ${group.name}`);
}
```

##### searchV2()
Search users (v2).

```typescript
const users = await client.users.searchV2()
  .query('john')
  .managed(false)
  .active(true)
  .execute();
```

### Views API
**Availability**: SonarQube Enterprise Edition  
**Client**: `client.views`

#### Methods

##### show(params)
Get portfolio details.

```typescript
const portfolio = await client.views.show({
  key: 'portfolio-key'
});
```

##### addApplication(params)
Add application to portfolio.

```typescript
await client.views.addApplication({
  application: 'app-key',
  portfolio: 'portfolio-key'
});
```

##### addApplicationBranch(params)
Add application branch to portfolio.

```typescript
await client.views.addApplicationBranch({
  application: 'app-key',
  branch: 'feature-branch',
  portfolio: 'portfolio-key'
});
```

##### update(params)
Update portfolio.

```typescript
await client.views.update({
  key: 'portfolio-key',
  name: 'Updated Portfolio',
  description: 'Updated description'
});
```

### Webhooks API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.webhooks`

#### Methods

##### create(params)
Create webhook.

```typescript
const webhook = await client.webhooks.create({
  name: 'CI/CD Notification',
  project: 'my-project',
  url: 'https://ci.example.com/webhook',
  secret: 'webhook-secret'
});
```

##### update(params)
Update webhook.

```typescript
await client.webhooks.update({
  webhook: 'webhook-key',
  name: 'Updated Webhook',
  url: 'https://new-url.com/webhook',
  secret: 'new-secret'
});
```

##### delete(params)
Delete webhook.

```typescript
await client.webhooks.delete({
  webhook: 'webhook-key'
});
```

##### list()
List webhooks.

```typescript
const webhooks = await client.webhooks.list()
  .organization('my-org')
  .project('my-project')
  .execute();
```

##### deliveries()
Get webhook deliveries.

```typescript
const deliveries = await client.webhooks.deliveries()
  .componentKey('my-project')
  .webhook('webhook-key')
  .pageSize(20)
  .execute();
```

##### delivery(params)
Get delivery details.

```typescript
const delivery = await client.webhooks.delivery({
  deliveryId: 'delivery-id'
});
```

### Web Services API
**Availability**: Both SonarQube and SonarCloud  
**Client**: `client.webservices`

#### Methods

##### list()
List all web services.

```typescript
const services = await client.webservices.list();
services.webServices?.forEach(service => {
  console.log(`Service: ${service.path}`);
  service.actions?.forEach(action => {
    console.log(`  Action: ${action.key}`);
  });
});
```

##### responseExample(params)
Get response example for endpoint.

```typescript
const example = await client.webservices.responseExample({
  controller: 'api/issues',
  action: 'search'
});
```

## Type Definitions

### Core Types

```typescript
// Pagination
interface PaginatedRequest {
  p?: number;  // Page number
  ps?: number; // Page size
}

interface PaginatedResponse<T> {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  // Response-specific data field
}

// Authentication
type AuthProvider = {
  applyAuth(headers: Headers): Headers;
  getAuthType(): 'bearer' | 'basic' | 'passcode' | 'none';
};

// Client Options
interface ClientOptions {
  organization?: string;
  suppressDeprecationWarnings?: boolean;
  deprecationHandler?: (context: DeprecationContext) => void;
}
```

### Issue Types

```typescript
type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
type IssueType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';
type IssueResolution = 'FALSE-POSITIVE' | 'WONTFIX' | 'FIXED' | 'REMOVED';
type IssueTransition = 'confirm' | 'unconfirm' | 'reopen' | 'resolve' | 'falsepositive' | 'wontfix' | 'close';
type IssueScope = 'MAIN' | 'TEST' | 'OVERALL';

interface Issue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  subProject?: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows?: IssueFlow[];
  status: IssueStatus;
  message: string;
  effort?: string;
  debt?: string;
  assignee?: string;
  author?: string;
  tags?: string[];
  transitions?: IssueTransition[];
  actions?: string[];
  comments?: IssueComment[];
  creationDate: string;
  updateDate?: string;
  closeDate?: string;
  type: IssueType;
  resolution?: IssueResolution;
  // Clean Code attributes (SonarQube 10+)
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: CleanCodeAttributeCategory;
  impacts?: IssueImpact[];
}

interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

interface IssueFlow {
  locations: IssueLocation[];
}

interface IssueLocation {
  component: string;
  textRange?: TextRange;
  msg?: string;
}

interface IssueComment {
  key: string;
  login: string;
  htmlText: string;
  markdown?: string;
  updatable: boolean;
  createdAt: string;
}

interface IssueImpact {
  softwareQuality: ImpactSoftwareQuality;
  severity: ImpactSeverity;
}

type ImpactSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
type ImpactSoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';
type CleanCodeAttributeCategory = 'ADAPTABLE' | 'CONSISTENT' | 'INTENTIONAL' | 'RESPONSIBLE';
```

### Component Types

```typescript
type ComponentQualifier = 'TRK' | 'DIR' | 'FIL' | 'UTS' | 'BRC' | 'APP' | 'VW' | 'SVW' | 'LIB';
type ComponentTreeStrategy = 'all' | 'children' | 'leaves';
type ComponentSortField = 'name' | 'path' | 'qualifier';

interface Component {
  key: string;
  name: string;
  qualifier: ComponentQualifier;
  path?: string;
  language?: string;
  branch?: string;
  pullRequest?: string;
  analysisDate?: string;
  version?: string;
  tags?: string[];
  visibility?: ProjectVisibility;
  description?: string;
  leakPeriodDate?: string;
  // ... additional fields
}
```

### Project Types

```typescript
type ProjectVisibility = 'public' | 'private';
type ProjectQualifier = 'TRK' | 'APP';

interface Project {
  key: string;
  name: string;
  qualifier: ProjectQualifier;
  visibility?: ProjectVisibility;
  lastAnalysisDate?: string;
  revision?: string;
  analysisDate?: string;
}
```

### Quality Gate Types

```typescript
interface QualityGate {
  id: string;
  name: string;
  conditions?: QualityGateCondition[];
  isDefault?: boolean;
  isBuiltIn?: boolean;
  actions?: {
    rename?: boolean;
    setAsDefault?: boolean;
    copy?: boolean;
    associateProjects?: boolean;
    delete?: boolean;
    manageConditions?: boolean;
  };
}

interface QualityGateCondition {
  id?: string;
  metric: string;
  op: QualityGateOperator;
  error?: string;
  warning?: string;
}

type QualityGateOperator = 'LT' | 'GT';
type QualityGateStatus = 'OK' | 'WARN' | 'ERROR' | 'NONE';

interface ProjectQualityGateStatus {
  status: QualityGateStatus;
  conditions?: QualityGateConditionStatus[];
  periods?: Period[];
  ignoredConditions?: boolean;
}

interface QualityGateConditionStatus {
  status: 'OK' | 'WARN' | 'ERROR';
  metricKey: string;
  comparator: QualityGateOperator;
  periodIndex?: number;
  warningThreshold?: string;
  errorThreshold?: string;
  actualValue?: string;
}
```

### Rule Types

```typescript
type RuleSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
type RuleStatus = 'BETA' | 'DEPRECATED' | 'READY' | 'REMOVED';
type RuleType = 'CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT';
type RuleInheritance = 'NONE' | 'INHERITED' | 'OVERRIDES';

interface Rule {
  key: string;
  repo: string;
  name: string;
  createdAt: string;
  htmlDesc?: string;
  mdDesc?: string;
  severity: RuleSeverity;
  status: RuleStatus;
  isTemplate?: boolean;
  templateKey?: string;
  tags?: string[];
  sysTags?: string[];
  lang: string;
  langName?: string;
  params?: RuleParameter[];
  defaultDebtRemFnType?: string;
  defaultDebtRemFnCoeff?: string;
  defaultDebtRemFnOffset?: string;
  effortToFixDescription?: string;
  debtOverloaded?: boolean;
  debtRemFnType?: string;
  debtRemFnCoeff?: string;
  debtRemFnOffset?: string;
  defaultRemFnType?: string;
  defaultRemFnGapMultiplier?: string;
  defaultRemFnBaseEffort?: string;
  remFnType?: string;
  remFnGapMultiplier?: string;
  remFnBaseEffort?: string;
  gapDescription?: string;
  scope?: 'MAIN' | 'TEST' | 'ALL';
  isExternal?: boolean;
  type?: RuleType;
  // Clean Code attributes
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: CleanCodeAttributeCategory;
  impacts?: RuleImpact[];
}

interface RuleParameter {
  key: string;
  htmlDesc?: string;
  defaultValue?: string;
  type?: string;
}

interface RuleImpact {
  softwareQuality: SoftwareQuality;
  severity: ImpactSeverity;
}

type SoftwareQuality = 'MAINTAINABILITY' | 'RELIABILITY' | 'SECURITY';
```

### Measure Types

```typescript
interface Measure {
  metric: string;
  value?: string;
  periods?: PeriodValue[];
  component?: string;
}

interface PeriodValue {
  index: number;
  value: string;
  bestValue?: boolean;
}

interface Period {
  index: number;
  mode: string;
  date?: string;
  parameter?: string;
}

type MeasuresAdditionalField = 'metrics' | 'periods' | 'period';
```

### Security Hotspot Types

```typescript
type HotspotStatus = 'TO_REVIEW' | 'REVIEWED';
type HotspotResolution = 'FIXED' | 'SAFE';

interface Hotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: string;
  status: HotspotStatus;
  resolution?: HotspotResolution;
  line?: number;
  message: string;
  assignee?: string;
  author?: string;
  creationDate: string;
  updateDate?: string;
  textRange?: TextRange;
  flows?: IssueFlow[];
  ruleKey?: string;
}
```

### User and Group Types

```typescript
interface User {
  login: string;
  name: string;
  active: boolean;
  email?: string;
  groups?: string[];
  tokensCount?: number;
  local?: boolean;
  externalIdentity?: string;
  externalProvider?: string;
  avatar?: string;
  lastConnectionDate?: string;
  sonarLintLastConnectionDate?: string;
}

interface UserV2 {
  id: string;
  login: string;
  name: string;
  email?: string;
  active: boolean;
  local: boolean;
  managed: boolean;
  externalLogin?: string;
  externalProvider?: string;
  avatar?: string;
  sonarQubeLastConnectionDate?: string;
  sonarLintLastConnectionDate?: string;
}

interface Group {
  id?: number;
  name: string;
  description?: string;
  membersCount?: number;
  default?: boolean;
}

interface GroupV2 {
  id: string;
  name: string;
  description?: string;
  managed: boolean;
  default: boolean;
  externalId?: string;
}
```

### Webhook Types

```typescript
interface Webhook {
  key: string;
  name: string;
  url: string;
  hasSecret: boolean;
  latestDelivery?: WebhookDelivery;
}

interface WebhookDelivery {
  id: string;
  componentKey: string;
  ceTaskId?: string;
  name: string;
  url: string;
  at: string;
  success: boolean;
  httpStatus?: number;
  durationMs: number;
  payload?: string;
  errorStacktrace?: string;
}
```

### ALM Types

```typescript
type AlmPlatform = 'azure' | 'bitbucket' | 'bitbucketcloud' | 'github' | 'gitlab';

interface AlmSettingBase {
  key: string;
  url?: string;
}

interface AzureAlmSetting extends AlmSettingBase {
  personalAccessToken: string;
}

interface BitbucketAlmSetting extends AlmSettingBase {
  url: string;
  personalAccessToken: string;
}

interface BitbucketCloudAlmSetting extends AlmSettingBase {
  clientId: string;
  workspace: string;
}

interface GitHubAlmSetting extends AlmSettingBase {
  appId: string;
  clientId: string;
  privateKey: string;
  url: string;
  webhookSecret?: string;
}

interface GitLabAlmSetting extends AlmSettingBase {
  personalAccessToken: string;
  url?: string;
}
```

### SBOM Types (SCA v2)

```typescript
type SbomFormat = 'JSON' | 'SPDX_JSON' | 'SPDX_RDF' | 'CYCLONEDX_JSON' | 'CYCLONEDX_XML';

interface SbomComponentV2 {
  name: string;
  version?: string;
  type: ComponentType;
  licenses?: SbomLicenseV2[];
  dependencies?: SbomDependencyV2[];
  vulnerabilities?: SbomVulnerabilityV2[];
}

interface SbomVulnerabilityV2 {
  id: string;
  cvssScore?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
}

interface SbomLicenseV2 {
  id: string;
  name: string;
  url?: string;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

## Error Handling

### Error Types

```typescript
// Base error class
class SonarQubeError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
  }
}

// Specific error types
class ApiError extends SonarQubeError {
  constructor(
    message: string,
    statusCode: number,
    public readonly errors?: Array<{ msg: string }>
  ) {
    super(message, statusCode);
  }
}

class ValidationError extends ApiError {}

class RateLimitError extends ApiError {
  constructor(
    message: string,
    statusCode: number,
    public readonly retryAfter?: number
  ) {
    super(message, statusCode);
  }
}

class AuthenticationError extends ApiError {}
class AuthorizationError extends ApiError {}
class NotFoundError extends ApiError {
  constructor(message: string, public readonly resource?: string) {
    super(message, 404);
  }
}

class NetworkError extends SonarQubeError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

class TimeoutError extends NetworkError {}
class ServerError extends ApiError {}
```

### Error Handling Examples

```typescript
try {
  const projects = await client.projects.search().execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid credentials');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    // Implement retry logic
  } else if (error instanceof NotFoundError) {
    console.error(`Resource not found: ${error.resource}`);
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.cause);
  } else if (error instanceof ServerError) {
    console.error('Server error:', error.message);
  }
}
```

## Builder Patterns

### Common Builder Methods

Most search/list endpoints support builder patterns with these common methods:

```typescript
// Pagination
.pageSize(size: number)  // Set page size (usually 1-500)
.page(page: number)      // Set page number (1-based)

// Iteration
.all()                   // Returns AsyncIterator for all results
.execute()               // Execute query and return single page

// Sorting
.asc(value: boolean)     // Sort ascending/descending
.sortBy(field: string)   // Sort by specific field
```

### Builder Pattern Example

```typescript
// Simple execution
const result = await client.issues.search()
  .withProjects(['my-project'])
  .execute();

// Async iteration over all results
for await (const issue of client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL'])
  .all()) {
  console.log(issue);
}

// Complex query building
const searchBuilder = client.issues.search()
  .withProjects(['project1', 'project2']);

if (includeCritical) {
  searchBuilder.withSeverities(['CRITICAL']);
}

if (branchName) {
  searchBuilder.withBranch(branchName);
}

const results = await searchBuilder.execute();
```

## Advanced Patterns

### Progress Tracking for Downloads

```typescript
// Download with progress
const download = await client.analysis.downloadScannerEngine({
  version: 'latest',
  onProgress: (loaded, total) => {
    const percent = Math.round(loaded / total * 100);
    console.log(`Download progress: ${percent}%`);
  }
});

// With abort capability
const controller = new AbortController();
const download = await client.sca.downloadSbom({
  project: 'my-project',
  format: 'CYCLONEDX_JSON',
  signal: controller.signal,
  onProgress: (loaded, total) => {
    if (shouldCancel) {
      controller.abort();
    }
  }
});
```

### Bulk Operations

```typescript
// Bulk delete projects
await client.projects.bulkDelete({
  projects: ['project1', 'project2', 'project3']
});

// Bulk activate rules
const result = await client.qualityProfiles.activateRules()
  .targetProfile('strict-profile')
  .severities('CRITICAL,MAJOR')
  .types('BUG,VULNERABILITY')
  .targetSeverity('BLOCKER')
  .execute();

// Bulk apply permission template
await client.permissions.bulkApplyTemplate()
  .templateId('template-id')
  .query('mobile')
  .qualifiers(['TRK'])
  .execute();
```

### Concurrent Operations

```typescript
// Fetch multiple resources concurrently
const [projects, issues, measures] = await Promise.all([
  client.projects.search().execute(),
  client.issues.search().withProjects(['my-project']).execute(),
  client.measures.component({ 
    component: 'my-project', 
    metricKeys: ['coverage', 'bugs'] 
  })
]);

// Process multiple projects in parallel
const projectKeys = ['project1', 'project2', 'project3'];
const results = await Promise.all(
  projectKeys.map(key =>
    client.measures.component({
      component: key,
      metricKeys: ['coverage', 'bugs', 'vulnerabilities']
    })
  )
);
```

### Faceted Search

```typescript
// Enable facets for aggregations
const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withFacets(['severities', 'types', 'rules', 'tags'])
  .facetMode('count')
  .execute();

// Access facet results
issues.facets?.forEach(facet => {
  console.log(`Facet: ${facet.property}`);
  facet.values.forEach(value => {
    console.log(`  ${value.val}: ${value.count}`);
  });
});
```

### Streaming Large Data

```typescript
// Handle large SBOM downloads
const sbomStream = await client.sca.downloadSbom({
  project: 'large-project',
  format: 'CYCLONEDX_JSON',
  onProgress: (loaded, total) => {
    console.log(`Downloaded ${loaded} of ${total} bytes`);
  }
});

// Process stream data
const chunks = [];
for await (const chunk of sbomStream) {
  chunks.push(chunk);
}
const sbomData = Buffer.concat(chunks);
```

## API Compatibility Matrix

### Version Requirements

| API | Minimum Version | Edition | Notes |
|-----|-----------------|---------|-------|
| **Core APIs** | | | |
| Authentication | All | Both | |
| Components | All | Both | |
| Favorites | All | Both | `index` endpoint deprecated since 6.3 |
| Issues | All | Both | `set_severity`, `set_type` deprecated |
| Languages | All | Both | |
| Measures | All | Both | |
| Metrics | All | Both | `domains` deprecated since 7.7 |
| Projects | All | Both | `bulk_update_key` deprecated since 7.6 |
| Quality Gates | All | Both | `unset_default` deprecated since 7.0 |
| Quality Profiles | All | Both | Export/import deprecated Mar 2025 |
| Rules | All | Both | |
| Settings | All | Both | |
| Sources | All | Both | |
| Users | All | Both | `search` deprecated Feb 2025 |
| Webhooks | All | Both | |
| **SonarQube Only** | | | |
| ALM Integrations | All | SonarQube | Not in SonarCloud |
| ALM Settings | All | SonarQube | Not in SonarCloud |
| Analysis Cache | All | SonarQube | Not in SonarCloud |
| Applications | All | SonarQube | Not in SonarCloud |
| Editions | All | SonarQube | License management |
| Plugins | All | SonarQube | Not in SonarCloud |
| Server | All | SonarQube | Not in SonarCloud |
| System | All | SonarQube | Not in SonarCloud |
| **Enterprise Edition** | | | |
| Audit Logs | All | Enterprise | Compliance tracking |
| Project Dump | All | Enterprise | Backup/restore |
| Views | All | Enterprise+ | Portfolio management |
| **v2 APIs** | | | |
| Analysis v2 | 10.3+ | SonarQube | Modern scanner API |
| Authorizations v2 | 10.5+ | SonarQube | Modern group management |
| Clean Code Policy v2 | 10.6+ | SonarQube | Custom rule creation |
| DOP Translation v2 | 10.4+ | SonarQube | DevOps platform integration |
| Fix Suggestions v2 | 10.2+ | SonarQube | AI-powered fixes |
| SCA v2 | 10.6+ | SonarQube | SBOM generation |
| **Branch Features** | | | |
| Project Branches | All | Both | Requires Branch plugin |
| Project Pull Requests | All | Both | Requires Branch plugin |

### Feature Availability by Edition

| Feature | Community | Developer | Enterprise | Data Center |
|---------|-----------|-----------|------------|-------------|
| Core APIs | ✅ | ✅ | ✅ | ✅ |
| ALM Integration | ✅ | ✅ | ✅ | ✅ |
| Branch Analysis | ❌ | ✅ | ✅ | ✅ |
| Pull Request Decoration | ❌ | ✅ | ✅ | ✅ |
| Security Hotspots | ✅ | ✅ | ✅ | ✅ |
| Portfolio Management | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ | ✅ |
| Project Export/Import | ❌ | ❌ | ✅ | ✅ |
| SAML/GitHub Auth | ❌ | ❌ | ❌ | ✅ |
| High Availability | ❌ | ❌ | ❌ | ✅ |

### API Deprecation Timeline

| API/Endpoint | Deprecated | Removal | Alternative |
|--------------|------------|---------|-------------|
| `api/favorites/index` | 6.3 | TBD | Use `api/favorites/search` |
| `api/issues/set_severity` | Aug 2023 | TBD | Use `api/issues/set_tags` |
| `api/issues/set_type` | Aug 2023 | TBD | Use `api/issues/set_tags` |
| `api/metrics/domains` | 7.7 | TBD | Use metric types |
| `api/permissions` search endpoints | 6.5 | TBD | Use other permission endpoints |
| `api/projects/bulk_update_key` | 7.6 | TBD | Use individual updates |
| `api/properties/*` | 6.3 | Removed | Use `api/settings` |
| `api/qualitygates/unset_default` | 7.0 | TBD | Set another as default |
| `api/qualityprofiles` export/import | Mar 2025 | Sep 2025 | Use backup/restore |
| `api/qualityprofiles/restore_built_in` | 6.4 | TBD | Reset to defaults |
| `api/timemachine/*` | 6.3 | Removed | Use `api/measures/history` |
| `api/user_groups/*` | Deprecated | TBD | Use `api/v2/authorizations` |
| `api/user_properties/*` | 6.3 | Removed | Use favorites/notifications |
| `api/users/search` | Feb 2025 | Aug 2025 | Use v2 API when available |

## Best Practices

### Authentication
- Always use tokens instead of passwords
- Use Bearer tokens for SonarQube 10.0+
- For older versions, use tokens as usernames in Basic auth
- Store credentials securely (environment variables)

### Error Handling
- Always wrap API calls in try-catch blocks
- Handle specific error types appropriately
- Implement retry logic for rate limit errors
- Log errors with context for debugging

### Performance
- Use pagination for large datasets
- Prefer async iteration over loading all data
- Batch operations when possible
- Use concurrent requests wisely

### API Usage
- Check version requirements before using v2 APIs
- Use faceted search for dashboards and analytics
- Enable only required additional fields
- Respect rate limits and implement backoff

### Code Quality
- Use TypeScript for type safety
- Follow the builder pattern for complex queries
- Handle optional fields appropriately
- Clean up resources (abort signals, etc.)