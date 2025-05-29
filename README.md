# 🚀 SonarQube Web API Client

A modern TypeScript client library for the SonarQube/SonarCloud Web API with type-safe interfaces and comprehensive error handling.

[![CI](https://github.com/sapientpants/sonarqube-web-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/sapientpants/sonarqube-web-api-client/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=bugs)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=coverage)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=sonarqube-web-api-client&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=sonarqube-web-api-client)
[![npm version](https://img.shields.io/npm/v/sonarqube-web-api-client.svg)](https://www.npmjs.com/package/sonarqube-web-api-client)
[![npm downloads](https://img.shields.io/npm/dm/sonarqube-web-api-client.svg)](https://www.npmjs.com/package/sonarqube-web-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 💡 Why Use This Library?

Working with the SonarQube/SonarCloud API directly can be challenging:
- 📚 **Complex API surface** - Hundreds of endpoints with various parameters
- 🔍 **No TypeScript support** - The official API lacks type definitions
- 🔄 **Pagination handling** - Manual pagination logic for large datasets
- ❌ **Generic error responses** - Difficult to handle different error scenarios
- 🏢 **Multi-organization** - Complexity when working with SonarCloud organizations

This library solves these problems by providing:
- ✅ **Complete type safety** - Full TypeScript definitions for all endpoints
- ✅ **Intuitive API design** - Resource-based structure with method chaining
- ✅ **Automatic pagination** - Built-in async iterators for large datasets
- ✅ **Rich error handling** - Specific error types for different failures
- ✅ **Zero dependencies** - Lightweight with no external runtime dependencies

## 🌟 Features

- 🔒 **Type-safe** - Full TypeScript support with comprehensive type definitions
- 🏢 **Multi-Organization** - Support for SonarCloud organizations and SonarQube instances
- 🏗️ **Builder Pattern** - Intuitive API with method chaining for complex queries
- 🔄 **Async Iteration** - Efficiently handle large datasets with built-in pagination
- 🛡️ **Error Handling** - Rich error types for different failure scenarios
- 🎯 **Modern Design** - Built with async/await and ES6+ features
- 📦 **Tree-shakeable** - Only import what you need
- 🧪 **Well Tested** - Comprehensive test coverage with MSW

## 📦 Installation

```bash
npm install sonarqube-web-api-client
# or
pnpm add sonarqube-web-api-client
# or
yarn add sonarqube-web-api-client
```

## 🎯 Quick Start

```typescript
import { SonarQubeClient } from 'sonarqube-web-api-client';

// Initialize the client (token is required)
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// For SonarCloud with organization support
const cloudClient = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'your-organization');

// Everything is type-safe and intuitive
const projects = await client.projects.search()
  .query('my-project')
  .execute();

const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL'])
  .execute();

// Async iteration for large datasets
for await (const component of client.components.tree()
  .component('my-project')
  .filesOnly()
  .all()) {
  console.log(`File: ${component.path}`);
}
```

### 📝 Full TypeScript Support

Get autocomplete, type checking, and inline documentation right in your IDE:

```typescript
// TypeScript knows exactly what parameters are available
const projects = await client.projects.search()
  .query('my-app')        // ✅ Autocomplete shows available methods
  .visibility('private')  // ✅ Type-safe parameter values
  .pageSize(50)          // ✅ Number validation
  .execute();            // ✅ Returns typed response

// TypeScript catches errors at compile time
const issues = await client.issues.search()
  .withSeverities(['WRONG'])  // ❌ TypeScript error: not a valid severity
  .execute();

// Full type information for responses
projects.components.forEach(project => {
  console.log(project.key);        // ✅ TypeScript knows the structure
  console.log(project.lastAnalysis); // ✅ Optional field handling
});
```

## 📊 API Implementation Status

We're continuously adding support for more SonarQube/SonarCloud APIs. Here's what's available today:

| API | Path | Status | Availability | Notes |
|-----|------|--------|--------------|-------|
| **ALM Integrations** | `api/alm_integrations` | ✅ Implemented | SonarQube only | Azure, Bitbucket, GitHub, GitLab integration |
| **ALM Settings** | `api/alm_settings` | ✅ Implemented | SonarQube only | ALM configuration management |
| **Analysis Cache** | `api/analysis_cache` | ✅ Implemented | SonarQube only | Scanner cache data |
| **Applications** | `api/applications` | ✅ Implemented | SonarQube only | Application portfolio management |
| **Authentication** | `api/authentication` | ✅ Implemented | Both | Validate credentials and logout |
| **CE (Compute Engine)** | `api/ce` | ✅ Implemented | Both | Background task management |
| **Components** | `api/components` | ✅ Implemented | Both | Component navigation and search |
| **Duplications** | `api/duplications` | ✅ Implemented | Both | Code duplication data |
| **Favorites** | `api/favorites` | ✅ Implemented | Both | User favorites management |
| **Hotspots** | `api/hotspots` | ✅ Implemented | Both | Security hotspot management |
| **Issues** | `api/issues` | ✅ Implemented | Both | Issue search and management |
| **Languages** | `api/languages` | ✅ Implemented | Both | Supported languages list |
| **Measures** | `api/measures` | ✅ Implemented | Both | Component measures and history |
| **Metrics** | `api/metrics` | ✅ Implemented | Both | Metric definitions |
| **Notifications** | `api/notifications` | ✅ Implemented | Both | User notifications |
| **Permissions** | `api/permissions` | ❌ Not implemented | Both | Permission management |
| **Project Analyses** | `api/project_analyses` | ✅ Implemented | Both | Analysis history and events |
| **Project Badges** | `api/project_badges` | ✅ Implemented | Both | Project status badges |
| **Project Branches** | `api/project_branches` | ✅ Implemented | Both | Branch management |
| **Project Links** | `api/project_links` | ✅ Implemented | Both | Project external links |
| **Project Pull Requests** | `api/project_pull_requests` | ✅ Implemented | Both | Pull request management (Branch plugin required) |
| **Project Tags** | `api/project_tags` | ✅ Implemented | Both | Project tag management |
| **Projects** | `api/projects` | ✅ Implemented | Both | Project management |
| **Properties** | `api/properties` | ❌ Not implemented | Both | Property management (deprecated) |
| **Quality Gates** | `api/qualitygates` | ✅ Implemented | Both | Quality gate management |
| **Quality Profiles** | `api/qualityprofiles` | ✅ Implemented | Both | Quality profile management |
| **Rules** | `api/rules` | ✅ Implemented | Both | Coding rule management |
| **Settings** | `api/settings` | ✅ Implemented | Both | Global and project settings |
| **Sources** | `api/sources` | ✅ Implemented | Both | Source code access |
| **System** | `api/system` | ✅ Implemented | SonarQube only | System information and health |
| **Time Machine** | `api/timemachine` | ❌ Not implemented | Both | Historical measures (deprecated) |
| **User Groups** | `api/user_groups` | ✅ Implemented | Both | User group management |
| **User Properties** | `api/user_properties` | ❌ Not implemented | SonarCloud only | User property management |
| **User Tokens** | `api/user_tokens` | ❌ Not implemented | Both | User token management |
| **Users** | `api/users` | ✅ Implemented | Both | User management (search deprecated) |
| **Webhooks** | `api/webhooks` | ❌ Not implemented | Both | Webhook management |
| **Web Services** | `api/webservices` | ❌ Not implemented | Both | API documentation |

Want to help? Check out our [contributing guide](#🤝-contributing) - we'd love your help implementing more APIs!

### ⚠️ Deprecated APIs

The following APIs or actions are marked as deprecated in the SonarQube Web API:

| API | Deprecated Action(s) | Deprecated Since | Notes |
|-----|---------------------|------------------|-------|
| **api/favourites** | `index` | 6.3 | Legacy API endpoint |
| **api/issues** | `set_severity`, `set_type` | 25 Aug, 2023 | Use newer issue management endpoints |
| **api/metrics** | `domains` | 7.7 | Domain-based metric categorization removed |
| **api/permissions** | `search_global_permissions`, `search_project_permissions` | 6.5 | Use newer permission search endpoints |
| **api/projects** | `bulk_update_key` | 7.6 | Use individual project key updates |
| **api/properties** | `index` | 6.3 | Entire API is deprecated |
| **api/qualitygates** | `unset_default` | 7.0 | Use `set_as_default` with different gate |
| **api/qualityprofiles** | `export`, `exporters`, `importers` | 18 March, 2025 | Profile export/import being redesigned |
| **api/qualityprofiles** | `restore_built_in` | 6.4 | Built-in profiles restored automatically |
| **api/timemachine** | `index` | 6.3 | Entire API is deprecated, use `api/measures/history` |
| **api/user_properties** | `index` | 6.3 | Removed as of version 6.3, use `api/favorites` and `api/notifications` instead |
| **api/users** | `search` | 10 February, 2025 | Use newer user search endpoints (will be dropped August 13, 2025) |

**Note**: This library may still provide support for some deprecated APIs for backward compatibility, but we recommend migrating to newer alternatives where available.

## 🔥 Examples

### 🔍 Search with Pagination

```typescript
// Automatically handle pagination with async iteration
for await (const project of client.projects.searchAll()) {
  console.log(`Found project: ${project.key}`);
}

// Or manually control pagination
const page1 = await client.projects.search()
  .pageSize(50)
  .page(1)
  .execute();
```

### 📊 Working with Measures

```typescript
// Get multiple metrics for a component
const measures = await client.measures.component({
  component: 'my-project',
  metricKeys: ['coverage', 'bugs', 'vulnerabilities']
});

// Get measure history
const history = await client.measures.history({
  component: 'my-project',
  metrics: ['coverage'],
  from: '2024-01-01'
});
```

### 🚨 Advanced Issue Filtering

```typescript
const criticalIssues = await client.issues.search()
  .withProjects(['my-project'])
  .withBranch('main')
  .withSeverities(['CRITICAL'])
  .withTypes(['BUG', 'VULNERABILITY'])
  .createdAfter('2024-01-01')
  .assignedTo('john.doe')
  .sortBy('SEVERITY')
  .execute();
```

### 🔒 Security Hotspots Management

```typescript
// Search for security hotspots in a project
const hotspots = await client.hotspots.search()
  .forProject('my-project')
  .needingReview()
  .execute();

// Get detailed information about a specific hotspot
const hotspotDetails = await client.hotspots.show({
  hotspot: 'hotspot-key-123'
});

// Change hotspot status to reviewed and mark as fixed
await client.hotspots.changeStatus({
  hotspot: 'hotspot-key-123',
  status: 'REVIEWED',
  resolution: 'FIXED',
  comment: 'Issue has been properly addressed'
});

// Advanced filtering for hotspots
const criticalHotspots = await client.hotspots.search()
  .forProject('my-project')
  .withStatus('TO_REVIEW')
  .onlyMine()
  .sinceLeakPeriod()
  .inFiles(['src/main/java/Security.java'])
  .pageSize(50)
  .execute();

// Use convenience methods for common filters
const fixedHotspots = await client.hotspots.search()
  .forProject('my-project')
  .fixed()
  .execute();

const safeHotspots = await client.hotspots.search()
  .forProject('my-project')
  .safe()
  .execute();

// Iterate through all hotspots requiring review
for await (const hotspot of client.hotspots.search()
  .forProject('my-project')
  .needingReview()
  .all()) {
  console.log(`Hotspot: ${hotspot.message} (${hotspot.vulnerabilityProbability} risk)`);
}
```

### 🗂️ Component Navigation

```typescript
// Get a component with its ancestors
const result = await client.components.show('my-project:src/main.ts');
console.log('Component:', result.component);
console.log('Ancestors:', result.ancestors);

// Navigate through component trees
const files = await client.components.tree()
  .component('my-project')
  .filesOnly()
  .sortByPath()
  .execute();

// Search for specific components with pagination
for await (const component of client.components.tree()
  .component('my-project')
  .query('Controller')
  .qualifiers(['FIL'])
  .all()) {
  console.log('Found file:', component.name);
}

// Get only direct children of a directory
const children = await client.components.tree()
  .component('my-project:src')
  .childrenOnly()
  .execute();
```

### ⭐ Managing User Favorites

```typescript
// Add a project to favorites
await client.favorites.add({
  component: 'my-project'
});

// Remove a project from favorites
await client.favorites.remove({
  component: 'my-project'
});

// Search favorites with pagination
const favorites = await client.favorites.search()
  .pageSize(50)
  .execute();

// Iterate through all favorites
for await (const favorite of client.favorites.searchAll()) {
  console.log(`Favorite project: ${favorite.name} (${favorite.key})`);
}
```

### 🌐 Working with Languages

```typescript
// Get all supported programming languages
const languages = await client.languages.list();
console.log('Supported languages:', languages.languages);

// Filter languages by pattern
const javaLangs = await client.languages.list({
  q: 'java'  // Matches 'java', 'javascript', etc.
});

// Limit the number of languages returned
const someLanguages = await client.languages.list({
  ps: 10  // Return only first 10 languages, 0 for all
});

// Iterate through all languages
for await (const language of client.languages.listAll()) {
  console.log(`Language: ${language.name} (${language.key})`);
}

// Filter while iterating
for await (const language of client.languages.listAll({ q: 'python' })) {
  console.log(`Found Python-related language: ${language.name}`);
}
```

### 📜 Working with Rules

```typescript
// List available rule repositories
const repositories = await client.rules.listRepositories();
console.log('Available rule repositories:', repositories.repositories);

// Filter repositories by language
const javaRepos = await client.rules.listRepositories({
  language: 'java'
});

// Search for rules with advanced filtering
const securityRules = await client.rules.search()
  .withTypes(['VULNERABILITY', 'SECURITY_HOTSPOT'])
  .withSeverities(['CRITICAL', 'BLOCKER'])
  .withTags(['security', 'owasp'])
  .withLanguages(['java', 'javascript'])
  .includeExternal()
  .execute();

// Search for rules in a specific quality profile
const profileRules = await client.rules.search()
  .inQualityProfile('java-sonar-way-12345')
  .withActivation(true)
  .execute();

// Get detailed information about a specific rule
const ruleDetails = await client.rules.show({
  key: 'java:S1234',
  organization: 'my-org',
  actives: true  // Include activation details
});

// List all available rule tags
const tags = await client.rules.listTags({
  organization: 'my-org',
  q: 'security'  // Filter tags containing 'security'
});

// Update a custom rule
await client.rules.update({
  key: 'java:S1234',
  organization: 'my-org',
  name: 'Updated Rule Name',
  severity: 'CRITICAL',
  tags: 'security,owasp-a1',
  markdown_description: 'Updated rule description in markdown'
});

// Search with Clean Code attributes (new in SonarQube 10+)
const cleanCodeRules = await client.rules.search()
  .withCleanCodeAttributeCategories(['INTENTIONAL', 'CONSISTENT'])
  .withImpactSeverities(['HIGH', 'MEDIUM'])
  .withImpactSoftwareQualities(['SECURITY', 'RELIABILITY'])
  .execute();

// Iterate through all rules with pagination
for await (const rule of client.rules.search()
  .withLanguages(['typescript'])
  .withTypes(['BUG'])
  .all()) {
  console.log(`Rule: ${rule.key} - ${rule.name} (${rule.severity})`);
}
```

### 🏅 Project Badges

```typescript
// Generate a quality gate badge SVG
const qualityGateBadge = await client.projectBadges.qualityGate({
  project: 'my-project',
  branch: 'main'
});
// Returns SVG content as string

// Generate a metric badge (e.g., coverage)
const coverageBadge = await client.projectBadges.measure({
  project: 'my-project',
  metric: 'coverage',
  branch: 'develop'
});

// Generate AI code assurance badge (requires Browse permission)
const aiBadge = await client.projectBadges.aiCodeAssurance({
  project: 'my-project'
});

// Use badges with security tokens for private projects
const privateBadge = await client.projectBadges.qualityGate({
  project: 'private-project',
  token: 'badge-specific-token'  // Different from API token
});

// Supported metrics for measure badges:
// 'coverage', 'ncloc', 'code_smells', 'sqale_rating', 
// 'security_rating', 'bugs', 'vulnerabilities', 
// 'duplicated_lines_density', 'reliability_rating', 
// 'alert_status', 'sqale_index'

// Example: Embed in README
const badge = await client.projectBadges.measure({
  project: 'my-project',
  metric: 'coverage'
});
// Use the SVG content in your README or web page
```

### 💚 System Health Monitoring

```typescript
// Check system health (SonarQube only)
const health = await client.system.health();
if (health.health === 'RED') {
  console.error('System is unhealthy:', health.causes);
}

// Simple ping check
const pong = await client.system.ping();
console.log(pong); // 'pong'
```

### 📈 Project Analyses Management

```typescript
// Search project analyses with events
const analyses = await client.projectAnalyses.search()
  .project('my-project')
  .branch('main')
  .category('VERSION')  // Filter by event category
  .from('2024-01-01')
  .to('2024-12-31')
  .execute();

// Iterate through all analyses
for await (const analysis of client.projectAnalyses.searchAll('my-project')) {
  console.log(`Analysis ${analysis.key} on ${analysis.date}`);
  analysis.events.forEach(event => {
    console.log(`  Event: ${event.name} (${event.category})`);
  });
}

// Create a version event on an analysis
const event = await client.projectAnalyses.createEvent({
  analysis: 'AU-Tpxb--iU5OvuD2FLy',
  category: 'VERSION',
  name: '5.6'
});

// Set analysis as New Code Period baseline
await client.projectAnalyses.setBaseline({
  analysis: 'AU-Tpxb--iU5OvuD2FLy',
  project: 'my-project',
  branch: 'main'  // Optional: for branch-specific baseline
});

// Unset manual baseline (restore automatic detection)
await client.projectAnalyses.unsetBaseline({
  project: 'my-project'
});

// Update an existing event
const updated = await client.projectAnalyses.updateEvent({
  event: 'AU-TpxcA-iU5OvuD2FL5',
  name: '5.6.1'
});

// Delete an analysis or event
await client.projectAnalyses.deleteAnalysis({ analysis: 'AU-TpxcA-iU5OvuD2FL1' });
await client.projectAnalyses.deleteEvent({ event: 'AU-TpxcA-iU5OvuD2FLz' });
```

### 🔀 Project Pull Requests

**Note**: These endpoints require the Branch plugin to be installed.

```typescript
// List pull requests for a project
const pullRequests = await client.projectPullRequests.list({
  project: 'my-project'
});

// Process pull request information
pullRequests.pullRequests.forEach(pr => {
  console.log(`PR #${pr.key}: ${pr.title}`);
  console.log(`  Branch: ${pr.branch} -> ${pr.base}`);
  console.log(`  Quality Gate: ${pr.status.qualityGateStatus}`);
  console.log(`  Issues: ${pr.status.bugs} bugs, ${pr.status.vulnerabilities} vulnerabilities`);
  
  // New fields available in v2 (Apr 2025)
  if (pr.pullRequestUuidV1) {
    console.log(`  UUID: ${pr.pullRequestUuidV1}`);
  }
  if (pr.pullRequestId) {
    console.log(`  ID: ${pr.pullRequestId}`);
  }
});

// Delete a pull request (requires Administer permission)
await client.projectPullRequests.delete({
  project: 'my-project',
  pullRequest: '1543'
});
```

### 🔐 Authentication

```typescript
// Validate current authentication
const validation = await client.authentication.validate();
if (validation.valid) {
  console.log('Authentication is valid');
} else {
  console.log('Authentication is invalid or expired');
}

// Logout current user (invalidates the session)
await client.authentication.logout();
console.log('Successfully logged out');

// Note: The validate() endpoint returns true for anonymous users
// Use it to check if credentials are properly configured
```

### 🏷️ Project Tags Management

```typescript
// Search for existing tags
const tags = await client.projectTags.search();
console.log('Available tags:', tags.tags);

// Search tags with filtering
const financeTags = await client.projectTags.search({
  q: 'finance',  // Search for tags containing 'finance'
  ps: 20        // Return up to 20 tags
});

// Set tags on a project (requires Administer permission)
await client.projectTags.set({
  project: 'my-project',
  tags: 'finance, offshore, production'
});

// Clear all tags from a project
await client.projectTags.set({
  project: 'my-project',
  tags: ''  // Empty string removes all tags
});

// Update tags for multiple projects (sequential)
const projects = ['project-1', 'project-2', 'project-3'];
for (const project of projects) {
  await client.projectTags.set({
    project,
    tags: 'legacy, needs-refactoring'
  });
}

// Update tags for multiple projects (parallel)
await Promise.all(
  projects.map(project =>
    client.projectTags.set({
      project,
      tags: 'legacy, needs-refactoring'
    })
  )
);
```

### 🔔 Managing Notifications

```typescript
// List current user's notifications
const result = await client.notifications.list();
console.log('Active notifications:', result.notifications);
console.log('Available channels:', result.channels);
console.log('Global notification types:', result.globalTypes);
console.log('Per-project notification types:', result.perProjectTypes);

// Add a global notification for new issues assigned to me
await client.notifications.add({
  type: GlobalNotificationType.ChangesOnMyIssue
});

// Add a project-specific notification for quality gate changes
await client.notifications.add({
  type: ProjectNotificationType.NewAlerts,
  project: 'my-project',
  channel: NotificationChannel.Email
});

// Remove a notification
await client.notifications.remove({
  type: GlobalNotificationType.ChangesOnMyIssue
});

// Manage notifications for another user (requires admin permissions)
const userNotifications = await client.notifications.list({
  login: 'john.doe'
});
```

### ⚙️ Settings Management

```typescript
// List all settings definitions
const definitions = await client.settings.listDefinitions();
console.log(`Found ${definitions.definitions.length} setting definitions`);

// List settings definitions for a specific component
const componentDefs = await client.settings.listDefinitions({
  component: 'my-project'
});

// Get current setting values
const allSettings = await client.settings.values().execute();
console.log('Current settings:', allSettings.settings);

// Get specific setting values
const specificSettings = await client.settings.values()
  .keys(['sonar.test.inclusions', 'sonar.exclusions'])
  .execute();

// Get component-specific settings
const projectSettings = await client.settings.values()
  .component('my-project')
  .execute();

// Set a simple string value
await client.settings.set()
  .key('sonar.links.scm')
  .value('git@github.com:MyOrg/my-project.git')
  .execute();

// Set multiple values for a setting
await client.settings.set()
  .key('sonar.exclusions')
  .values(['**/test/**', '**/vendor/**', '**/node_modules/**'])
  .execute();

// Set field values for property set settings
await client.settings.set()
  .key('sonar.issue.ignore.multicriteria')
  .fieldValues([
    { ruleKey: 'java:S1135', resourceKey: '**/test/**' },
    { ruleKey: 'java:S2589', resourceKey: '**/generated/**' }
  ])
  .execute();

// Set component-specific settings
await client.settings.set()
  .key('sonar.coverage.exclusions')
  .value('**/test/**,**/vendor/**')
  .component('my-project')
  .execute();

// Reset settings to their defaults
await client.settings.reset()
  .keys(['sonar.links.scm', 'sonar.debt.hoursInDay'])
  .execute();

// Reset component-specific settings
await client.settings.reset()
  .keys(['sonar.coverage.exclusions'])
  .component('my-project')
  .execute();

// Reset settings on a specific branch
await client.settings.reset()
  .keys(['sonar.coverage.exclusions'])
  .component('my-project')
  .branch('feature/my_branch')
  .execute();

// Add values incrementally using builder methods
await client.settings.set()
  .key('sonar.inclusions')
  .addValue('src/**')
  .addValue('lib/**')
  .addValue('app/**')
  .execute();

// Work with inherited settings
const orgSettings = await client.settings.values()
  .organization('my-org')
  .execute();

orgSettings.settings.forEach(setting => {
  if (setting.inherited) {
    console.log(`${setting.key} is inherited from ${setting.parentOrigin}`);
    console.log(`Parent value: ${setting.parentValue}`);
  }
});

// Note: The settings defined in conf/sonar.properties are read-only
// and cannot be changed through the API
```

### 🎯 Quality Profiles Management

```typescript
// Search for quality profiles
const profiles = await client.qualityProfiles.search()
  .language('java')
  .defaults(true)
  .execute();

// Create a new quality profile
const newProfile = await client.qualityProfiles.create({
  name: 'Strict Java Rules',
  language: 'java'
});

// Copy an existing profile
const copiedProfile = await client.qualityProfiles.copy({
  fromKey: 'sonar-way-java',
  toName: 'My Custom Java Profile'
});

// Activate rules on a profile using the builder pattern
const activation = await client.qualityProfiles.activateRules()
  .targetProfile('my-java-profile')
  .severities('CRITICAL,MAJOR')
  .types('BUG,VULNERABILITY')
  .targetSeverity('BLOCKER')
  .execute();
console.log(`Activated ${activation.succeeded} rules`);

// Associate projects with quality profiles
await client.qualityProfiles.addProject({
  key: 'my-java-profile',
  project: 'my-project'
});

// View quality profile changelog
for await (const change of client.qualityProfiles.changelog()
  .profile('my-java-profile')
  .since('2024-01-01')
  .all()) {
  console.log(`${change.date}: ${change.action} - ${change.ruleName}`);
}

// Compare two quality profiles
const comparison = await client.qualityProfiles.compare({
  leftKey: 'old-profile',
  rightKey: 'new-profile'
});
console.log(`Rules only in old: ${comparison.inLeft.length}`);
console.log(`Rules only in new: ${comparison.inRight.length}`);
console.log(`Modified rules: ${comparison.modified.length}`);

// Backup and restore profiles
const backup = await client.qualityProfiles.backup({
  key: 'my-java-profile'
});
// Save backup to file...

const restored = await client.qualityProfiles.restore({
  backup: backup,
  organization: 'my-org'
});
console.log(`Restored profile: ${restored.profile.name}`);
console.log(`Rules restored: ${restored.ruleSuccesses}`);

// Set a profile as default for a language
await client.qualityProfiles.setDefault({
  key: 'strict-java-profile'
});

// View profile inheritance hierarchy
const inheritance = await client.qualityProfiles.inheritance({
  key: 'custom-java-profile'
});
console.log('Parent profile:', inheritance.ancestors[0]?.name);
console.log('Child profiles:', inheritance.children.map(c => c.name));

// List projects associated with a profile
for await (const project of client.qualityProfiles.projects()
  .profile('my-java-profile')
  .selected('selected')
  .all()) {
  console.log(`Associated project: ${project.name}`);
}
```

### 👥 User Groups Management

```typescript
// Search for user groups
const groups = await client.userGroups.search()
  .organization('my-org')
  .query('admin')
  .fields(['name', 'membersCount'])
  .pageSize(50)
  .execute();

// Create a new group
const newGroup = await client.userGroups.create({
  name: 'developers',
  description: 'All developers in the organization',
  organization: 'my-org'
});

// Update group information
await client.userGroups.update({
  id: '42',
  name: 'senior-developers',
  description: 'Senior developers only'
});

// Add users to a group
await client.userGroups.addUser({
  name: 'developers',
  login: 'john.doe',
  organization: 'my-org'
});

// Remove users from a group
await client.userGroups.removeUser({
  id: '42',
  login: 'jane.smith',
  organization: 'my-org'
});

// Get users with membership information
const users = await client.userGroups.users()
  .groupName('developers')
  .organization('my-org')
  .selected('all')  // 'all', 'selected', or 'deselected'
  .query('john')
  .execute();

users.users.forEach(user => {
  console.log(`${user.login}: ${user.selected ? 'member' : 'not member'}`);
});

// Iterate through all groups
for await (const group of client.userGroups.searchAll('my-org')) {
  console.log(`Group: ${group.name} (${group.membersCount} members)`);
}

// Iterate through all users in a group
for await (const user of client.userGroups.users()
  .groupName('developers')
  .organization('my-org')
  .all()) {
  if (user.selected) {
    console.log(`Member: ${user.name} (${user.login})`);
  }
}

// Delete a group (cannot delete default groups)
await client.userGroups.delete({
  name: 'old-team',
  organization: 'my-org'
});
```

### 📋 Code Duplications

```typescript
// Get duplications for a specific file
const duplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php'
});

console.log(`Found ${duplications.duplications.length} duplication sets`);
console.log(`Involving ${duplications.files.length} files`);

// Process each duplication set
duplications.duplications.forEach((duplication, index) => {
  console.log(`\nDuplication set ${index + 1}:`);
  duplication.blocks.forEach((block, blockIndex) => {
    // The _ref field is a reference identifier for this duplication block
    console.log(`  Block ${blockIndex + 1} (ref: ${block._ref}): lines ${block.from}-${block.to} (${block.size} lines)`);
  });
});

// Access file information separately
duplications.files.forEach(file => {
  console.log(`Involved file: ${file.name} (${file.key})`);
});

// Get duplications for a file on a specific branch
const branchDuplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php',
  branch: 'feature/my_branch'
});

// Get duplications for a file in a pull request
const prDuplications = await client.duplications.show({
  key: 'my_project:/src/foo/Bar.php',
  pullRequest: '123'
});
```

### 🌿 Project Branches Management

```typescript
// List all branches for a project
const branches = await client.projectBranches.list()
  .withProject('my-project')
  .execute();

console.log(`Found ${branches.branches.length} branches`);
branches.branches.forEach(branch => {
  console.log(`Branch: ${branch.name} (${branch.isMain ? 'main' : 'feature'})`);
  console.log(`  Status: ${branch.qualityGateStatus}`);
  console.log(`  Issues: ${branch.issueCount}`);
});

// List specific branches by IDs
const specificBranches = await client.projectBranches.list()
  .withBranchIds(['uuid1', 'uuid2', 'uuid3'])
  .execute();

// Delete a non-main branch (requires admin rights)
await client.projectBranches.delete({
  project: 'my-project',
  branch: 'feature/old-feature'
});

// Rename the main branch (requires admin rights)
await client.projectBranches.rename({
  project: 'my-project',
  name: 'main'  // Rename default 'master' to 'main'
});

// Filter branches by quality gate status
const failingBranches = branches.branches.filter(
  branch => branch.qualityGateStatus === 'ERROR'
);

// Find branches with critical issues
const criticalBranches = branches.branches.filter(
  branch => branch.bugCount && branch.bugCount > 0 || 
            branch.vulnerabilityCount && branch.vulnerabilityCount > 0
);
```

### 👥 User Management

```typescript
// Search for users (deprecated but still supported)
const users = await client.users.search()
  .query('john')        // Search by login, name, or email
  .pageSize(50)         // Limit results
  .execute();

console.log(`Found ${users.users.length} users`);
users.users.forEach(user => {
  console.log(`User: ${user.name} (${user.login})`);
  if (user.active) {
    console.log('  Status: Active');
  }
  // Additional fields available for admin users:
  if (user.email) console.log(`  Email: ${user.email}`);
  if (user.lastConnectionDate) console.log(`  Last connection: ${user.lastConnectionDate}`);
});

// Search by specific user IDs
const specificUsers = await client.users.search()
  .ids(['uuid-1', 'uuid-2', 'uuid-3'])
  .execute();

// Iterate through all users with pagination
for await (const user of client.users.searchAll()) {
  console.log(`Processing user: ${user.name}`);
}

// Get groups for a specific user
const userGroups = await client.users.groups()
  .login('john.doe')
  .organization('my-org')
  .execute();

console.log(`User belongs to ${userGroups.groups.length} groups`);
userGroups.groups.forEach(group => {
  console.log(`Group: ${group.name}`);
  if (group.description) console.log(`  Description: ${group.description}`);
  if (group.default) console.log('  This is a default group');
});

// Filter groups by name
const adminGroups = await client.users.groups()
  .login('john.doe')
  .organization('my-org')
  .query('admin')         // Search for groups containing 'admin'
  .selected('all')        // Show all groups (selected, deselected, or all)
  .execute();

// Iterate through all groups for a user
for await (const group of client.users.groupsAll('john.doe', 'my-org')) {
  console.log(`User group: ${group.name}`);
}

// Advanced group filtering
const selectedGroups = await client.users.groups()
  .login('john.doe')
  .organization('my-org')
  .selected('selected')   // Only groups the user belongs to
  .pageSize(25)
  .execute();

// Note: The users/search endpoint is deprecated since Feb 10, 2025
// and will be removed on Aug 13, 2025. Consider migrating to newer
// user management endpoints when they become available.
```

## 🛡️ Error Handling

The library provides rich error types to help you handle different failure scenarios gracefully:

```typescript
import { 
  AuthenticationError, 
  RateLimitError,
  NotFoundError,
  NetworkError 
} from 'sonarqube-web-api-client';

try {
  const projects = await client.projects.search().execute();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid token or authentication expired
    console.error('Please check your authentication token');
  } else if (error instanceof RateLimitError) {
    // Too many requests
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    // Implement retry logic here
  } else if (error instanceof NotFoundError) {
    // Resource doesn't exist
    console.error(`Resource not found: ${error.resource}`);
  } else if (error instanceof NetworkError) {
    // Network connectivity issues
    console.error('Network error:', error.cause);
  }
}
```

## 🏗️ Resource-Based API Design

The library is organized around API resources, making it intuitive and easy to discover available methods:

```typescript
const client = new SonarQubeClient(baseUrl, token);

