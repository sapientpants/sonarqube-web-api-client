import { PaginatedBuilder } from '../../core/builders';
import type {
  SearchIssuesRequest,
  SearchIssuesResponse,
  Issue,
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueResolution,
  ImpactSeverity,
  ImpactSoftwareQuality,
  CleanCodeAttributeCategory,
  IssueStatusNew,
  FacetMode,
  IssueScope,
} from './types';

/**
 * Builder for constructing complex issue search queries
 */
export class SearchIssuesBuilder extends PaginatedBuilder<
  SearchIssuesRequest,
  SearchIssuesResponse,
  Issue
> {
  /**
   * Filter by component keys (files, directories, projects)
   */
  withComponents(componentKeys: string[]): this {
    return this.setParam('componentKeys', componentKeys);
  }

  /**
   * Filter by component keys (alias for withComponents)
   */
  componentKeys(componentKeys: string[]): this {
    return this.withComponents(componentKeys);
  }

  /**
   * Filter by directory paths
   */
  withDirectories(directories: string[]): this {
    return this.setParam('directories', directories);
  }

  /**
   * Filter by file paths
   */
  withFiles(files: string[]): this {
    return this.setParam('files', files);
  }

  /**
   * Filter by project keys
   */
  withProjects(projectKeys: string[]): this {
    return this.setParam('projects', projectKeys);
  }

  /**
   * Filter by issue statuses
   */
  withStatuses(statuses: IssueStatus[]): this {
    return this.setParam('statuses', statuses);
  }

  /**
   * Filter by issue types
   */
  withTypes(types: IssueType[]): this {
    return this.setParam('types', types);
  }

  /**
   * Filter by issue severities
   */
  withSeverities(severities: IssueSeverity[]): this {
    return this.setParam('severities', severities);
  }

  /**
   * Filter by issue resolutions
   */
  withResolutions(resolutions: IssueResolution[]): this {
    return this.setParam('resolutions', resolutions);
  }

  /**
   * Filter by assignee login
   */
  assignedTo(assignee: string): this {
    return this.setParam('assignees', [assignee]);
  }

  /**
   * Filter by multiple assignees
   */
  assignedToAny(assignees: string[]): this {
    return this.setParam('assignees', assignees);
  }

  /**
   * Filter by author login
   */
  byAuthor(author: string): this {
    return this.setParam('authors', [author]);
  }

  /**
   * Filter by multiple authors
   */
  byAuthors(authors: string[]): this {
    return this.setParam('authors', authors);
  }

  /**
   * Filter by a single author (alternative to byAuthors for single values)
   */
  byAuthorSingle(author: string): this {
    return this.setParam('author', author);
  }

  /**
   * Filter by creation date - issues created after this date
   */
  createdAfter(date: string): this {
    return this.setParam('createdAfter', date);
  }

  /**
   * Filter by creation date - issues created before this date
   */
  createdBefore(date: string): this {
    return this.setParam('createdBefore', date);
  }

  /**
   * Filter by creation date - issues created at this exact date
   */
  createdAt(date: string): this {
    return this.setParam('createdAt', date);
  }

  /**
   * Filter by creation date - issues created in the last period (e.g., '1w', '1m', '1y')
   */
  createdInLast(period: string): this {
    return this.setParam('createdInLast', period);
  }

  /**
   * Filter by tags
   */
  withTags(tags: string[]): this {
    return this.setParam('tags', tags);
  }

  /**
   * Filter by programming languages
   */
  withLanguages(languages: string[]): this {
    return this.setParam('languages', languages);
  }

  /**
   * Filter by issue scopes (MAIN, TEST, OVERALL)
   */
  withScopes(scopes: IssueScope[]): this {
    return this.setParam('scopes', scopes);
  }

  /**
   * Filter issues on a specific branch
   */
  onBranch(branch: string): this {
    return this.setParam('branch', branch);
  }

  /**
   * Filter issues for a specific pull request
   */
  onPullRequest(pullRequestId: string): this {
    return this.setParam('pullRequest', pullRequestId);
  }

  /**
   * Filter by rule keys
   */
  withRules(rules: string[]): this {
    return this.setParam('rules', rules);
  }

  /**
   * Filter by rule keys (alias for withRules)
   */
  rules(rules: string[]): this {
    return this.withRules(rules);
  }

  /**
   * Filter by specific issue keys
   */
  withIssues(issueKeys: string[]): this {
    return this.setParam('issues', issueKeys);
  }

  /**
   * Filter by CWE identifiers
   */
  withCwe(cweIds: string[]): this {
    return this.setParam('cwe', cweIds);
  }

  /**
   * Filter by OWASP Top 10 categories
   */
  withOwaspTop10(categories: string[]): this {
    return this.setParam('owaspTop10', categories);
  }

  /**
   * Filter by SANS Top 25 categories
   */
  withSansTop25(categories: string[]): this {
    return this.setParam('sansTop25', categories);
  }

  /**
   * Filter by SonarSource security categories
   */
  withSonarSourceSecurity(categories: string[]): this {
    return this.setParam('sonarsourceSecurityCategory', categories);
  }

  /**
   * Filter by SonarSource security categories (new parameter name)
   */
  withSonarSourceSecurityNew(categories: string[]): this {
    return this.setParam('sonarsourceSecurity', categories);
  }

  /**
   * Filter by Clean Code attribute categories
   */
  withCleanCodeAttributeCategories(categories: CleanCodeAttributeCategory[]): this {
    return this.setParam('cleanCodeAttributeCategories', categories);
  }

  /**
   * Filter by impact severities (Clean Code taxonomy)
   */
  withImpactSeverities(severities: ImpactSeverity[]): this {
    return this.setParam('impactSeverities', severities);
  }

  /**
   * Filter by software quality impacts (Clean Code taxonomy)
   */
  withImpactSoftwareQualities(qualities: ImpactSoftwareQuality[]): this {
    return this.setParam('impactSoftwareQualities', qualities);
  }

  /**
   * Filter by new issue statuses (replaces deprecated statuses)
   */
  withIssueStatuses(statuses: IssueStatusNew[]): this {
    return this.setParam('issueStatuses', statuses);
  }

  /**
   * Filter by OWASP Top 10 2021 categories
   */
  withOwaspTop10v2021(categories: string[]): this {
    return this.setParam('owaspTop10v2021', categories);
  }

  /**
   * Filter by organization
   */
  inOrganization(organization: string): this {
    return this.setParam('organization', organization);
  }

  /**
   * Filter by organization (alias for inOrganization)
   */
  organization(organization: string): this {
    return this.inOrganization(organization);
  }

  /**
   * Set facet mode for aggregations
   */
  withFacetMode(mode: FacetMode): this {
    return this.setParam('facetMode', mode);
  }

  /**
   * Filter for assigned issues only
   */
  onlyAssigned(): this {
    return this.setParam('assigned', true);
  }

  /**
   * Filter for unassigned issues only
   */
  onlyUnassigned(): this {
    return this.setParam('assigned', false);
  }

  /**
   * Filter for resolved issues only
   */
  onlyResolved(): this {
    return this.setParam('resolved', true);
  }

  /**
   * Filter for unresolved issues only
   */
  onlyUnresolved(): this {
    return this.setParam('resolved', false);
  }

  /**
   * Filter for issues in new code period only
   */
  inNewCodePeriod(): this {
    return this.setParam('inNewCodePeriod', true);
  }

  /**
   * Filter for issues since leak period only
   */
  sinceLeakPeriod(): this {
    return this.setParam('sinceLeakPeriod', true);
  }

  /**
   * Restrict search to issues on component level only (not descendants)
   */
  onComponentOnly(): this {
    return this.setParam('onComponentOnly', true);
  }

  /**
   * Set sorting field and order
   */
  sortBy(field: string, ascending = true): this {
    this.setParam('s', field);
    return this.setParam('asc', ascending);
  }

  /**
   * Include additional fields in the response
   */
  withAdditionalFields(fields: string[]): this {
    return this.setParam('additionalFields', fields);
  }

  /**
   * Request facets for aggregated data
   */
  withFacets(facets: string[]): this {
    return this.setParam('facets', facets);
  }

  /**
   * Execute the search and return a single page
   */
  async execute(): Promise<SearchIssuesResponse> {
    return this.executor(this.params as SearchIssuesRequest);
  }

  /**
   * Get items from response for pagination
   */
  protected getItems(response: SearchIssuesResponse): Issue[] {
    return response.issues;
  }
}
