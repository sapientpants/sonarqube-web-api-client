import { PaginatedBuilder } from '../../core/builders';
import type {
  SearchIssuesRequest,
  SearchIssuesResponse,
  Issue,
  IssueSeverity,
  IssueStatus,
  IssueType,
  IssueResolution,
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
   * Filter by rule keys
   */
  withRules(rules: string[]): this {
    return this.setParam('rules', rules);
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