// Each resource has its own namespace
client.authentication   // Authentication endpoints
client.projects        // Project management
client.issues          // Issue tracking
client.measures        // Code metrics
client.qualityGates    // Quality gate management
client.qualityProfiles // Quality profile management
client.components      // Component navigation
client.languages       // Programming languages
client.sources         // Source code access
client.system          // System administration
client.userGroups      // User group management
// ... and many more
```

Each resource client provides methods that map directly to SonarQube API endpoints, with full TypeScript support for parameters and responses.

### 🔨 Builder Pattern for Complex Queries

Many APIs support complex filtering and pagination. The library provides a fluent builder pattern for these cases:

```typescript
// Simple method calls for basic operations
const project = await client.projects.create({
  key: 'my-project',
  name: 'My Project'
});

// Builder pattern for complex queries
const issues = await client.issues.search()
  .withProjects(['my-project'])
  .withSeverities(['CRITICAL', 'MAJOR'])
  .createdAfter('2024-01-01')
  .assignedTo('developer@example.com')
  .sortBy('SEVERITY')
  .pageSize(50)
  .execute();

// Async iteration for large datasets
for await (const issue of client.issues.search()
  .withSeverities(['CRITICAL'])
  .all()) {
  console.log(`Critical issue: ${issue.key}`);
}
```

## 🔌 API Compatibility

The library supports both SonarQube and SonarCloud APIs. Check the [API Implementation Status](#📊-api-implementation-status) table above for specific availability details.

### 🏢 Organization Support (SonarCloud)

For SonarCloud users with multiple organizations, you can specify the organization when creating the client:

```typescript
// SonarCloud with organization
const client = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'my-organization');

// The organization parameter is automatically included in API requests
const projects = await client.projects.search().execute();
// → GET /api/projects/search?organization=my-organization
```

### 🔄 Migration from v0.1.x

**Version 0.2.0 introduces breaking changes.** The `token` parameter is now required:

```typescript
// ❌ v0.1.x - token was optional
const client = new SonarQubeClient('https://sonarqube.example.com');

// ✅ v0.2.0 - token is required
const client = new SonarQubeClient('https://sonarqube.example.com', 'your-token');

// ✅ v0.2.0 - with organization support
const client = new SonarQubeClient('https://sonarcloud.io', 'your-token', 'your-org');
```

## 🛠️ Development

Want to contribute? Awesome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/sapientpants/sonarqube-web-api-client.git
cd sonarqube-web-api-client

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the library
pnpm build

# Run linting
pnpm lint

# Fix formatting
pnpm format
```

### 🏗️ Architecture

The library follows a modular, resource-based architecture:

- Each API resource has its own client class
- Builder pattern for complex queries
- Shared base client for common functionality
- Comprehensive TypeScript types
- MSW (Mock Service Worker) for testing

## 🤝 Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🔧 Code contributions

Check out our [issues](https://github.com/sapientpants/sonarqube-web-api-client/issues) page to see what we're working on. Feel free to pick up any issue marked as "good first issue" or "help wanted".

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using TypeScript
- Tested with [MSW](https://mswjs.io/) for reliable API mocking
- Inspired by modern API client design patterns

---

<p align="center">
  ⭐ If you find this library helpful, please consider giving it a star on GitHub!
</p>

<p align="center">
  Made with ❤️ by the open source community
</p>
